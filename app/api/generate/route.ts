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
import { idempotencyTracker, generateRequestId } from '@/lib/utils/idempotency'

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

async function handleChatRequest(
  body: GenerateRequestBody,
  chatMessages: ChatMessage[],
  requestId: string
) {
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

export async function POST(request: NextRequest) {
  // Auth guard: require valid Bearer token (validates against backend)
  const authError = await requireAuth(request)
  if (authError) return authError

  let body: GenerateRequestBody
  try {
    body = (await request.json()) as GenerateRequestBody
  } catch {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 })
  }

  const { messages, useChat = false, command, provider, images, imageUrl, model } = body
  const hasImages = !!(images && images.length > 0) || !!imageUrl

  // Generate idempotency key for this request
  const requestId = generateRequestId()
  const endpoint = '/api/generate'
  const method = 'POST'
  const idempotencyKey = idempotencyTracker.generateKey(endpoint, method, {
    messages,
    useChat,
    command,
    provider,
    images,
    imageUrl,
    model,
  })

  try {
    console.log('[Generate API] 接收到的请求:', { provider, model, useChat, hasImages })
    console.log('[Generate API] 实际使用的 AI 提供商:', getAIProvider(provider))
    console.log('[Generate API] Request ID:', requestId)

    // Check for duplicate in-flight requests
    if (idempotencyTracker.isRequestPending(idempotencyKey)) {
      console.log('[Generate API] Request already in progress, waiting for result')
      const pendingRequest = idempotencyTracker.getPendingRequest<unknown>(idempotencyKey)
      if (pendingRequest) {
        // For streaming responses, we can't directly return the pending result
        // Instead, we return a response indicating the request is being processed
        // The client should implement retry logic with the same request ID
        return NextResponse.json(
          {
            error: '请求正在处理中',
            requestId,
            message: '相同的请求正在处理，请稍后重试',
          },
          {
            status: 409,
            headers: {
              'X-Request-ID': requestId,
              'Retry-After': '5',
            },
          }
        )
      }
    }

    if (useChat && messages && messages.length > 0) {
      const response = await handleChatRequest(
        body,
        buildChatMessages(messages, command),
        requestId
      )
      // Note: Streaming responses can't be easily deduplicated
      // The idempotency check above helps prevent duplicate starts
      return response
    }

    return await handleGenerateRequest(body)
  } catch (error: unknown) {
    console.error('AI API错误:', error)
    return NextResponse.json({ error: getErrorMessage(error, provider) }, { status: 500 })
  }
}
