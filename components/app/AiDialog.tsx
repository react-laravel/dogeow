'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import useSWR from 'swr'
import { MessageSquarePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAiChat } from '@/app/ai/features/chat/hooks/useAiChat'
import { useKnowledgeChat } from '@/app/ai/features/knowledge/hooks/useKnowledgeChat'
import { useKnowledgeIndexStatus } from '@/app/ai/features/knowledge/hooks/useKnowledgeIndexStatus'
import { ChatHeader, ChatMessageList, ChatInput } from '@/app/ai/features/chat/components'
import type { ChatMessage } from '@/app/ai/features/chat/types'
import { authenticatedInternalFetch } from '@/lib/api/internal-auth'
import { useAiDialogStore } from '@/stores/aiDialogStore'
import useAuthStore from '@/stores/authStore'
import { canUseAi } from '@/lib/ai/access'

type ChatMode = 'ai' | 'knowledge'

interface AiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface KnowledgeDocumentsResponse {
  success: boolean
  documents?: Array<{ title: string; slug: string }>
  message?: string
  error?: string
}

const KNOWLEDGE_GREETING = '你好！欢迎了解我的知识库。'

async function fetchKnowledgeDocuments(url: string): Promise<KnowledgeDocumentsResponse> {
  const res = await authenticatedInternalFetch(url)
  const data = (await res.json()) as KnowledgeDocumentsResponse

  if (!res.ok || !data.success) {
    throw new Error(data.error || data.message || '知识库文档暂时不可用')
  }

  return data
}

function buildKnowledgeWelcomeMessages(
  docsData: KnowledgeDocumentsResponse | undefined,
  docsError: unknown
): ChatMessage[] {
  if (docsError) {
    return [
      {
        role: 'assistant',
        content: `${KNOWLEDGE_GREETING}\n\n当前知识库文档暂时不可用，请稍后重试。`,
      },
    ]
  }

  if (!docsData) return []

  const hasDocs = (docsData.documents?.length ?? 0) > 0
  return [
    {
      role: 'assistant',
      content: hasDocs
        ? `${KNOWLEDGE_GREETING}\n\n我会基于知识库内容为你解答。\n\n有什么想了解的吗？`
        : `${KNOWLEDGE_GREETING}\n\n目前知识库中还没有文档。\n\n有什么想了解的吗？`,
    },
  ]
}

function formatKnowledgeSubtitle(updatedAt: string | null | undefined): string | undefined {
  if (!updatedAt) return undefined

  try {
    const text = formatDistanceToNow(new Date(updatedAt), {
      addSuffix: true,
      locale: zhCN,
    })
    return text.replace(/^(大约|不到)\s*/, '')
  } catch {
    return undefined
  }
}

export function AiDialog({ open, onOpenChange }: AiDialogProps) {
  const user = useAuthStore(state => state.user)
  const allowedOpen = open && canUseAi(user)
  const consumeSeedPrompt = useAiDialogStore(state => state.consumeSeedPrompt)
  const [chatMode, setChatMode] = useState<ChatMode>('ai')
  const isKnowledgeMode = chatMode === 'knowledge'

  const shouldFetchDocs = allowedOpen && isKnowledgeMode
  const { data: docsData, error: docsError } = useSWR(
    shouldFetchDocs ? '/api/knowledge/documents' : null,
    fetchKnowledgeDocuments,
    { revalidateOnFocus: false }
  )

  const knowledgeInitialMessages = useMemo(
    () => (shouldFetchDocs ? buildKnowledgeWelcomeMessages(docsData, docsError) : []),
    [shouldFetchDocs, docsData, docsError]
  )

  const aiChat = useAiChat({ open: allowedOpen })
  const knowledgeChat = useKnowledgeChat({
    open: allowedOpen,
    initialMessages: knowledgeInitialMessages,
  })

  const { updatedAt: knowledgeUpdatedAt } = useKnowledgeIndexStatus(allowedOpen && isKnowledgeMode)
  const knowledgeSubtitle = useMemo(
    () => formatKnowledgeSubtitle(knowledgeUpdatedAt),
    [knowledgeUpdatedAt]
  )

  const headerTitle = isKnowledgeMode ? '知识库问答' : 'AI 助理'
  const headerSubtitle = isKnowledgeMode ? knowledgeSubtitle : undefined

  const activeChat = isKnowledgeMode ? knowledgeChat : aiChat
  const {
    prompt,
    setPrompt,
    messages,
    hasMessages,
    completion,
    isLoading,
    model,
    setModel,
    provider,
    setProvider,
    ollamaModels,
    isLoadingOllamaModels,
    codexModels,
    isLoadingCodexModels,
    codexReasoningEffort,
    setCodexReasoningEffort,
    stop,
    handleSend,
    handleClear,
    messagesEndRef,
  } = activeChat

  useEffect(() => {
    if (!allowedOpen) return

    const seedPrompt = consumeSeedPrompt()
    if (!seedPrompt) return

    queueMicrotask(() => {
      setChatMode('ai')
      aiChat.setPrompt(seedPrompt)
    })
  }, [allowedOpen, consumeSeedPrompt, aiChat.setPrompt])

  if (!allowedOpen) return null

  return createPortal(
    <div
      className="bg-background fixed inset-x-0 bottom-0 z-[29] flex flex-col overflow-hidden shadow-lg"
      style={{ top: 'var(--app-header-height, 50px)' }}
      role="dialog"
      aria-label={headerTitle}
    >
      <div className="flex flex-none items-center justify-between border-b px-4 py-0">
        <div className="flex-1">
          <ChatHeader
            variant="panel"
            title={headerTitle}
            subtitle={headerSubtitle}
            hasMessages={hasMessages}
            isLoading={isLoading}
            onClear={handleClear}
            hideClear
            chatMode={chatMode}
            onChatModeChange={setChatMode}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onOpenChange(false)}
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        completion={completion}
        messagesEndRef={messagesEndRef}
        variant="dialog"
      />

      <div className="relative flex-none p-2">
        {hasMessages && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClear}
            disabled={isLoading}
            className="absolute right-4 bottom-full mb-2 h-9 gap-1.5 rounded-full px-3 shadow-md"
          >
            <MessageSquarePlus className="h-4 w-4" />
            新会话
          </Button>
        )}
        <ChatInput
          prompt={prompt}
          onPromptChange={setPrompt}
          onSend={handleSend}
          onStop={stop}
          isLoading={isLoading}
          ollamaModels={ollamaModels}
          isLoadingOllamaModels={isLoadingOllamaModels}
          codexModels={codexModels}
          isLoadingCodexModels={isLoadingCodexModels}
          supportsImages={!isKnowledgeMode && aiChat.supportsImages}
          model={model}
          onModelChange={setModel}
          codexReasoningEffort={codexReasoningEffort}
          onCodexReasoningEffortChange={setCodexReasoningEffort}
          provider={provider}
          onProviderChange={setProvider}
          chatMode={chatMode}
          onChatModeChange={setChatMode}
          images={isKnowledgeMode ? [] : aiChat.images}
          isUploadingImages={!isKnowledgeMode && aiChat.isUploadingImages}
          onImageSelect={isKnowledgeMode ? undefined : aiChat.handleImageSelect}
          onRemoveImage={isKnowledgeMode ? undefined : aiChat.removeImage}
          variant="dialog"
          placeholder={isKnowledgeMode ? '与知识库AI对话' : '与通用AI对话'}
        />
      </div>
    </div>,
    document.body
  )
}
