'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { ChatMessage } from '../../chat/types'
import { callBrowserLocalOllamaChatAPI } from '../../chat/hooks/browserOllama'
import { readAiChatStream, readOllamaChatStream } from '../../chat/hooks/chatStream'
import {
  getStoredOllamaModel,
  resolveOllamaModelSelection,
  setStoredOllamaModel,
} from '../../chat/hooks/modelStorage'
import { useOllamaAccessMode } from '../../chat/hooks/ollamaAccessMode'
import { useOllamaModels, type OllamaModelListItem } from '../../chat/hooks/useOllamaModels'
import { authenticatedInternalFetch } from '@/lib/api/internal-auth'

interface UseKnowledgeChatOptions {
  open?: boolean
  initialMessages?: ChatMessage[]
}

type SearchMethod = 'simple' | 'rag'

const EMBEDDING_MODEL_PREFIXES = ['qwen3-embedding', 'embeddinggemma', 'nomic-embed-text']
const isEmbeddingModel = (m: string) => EMBEDDING_MODEL_PREFIXES.some(p => m.startsWith(p))

interface KnowledgeChatRequestPayload {
  messages: ChatMessage[]
  useContext: boolean
  searchMethod: SearchMethod
  model: string
  provider: 'ollama' | 'minimax'
}

interface UseKnowledgeChatReturn {
  prompt: string
  setPrompt: (value: string) => void
  messages: ChatMessage[]
  displayMessages: ChatMessage[]
  hasMessages: boolean
  completion: string | undefined
  isLoading: boolean
  ollamaModels: OllamaModelListItem[]
  isLoadingOllamaModels: boolean
  useContext: boolean
  setUseContext: (value: boolean) => void
  searchMethod: SearchMethod
  setSearchMethod: (value: SearchMethod) => void
  model: string
  setModel: (value: string) => void
  provider: 'ollama' | 'minimax'
  setProvider: (value: 'ollama' | 'minimax') => void
  stop: () => void
  handleSend: () => void
  handleClear: () => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

async function callKnowledgeChatAPI(
  payload: KnowledgeChatRequestPayload,
  signal?: AbortSignal
): Promise<Response> {
  return authenticatedInternalFetch('/api/knowledge/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  })
}

async function prepareKnowledgeChatMessages(
  payload: KnowledgeChatRequestPayload,
  signal?: AbortSignal
): Promise<ChatMessage[]> {
  const response = await authenticatedInternalFetch('/api/knowledge/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      prepareOnly: true,
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = (await response.json()) as { messages?: ChatMessage[] }
  return Array.isArray(data.messages) ? data.messages : []
}

export function useKnowledgeChat(options: UseKnowledgeChatOptions = {}): UseKnowledgeChatReturn {
  const { open, initialMessages = [] } = options
  const { effectiveOllamaAccessMode } = useOllamaAccessMode()

  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [completion, setCompletion] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [useContext, setUseContext] = useState(true)
  const [searchMethod, setSearchMethod] = useState<SearchMethod>('rag')
  const [provider, setProvider] = useState<'ollama' | 'minimax'>(() => {
    // 从 localStorage 读取，默认使用 ollama
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('knowledge_provider')
      return (saved as 'ollama' | 'minimax') || 'ollama'
    }
    return 'ollama'
  })
  const [model, setModel] = useState<string>(() => getStoredOllamaModel())

  const abortControllerRef = useRef<AbortController | null>(null)
  const hasAppliedInitialMessagesRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { ollamaModels, isLoadingOllamaModels } = useOllamaModels({
    enabled: Boolean(open) && provider === 'ollama',
  })

  // 过滤掉 system 消息用于显示
  const displayMessages = messages.filter(m => m.role !== 'system')
  const hasMessages = displayMessages.length > 0

  useEffect(() => {
    if (provider !== 'ollama' || isLoadingOllamaModels) {
      return
    }

    const nextModel = resolveOllamaModelSelection(model, ollamaModels)
    if (nextModel !== model) {
      setModel(nextModel)
    }
  }, [isLoadingOllamaModels, model, ollamaModels, provider])

  useEffect(() => {
    if (hasAppliedInitialMessagesRef.current || initialMessages.length === 0) {
      return
    }
    if (messages.length > 0) {
      hasAppliedInitialMessagesRef.current = true
      return
    }
    setMessages(initialMessages)
    hasAppliedInitialMessagesRef.current = true
  }, [initialMessages, messages.length])

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, completion, isLoading])

  // 停止生成
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
    setCompletion('')
  }, [])

  // 清除对话
  const handleClear = useCallback(() => {
    stop()
    setMessages([])
    setCompletion('')
    setPrompt('')
  }, [stop])

  // 发送消息
  const handleSend = useCallback(async () => {
    if (!prompt.trim() || isLoading) return

    if (provider === 'ollama' && !model) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            '错误: 当前 Ollama 地址下没有可用模型，请先在 /dashboard?section=ollama 检查地址和 ollama list。',
        },
      ])
      return
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt.trim(),
    }

    // 添加用户消息到历史
    const newMessages: ChatMessage[] = [...messages, userMessage]
    setMessages(newMessages)
    setPrompt('')
    setIsLoading(true)
    setCompletion('')

    // 创建 abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      // 检索/embedding 模型只发当前一条用户消息，减少请求体
      const messagesToSend =
        provider === 'minimax' ? newMessages : isEmbeddingModel(model) ? [userMessage] : newMessages

      const payload: KnowledgeChatRequestPayload = {
        messages: messagesToSend,
        useContext,
        searchMethod,
        model,
        provider,
      }

      let response: Response
      let isBrowserLocalOllamaResponse = false

      if (provider === 'ollama') {
        if (effectiveOllamaAccessMode === 'browser') {
          const preparedMessages = await prepareKnowledgeChatMessages(
            payload,
            abortController.signal
          )
          response = await callBrowserLocalOllamaChatAPI(
            preparedMessages,
            model,
            abortController.signal
          )
          isBrowserLocalOllamaResponse = true
        } else if (effectiveOllamaAccessMode === 'server') {
          response = await callKnowledgeChatAPI(payload, abortController.signal)
        } else {
          try {
            const preparedMessages = await prepareKnowledgeChatMessages(
              payload,
              abortController.signal
            )
            response = await callBrowserLocalOllamaChatAPI(
              preparedMessages,
              model,
              abortController.signal
            )
            isBrowserLocalOllamaResponse = true
          } catch {
            response = await callKnowledgeChatAPI(payload, abortController.signal)
          }
        }
      } else {
        response = await callKnowledgeChatAPI(payload, abortController.signal)
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const finalContent = isBrowserLocalOllamaResponse
        ? await readOllamaChatStream(response, setCompletion)
        : await readAiChatStream(response, setCompletion)

      if (finalContent) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: finalContent,
          },
        ])
      }
      setCompletion('')
      setIsLoading(false)
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 用户主动停止，不显示错误
        return
      }

      console.error('Knowledge chat error:', error)
      const errorMessage =
        error instanceof Error
          ? error.message.includes('fetch')
            ? 'AI服务暂时不可用，请确保Ollama服务正在运行'
            : error.message
          : 'AI服务发生未知错误'

      // 添加错误消息
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `错误: ${errorMessage}`,
        },
      ])
      setCompletion('')
      setIsLoading(false)
    } finally {
      abortControllerRef.current = null
    }
  }, [
    prompt,
    messages,
    isLoading,
    useContext,
    searchMethod,
    model,
    provider,
    effectiveOllamaAccessMode,
  ])

  // 当 model 改变时保存到 localStorage
  useEffect(() => {
    setStoredOllamaModel(model)
  }, [model])

  // 保存 provider 到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('knowledge_provider', provider)
    }
  }, [provider])

  return {
    prompt,
    setPrompt,
    messages,
    displayMessages,
    hasMessages,
    completion: completion || undefined,
    isLoading,
    ollamaModels,
    isLoadingOllamaModels,
    useContext,
    setUseContext,
    searchMethod,
    setSearchMethod,
    model,
    setModel,
    provider,
    setProvider,
    stop,
    handleSend,
    handleClear,
    messagesEndRef,
  }
}
