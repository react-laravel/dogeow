'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import useSWR from 'swr'
import { Bot, BookOpen, MessageSquarePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAiChat } from '@/app/ai/features/chat/hooks/useAiChat'
import { useChatViewport } from '@/app/ai/features/chat/hooks/useChatViewport'
import { useKnowledgeChat } from '@/app/ai/features/knowledge/hooks/useKnowledgeChat'
import { useKnowledgeIndexStatus } from '@/app/ai/features/knowledge/hooks/useKnowledgeIndexStatus'
import { ChatMessageList, ChatInput } from '@/app/ai/features/chat/components'
import { ChatEmptyState } from '@/app/ai/features/chat/components/ChatEmptyState'
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
async function fetchKnowledgeDocuments(url: string): Promise<KnowledgeDocumentsResponse> {
  const res = await authenticatedInternalFetch(url)
  const data = (await res.json()) as KnowledgeDocumentsResponse
  if (!res.ok || !data.success)
    throw new Error(data.error || data.message || '知识库文档暂时不可用')
  return data
}
function formatKnowledgeSubtitle(updatedAt: string | null | undefined): string | undefined {
  if (!updatedAt) return undefined
  try {
    return formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: zhCN }).replace(
      /^(大约|不到)\s*/,
      ''
    )
  } catch {
    return undefined
  }
}

export function AiDialog({ open, onOpenChange }: AiDialogProps) {
  const user = useAuthStore(state => state.user)
  const allowedOpen = open && canUseAi(user)
  const consumeSeedPrompt = useAiDialogStore(state => state.consumeSeedPrompt)
  const [chatMode, setChatMode] = useState<ChatMode>('ai')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const viewport = useChatViewport()
  const isKnowledgeMode = chatMode === 'knowledge'
  const {
    data: docsData,
    error: docsError,
    isLoading: docsLoading,
    mutate: reloadDocs,
  } = useSWR(
    allowedOpen && isKnowledgeMode ? '/api/knowledge/documents' : null,
    fetchKnowledgeDocuments,
    { revalidateOnFocus: false }
  )
  const aiChat = useAiChat({ open: allowedOpen })
  const setGeneralPrompt = aiChat.setPrompt
  const knowledgeChat = useKnowledgeChat({ open: allowedOpen })
  const { updatedAt } = useKnowledgeIndexStatus(allowedOpen && isKnowledgeMode)
  const knowledgeSubtitle = useMemo(() => formatKnowledgeSubtitle(updatedAt), [updatedAt])
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
    const seed = consumeSeedPrompt()
    if (!seed) return
    queueMicrotask(() => {
      setChatMode('ai')
      setGeneralPrompt(seed)
    })
  }, [allowedOpen, consumeSeedPrompt, setGeneralPrompt])

  const changeMode = (mode: string) => {
    if (mode === chatMode) return
    stop()
    setChatMode(mode as ChatMode)
  }
  const fillPrompt = (value: string) => {
    setPrompt(value)
    inputRef.current?.focus({ preventScroll: true })
  }

  if (!allowedOpen) return null
  return (
    <Dialog.Root open={allowedOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[130] bg-black/45 backdrop-blur-sm" />
        <div
          className="pointer-events-none fixed inset-x-0 z-[130] flex items-center justify-center sm:p-6"
          style={
            {
              ...viewport,
              '--chat-viewport-height':
                typeof viewport.height === 'number' ? `${viewport.height}px` : viewport.height,
            } as CSSProperties & { '--chat-viewport-height': string }
          }
        >
          <Dialog.Content
            ref={dialogRef}
            onOpenAutoFocus={event => {
              event.preventDefault()
              previousFocusRef.current = document.activeElement as HTMLElement | null
              dialogRef.current?.focus({ preventScroll: true })
            }}
            onCloseAutoFocus={event => {
              event.preventDefault()
              previousFocusRef.current?.focus({ preventScroll: true })
            }}
            className="bg-background pointer-events-auto flex h-full min-h-0 w-full flex-col overflow-hidden shadow-2xl outline-none sm:max-h-[800px] sm:max-w-4xl sm:rounded-2xl sm:border"
          >
            <header className="flex shrink-0 items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 sm:px-6 sm:pt-5">
              <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                <Bot className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-base font-semibold">AI 助理</Dialog.Title>
                <Dialog.Description className="text-muted-foreground mt-0.5 text-xs">
                  提问、整理想法，或从知识库寻找答案
                </Dialog.Description>
              </div>
              {hasMessages && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  aria-label="新会话"
                  title="新会话"
                >
                  <MessageSquarePlus className="size-5" />
                </Button>
              )}
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label="关闭 AI 助理">
                  <X className="size-5" />
                </Button>
              </Dialog.Close>
            </header>
            <Tabs value={chatMode} onValueChange={changeMode} className="min-h-0 flex-1 gap-0">
              <div className="shrink-0 border-b px-4 pb-3 sm:px-6">
                <TabsList
                  aria-label="对话模式"
                  className="grid h-11 w-full grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1 sm:max-w-sm"
                >
                  <TabsTrigger value="ai" className="rounded-lg data-[state=active]:text-primary">
                    <Bot className="size-4" />
                    通用 AI
                  </TabsTrigger>
                  <TabsTrigger
                    value="knowledge"
                    className="rounded-lg data-[state=active]:text-primary"
                  >
                    <BookOpen className="size-4" />
                    知识库 AI
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent key={chatMode} value={chatMode} className="flex min-h-0 flex-1 flex-col">
                <ChatMessageList
                  messages={messages}
                  isLoading={isLoading}
                  completion={completion}
                  messagesEndRef={messagesEndRef}
                  variant="dialog"
                  emptyState={
                    <ChatEmptyState
                      variant="dialog"
                      mode={chatMode}
                      onSuggestion={fillPrompt}
                      documents={docsData?.documents}
                      knowledgeLoading={!!docsLoading}
                      knowledgeError={!!docsError}
                      knowledgeUpdatedAt={knowledgeSubtitle}
                      onRetryKnowledge={() => void reloadDocs()}
                    />
                  }
                />
                <ChatInput
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  inputRef={inputRef}
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
                  images={isKnowledgeMode ? [] : aiChat.images}
                  isUploadingImages={!isKnowledgeMode && aiChat.isUploadingImages}
                  onImageSelect={isKnowledgeMode ? undefined : aiChat.handleImageSelect}
                  onRemoveImage={isKnowledgeMode ? undefined : aiChat.removeImage}
                  variant="dialog"
                  placeholder={isKnowledgeMode ? '询问知识库中的内容…' : '写下你的问题…'}
                />
              </TabsContent>
            </Tabs>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
