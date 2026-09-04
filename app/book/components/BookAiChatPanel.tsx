'use client'

import { useEffect, useRef } from 'react'
import { Bot, Maximize2, MessageSquarePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAiChat } from '@/app/ai/features/chat/hooks/useAiChat'
import { ChatMessageList, ChatInput } from '@/app/ai/features/chat/components'
import { cn } from '@/lib/helpers'

interface BookAiChatPanelProps {
  open: boolean
  /** Prompt seeded from the current text selection; applied once when opened. */
  seedPrompt: string | null
  onClose: () => void
  /** Optional escape hatch to the full-screen AI dialog. */
  onExpand?: (pendingPrompt: string) => void
}

/**
 * In-page AI chat docked to the bottom of the reader. Unlike the global
 * full-screen `AiDialog`, this keeps the book text visible so the reader can
 * ask about a passage without losing their place.
 */
export function BookAiChatPanel({ open, seedPrompt, onClose, onExpand }: BookAiChatPanelProps) {
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
    supportsImages,
    images,
    isUploadingImages,
    handleImageSelect,
    removeImage,
    stop,
    handleSend,
    handleClear,
    messagesEndRef,
  } = useAiChat({ open })

  const appliedSeedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open) {
      appliedSeedRef.current = null
      return
    }
    if (!seedPrompt || appliedSeedRef.current === seedPrompt) return
    appliedSeedRef.current = seedPrompt
    setPrompt(seedPrompt)
  }, [open, seedPrompt, setPrompt])

  if (!open) return null

  return (
    <div
      className={cn(
        'bg-background absolute inset-x-0 bottom-0 z-20 flex max-h-[70%] min-h-[44%] flex-col',
        'rounded-t-2xl border-t shadow-[0_-8px_24px_rgba(0,0,0,0.18)]'
      )}
      role="dialog"
      aria-label="AI 助理"
    >
      <div className="flex flex-none items-center justify-between border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
            <Bot className="h-4 w-4" />
          </div>
          <span className="truncate text-sm font-medium">AI 助理</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onExpand ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onExpand(prompt)}
              aria-label="全屏展开"
              title="全屏展开"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
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
          supportsImages={supportsImages}
          model={model}
          onModelChange={setModel}
          codexReasoningEffort={codexReasoningEffort}
          onCodexReasoningEffortChange={setCodexReasoningEffort}
          provider={provider}
          onProviderChange={setProvider}
          chatMode="ai"
          images={images}
          isUploadingImages={isUploadingImages}
          onImageSelect={handleImageSelect}
          onRemoveImage={removeImage}
          variant="dialog"
          placeholder="就选中的内容提问…"
        />
      </div>
    </div>
  )
}
