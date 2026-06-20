'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { AI_SYSTEM_PROMPT, type ChatMessage } from '../types'
import { getRequestModel, type AIProvider, type CodexReasoningEffort } from '../request-model'
import { readAiChatStream, readOllamaChatStream } from './chatStream'
import { useAiChatImages, type ImageItem } from './useAiChatImages'
import { useOllamaModels, type OllamaModelListItem } from './useOllamaModels'
import { useMediaGenerators } from './useMediaGenerators'
import { uploadImageToServer } from './uploadImage'
import { generateTtsForMessage } from './ttsHandlers'
import { callBrowserLocalOllamaChatAPI } from './browserOllama'
import { useOllamaAccessMode } from './ollamaAccessMode'
import { authenticatedInternalFetch } from '@/lib/api/internal-auth'
import {
  getStoredProvider,
  getStoredOllamaModel,
  resolveOllamaModelSelection,
  getStoredCodexModel,
  getStoredCodexReasoningEffort,
  getStoredZhipuaiModel,
  setStoredProvider,
  setStoredCodexModel,
  setStoredCodexReasoningEffort,
  setStoredOllamaModel,
  setStoredZhipuaiModel,
} from './modelStorage'
import { toast } from 'sonner'

interface UseAiChatOptions {
  open?: boolean
}

interface UseAiChatReturn {
  prompt: string
  setPrompt: (value: string) => void
  messages: ChatMessage[]
  displayMessages: ChatMessage[]
  hasMessages: boolean
  images: ImageItem[]
  hasImages: boolean
  isUploadingImages: boolean
  handleImageSelect: (files: FileList | null) => void
  removeImage: (index: number) => void
  clearImages: () => void
  completion: string | undefined
  isLoading: boolean
  ollamaModels: OllamaModelListItem[]
  isLoadingOllamaModels: boolean
  supportsImages: boolean
  model: string
  setModel: (value: string) => void
  codexReasoningEffort: CodexReasoningEffort
  setCodexReasoningEffort: (value: CodexReasoningEffort) => void
  provider: AIProvider
  setProvider: (value: AIProvider) => void
  stop: () => void
  handleSend: () => void
  handleClear: () => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  ttsEnabled: boolean
  setTtsEnabled: (value: boolean) => void
  isGeneratingMedia: boolean
  generationError: string | undefined
  handleGenerateImage: (
    prompt: string,
    onImageGenerated?: (url: string, prompt: string) => void
  ) => void
  handleGenerateVideo: (
    prompt: string,
    onVideoGenerated?: (fileId: string, url: string, prompt: string) => void
  ) => void
  handleGenerateMusic: (prompt: string, lyrics: string) => void
}

const ZHIPUAI_VISION_MODELS = new Set(['glm-4.6v-flash', 'glm-4.6v'])

function supportsImagesForSelection(
  provider: AIProvider,
  model: string,
  ollamaModels: OllamaModelListItem[]
): boolean {
  if (provider === 'zhipuai') {
    return ZHIPUAI_VISION_MODELS.has(model)
  }

  if (provider === 'ollama') {
    return ollamaModels.find(item => item.name === model)?.supportsVision ?? false
  }

  return false
}

async function callServerAiChatAPI({
  messages,
  model,
  provider,
  images,
  signal,
  codexReasoningEffort,
}: {
  messages: Array<Pick<ChatMessage, 'role' | 'content'>>
  model: string
  provider: AIProvider
  images: string[]
  signal?: AbortSignal
  codexReasoningEffort?: CodexReasoningEffort
}): Promise<Response> {
  return authenticatedInternalFetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      useChat: true,
      messages,
      model,
      provider,
      images,
      codexReasoningEffort,
    }),
    signal,
  })
}

export function useAiChat(options: UseAiChatOptions = {}): UseAiChatReturn {
  const { open } = options
  const { effectiveOllamaAccessMode } = useOllamaAccessMode()

  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [completion, setCompletion] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // AI provider state
  const [provider, setProvider] = useState<AIProvider>(() => getStoredProvider())

  const [model, setModel] = useState<string>(() => {
    const initialProvider = getStoredProvider()
    if (initialProvider === 'codex') return getStoredCodexModel()
    return initialProvider === 'zhipuai' ? getStoredZhipuaiModel() : getStoredOllamaModel()
  })
  const [codexReasoningEffort, setCodexReasoningEffort] = useState<CodexReasoningEffort>(() =>
    getStoredCodexReasoningEffort()
  )

  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // TTS state
  const [ttsEnabled, setTtsEnabled] = useState(false)

  // Media generation state
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false)
  const [generationError, setGenerationError] = useState<string | undefined>(undefined)

  // Ollama models loading - extracted to hook
  const { ollamaModels, isLoadingOllamaModels } = useOllamaModels({
    enabled: Boolean(open) && provider === 'ollama',
  })

  // Filter out system messages for display
  const displayMessages = messages.filter(m => m.role !== 'system')
  const hasMessages = displayMessages.length > 0
  const supportsImages = supportsImagesForSelection(provider, model, ollamaModels)

  useEffect(() => {
    if (provider !== 'ollama' || isLoadingOllamaModels) {
      return
    }

    const nextModel = resolveOllamaModelSelection(model, ollamaModels)
    if (nextModel !== model) {
      setModel(nextModel)
    }
  }, [isLoadingOllamaModels, model, ollamaModels, provider])

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, completion, isLoading])

  // Image handling
  const { images, hasImages, isUploadingImages, handleImageSelect, removeImage, clearImages } =
    useAiChatImages({
      enabled: Boolean(open) && supportsImages,
      uploadImage: uploadImageToServer,
    })

  useEffect(() => {
    if ((!open || !supportsImages) && hasImages) {
      clearImages()
    }
  }, [open, supportsImages, hasImages, clearImages])

  // Media generators - extracted to hook
  const { handleGenerateImage, handleGenerateVideo, handleGenerateMusic } = useMediaGenerators({
    setMessages,
    setGenerationError,
    setIsGeneratingMedia,
  })

  // Stop generation
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
    setCompletion('')
  }, [])

  // Clear conversation
  const handleClear = useCallback(() => {
    stop()
    setMessages([])
    setCompletion('')
    setPrompt('')
    clearImages()
  }, [stop, clearImages])

  // Send message
  const handleSend = useCallback(async () => {
    if (isLoading) return

    if (provider === 'ollama' && !model) {
      toast.warning('当前 Ollama 地址下没有可用模型，请先在设置中检查 Ollama 列表')
      return
    }

    const imageUrls = images.map(item => item.url).filter((url): url is string => !!url)
    const hasReadyImages = imageUrls.length > 0

    if (!prompt.trim() && !hasReadyImages) return
    if (isUploadingImages) {
      toast.warning('图片上传中，请稍候')
      return
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt.trim() || '请描述这张图片',
      images: imageUrls.map(url => ({ url })),
    }

    // Add user message to history
    const newMessages: ChatMessage[] = [...messages, userMessage]
    setMessages(newMessages)
    setPrompt('')
    clearImages()
    setIsLoading(true)
    setCompletion('')

    // Create abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      // Prepare messages (ensure system message exists)
      const chatMessages: ChatMessage[] = newMessages.some(m => m.role === 'system')
        ? newMessages
        : [
            {
              role: 'system',
              content: AI_SYSTEM_PROMPT,
            },
            ...newMessages,
          ]

      const requestMessages = chatMessages.map(({ role, content }) => ({ role, content }))
      const requestModel = getRequestModel(provider, model)

      let response: Response
      let isBrowserLocalOllamaResponse = false

      if (provider === 'ollama') {
        if (effectiveOllamaAccessMode === 'browser') {
          response = await callBrowserLocalOllamaChatAPI(
            requestMessages,
            requestModel,
            abortController.signal
          )
          isBrowserLocalOllamaResponse = true
        } else if (effectiveOllamaAccessMode === 'server') {
          response = await callServerAiChatAPI({
            messages: requestMessages,
            model: requestModel,
            provider,
            images: imageUrls,
            codexReasoningEffort,
            signal: abortController.signal,
          })
        } else {
          try {
            response = await callBrowserLocalOllamaChatAPI(
              requestMessages,
              requestModel,
              abortController.signal
            )
            isBrowserLocalOllamaResponse = true
          } catch {
            response = await callServerAiChatAPI({
              messages: requestMessages,
              model: requestModel,
              provider,
              images: imageUrls,
              codexReasoningEffort,
              signal: abortController.signal,
            })
          }
        }
      } else {
        response = await callServerAiChatAPI({
          messages: requestMessages,
          model: requestModel,
          provider,
          images: imageUrls,
          codexReasoningEffort,
          signal: abortController.signal,
        })
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const accumulatedContent = isBrowserLocalOllamaResponse
        ? await readOllamaChatStream(response, setCompletion)
        : await readAiChatStream(response, setCompletion)

      // Stream ended, add assistant message
      if (accumulatedContent) {
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: accumulatedContent,
        }
        setMessages(prev => [...prev, assistantMsg])

        // TTS: generate audio for the response
        if (ttsEnabled) {
          await generateTtsForMessage(accumulatedContent, setMessages)
        }
      }
      setCompletion('')
      setIsLoading(false)
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User stopped, no error to show
        return
      }

      console.error('AI chat error:', error)
      const errorMessage =
        error instanceof Error
          ? error.message.includes('fetch')
            ? 'AI服务暂时不可用，请检查网络连接或配置'
            : error.message
          : 'AI服务发生未知错误'

      // Add error message
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
    images,
    isUploadingImages,
    isLoading,
    model,
    provider,
    codexReasoningEffort,
    effectiveOllamaAccessMode,
    clearImages,
    ttsEnabled,
  ])

  // When provider changes, persist to localStorage
  useEffect(() => {
    setStoredProvider(provider)
  }, [provider])

  // When provider changes, restore the last selected model for that provider
  useEffect(() => {
    if (provider === 'ollama') {
      setModel(getStoredOllamaModel())
      return
    }

    if (provider === 'zhipuai') {
      setModel(getStoredZhipuaiModel())
      return
    }

    if (provider === 'codex') {
      setModel(getStoredCodexModel())
    }
  }, [provider])

  // Persist model selection based on current provider
  useEffect(() => {
    if (provider === 'ollama') {
      setStoredOllamaModel(model)
      return
    }

    if (provider === 'zhipuai') {
      setStoredZhipuaiModel(model)
      return
    }

    if (provider === 'codex') {
      setStoredCodexModel(model)
    }
  }, [model, provider])

  useEffect(() => {
    setStoredCodexReasoningEffort(codexReasoningEffort)
  }, [codexReasoningEffort])

  return {
    prompt,
    setPrompt,
    messages,
    displayMessages,
    hasMessages,
    images,
    hasImages,
    isUploadingImages,
    handleImageSelect,
    removeImage,
    clearImages,
    completion: completion || undefined,
    isLoading,
    ollamaModels,
    isLoadingOllamaModels,
    supportsImages,
    model,
    setModel,
    codexReasoningEffort,
    setCodexReasoningEffort,
    provider,
    setProvider,
    stop,
    handleSend,
    handleClear,
    messagesEndRef,
    ttsEnabled,
    setTtsEnabled,
    isGeneratingMedia,
    generationError,
    handleGenerateImage,
    handleGenerateVideo,
    handleGenerateMusic,
  }
}

// Default export as fallback
export default useAiChat
