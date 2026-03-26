import { NextRequest, NextResponse } from 'next/server'
import {
  DEFAULT_MODEL,
  generatePrompt,
  getAIProvider,
  getProviderFallbackMessage,
} from './_lib/config'
import {
  callGitHubModelsAPI,
  callMiniMaxAPI,
  callOllamaChatAPI,
  callOllamaGenerateAPI,
  callZhipuAIAPI,
} from './_lib/clients'
import {
  createGitHubStreamResponse,
  createMiniMaxStreamResponse,
  createStreamResponse,
  createZhipuAIStreamResponse,
} from './_lib/streams'
import type { ChatMessage, GenerateRequestBody } from './_lib/types'
import { requireAuth } from '../_lib/auth-guard'
import { getIdempotencyKey, serverIdempotency } from '@/lib/server/idempotency'
import { redisDistributedLock } from '@/lib/server/distributed-lock'

function buildChatMessages(messages: ChatMessage[], command?: string): ChatMessage[] {
  if (messages.some(m => m.role === 'system')) return messages
  return [
    {
      role: 'system',
      content: command ?? '你是一个有用的AI助理，请用中文回答问题。',
    },
    ...messages,
  ]
}

function getPromptTokens(messages: ChatMessage[]): number {
  return Math.ceil(messages.reduce((acc, message) => acc + message.content.length, 0) / 4)
}

function getErrorMessage(error: unknown, provider?: GenerateRequestBody['provider']): string {
  const isNetworkOrFetch = error instanceof Error && (error.message?.includes('fetch') ?? false)
  const actualProvider = getAIProvider(provider)
  if (error instanceof Error) {
    return isNetworkOrFetch ? getProviderFallbackMessage(actualProvider) : error.message
  }
  return 'AI服务发生未知错误'
}

async function handleChatRequest(body: GenerateRequestBody, chatMessages: ChatMessage[]) {
  const { provider, images, imageUrl, model } = body
  const actualProvider = getAIProvider(provider)
  const promptTokens = getPromptTokens(chatMessages)

  if (actualProvider === 'github') {
    const githubResponse = await callGitHubModelsAPI(chatMessages)
    return createGitHubStreamResponse(githubResponse, promptTokens)
  }

  if (actualProvider === 'minimax') {
    const minimaxResponse = await callMiniMaxAPI(chatMessages, images)
    return createMiniMaxStreamResponse(minimaxResponse)
  }

  if (actualProvider === 'zhipuai') {
    const zhipuaiResponse = await callZhipuAIAPI(chatMessages, images, imageUrl, model)
    return createZhipuAIStreamResponse(zhipuaiResponse)
  }

  const ollamaResponse = await callOllamaChatAPI(chatMessages, model)
  return createStreamResponse(ollamaResponse, '', promptTokens)
}

async function handleGenerateRequest(body: GenerateRequestBody) {
  const { option, text = '', command, model } = body

  if (!option || !text.trim()) {
    return NextResponse.json({ error: '缺少必要参数：option 和 text' }, { status: 400 })
  }

  const prompt = generatePrompt(option, text, command)
  const ollamaResponse = await callOllamaGenerateAPI(prompt, model ?? DEFAULT_MODEL)
  return createStreamResponse(ollamaResponse, prompt)
}

/**
 * Generate a content-based idempotency key for generate requests
 * Uses provider + model + prompt hash to identify duplicate requests
 */
function generateGenerateIdemKey(body: GenerateRequestBody): string {
  const content = JSON.stringify({
    provider: body.provider,
    model: body.model,
    useChat: body.useChat,
    messages: body.messages,
    option: body.option,
    text: body.text,
    command: body.command,
    images: body.images,
    imageUrl: body.imageUrl,
  })
  
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  
  return `gen_${Math.abs(hash).toString(36)}`
}

export async function POST(request: NextRequest) {
  // Auth guard: require valid Bearer token
  const authError = requireAuth(request)
  if (authError) return authError

  let body: GenerateRequestBody
  try {
    body = (await request.json()) as GenerateRequestBody
  } catch {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 })
  }

  const { messages, useChat = false, command, provider, images, imageUrl, model } = body
  const hasImages = !!(images && images.length > 0) || !!imageUrl

  try {
    console.log('[Generate API] 接收到的请求:', { provider, model, useChat, hasImages })
    console.log('[Generate API] 实际使用的 AI 提供商:', getAIProvider(provider))

    // Get idempotency key from header or generate from content
    const headerKey = getIdempotencyKey(request)
    const contentKey = generateGenerateIdemKey(body)
    const idempotencyKey = headerKey || contentKey

    // For streaming responses, we need both a lock and idempotency:
    // 1. Distributed lock: Serializes concurrent requests with same content
    //    to prevent race conditions where multiple could pass idempotency check
    // 2. Idempotency: Detects duplicate submissions and returns cached results
    // The lock is acquired FIRST to serialize access, then idempotency handles
    // duplicate detection within the critical section
    // Lock TTL should be >= idempotency TTL to ensure protection throughout
    const lockResource = `generate:${contentKey}`
    const lockResult = await redisDistributedLock.acquire(lockResource, {
      ttl: 5 * 60 * 1000, // 5 minutes TTL (same as idempotency TTL)
      maxRetries: 0,
    })

    if (!lockResult.acquired) {
      // Another request with the same content is already being processed
      // For streaming, we can't return the same stream, so we return an error
      return NextResponse.json(
        { error: '相同的请求正在处理中，请稍后重试' },
        { status: 409 }
      )
    }

    try {
      // Use idempotency handler to prevent duplicate processing
      const idemResult = await serverIdempotency.withIdempotency(
        `generate:${idempotencyKey}`,
        async () => {
          if (useChat && messages && messages.length > 0) {
            return await handleChatRequest(body, buildChatMessages(messages, command))
          }
          return await handleGenerateRequest(body)
        },
        { ttl: 5 * 60 * 1000, cacheResults: false } // Don't cache streaming responses
      )

      if (idemResult.isDuplicate) {
        // Check if it's a streaming response that completed but couldn't return cached result
        if (idemResult.error?.includes('result was not cached')) {
          // This is a duplicate of a streaming request that completed
          // We can't replay the stream, so return conflict
          return NextResponse.json(
            { error: '相同的请求已完成但无法返回缓存结果，请稍后重试' },
            { status: 409 }
          )
        }
        // Request is still being processed (in-flight)
        return NextResponse.json(
          { error: '相同的请求正在处理中，请稍后重试' },
          { status: 409 }
        )
      }

      if (idemResult.error) {
        return NextResponse.json({ error: idemResult.error }, { status: 500 })
      }

      // Verify result exists before returning (should always be defined for streaming responses)
      if (!idemResult.result) {
        console.error('[Generate API] Idempotency returned no error but no result')
        return NextResponse.json({ error: '处理请求时发生未知错误' }, { status: 500 })
      }

      // Return the streaming response - idempotency was successful
      // We MUST return here to avoid falling through to direct handling
      // which could cause duplicate processing
      return idemResult.result as NextResponse
    } finally {
      // Release the lock
      if (lockResult.token) {
        await redisDistributedLock.release(lockResource, lockResult.token)
      }
    }
  } catch (error: unknown) {
    console.error('AI API错误:', error)
    return NextResponse.json({ error: getErrorMessage(error, provider) }, { status: 500 })
  }
}
