'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Maximize2, MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAiChat } from '@/app/ai/features/chat/hooks/useAiChat'
import { ChatMessageList, ChatInput } from '@/app/ai/features/chat/components'
import { ReaderPanel } from './ReaderPanel'
import type { BookTheme } from '@/app/book/types/reader'

interface BookAiChatPanelProps {
  open: boolean
  theme?: BookTheme
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
export function BookAiChatPanel({
  open,
  seedPrompt,
  onClose,
  onExpand,
  theme = 'auto',
}: BookAiChatPanelProps) {
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
  const hasThread = hasMessages || isLoading
  const [idleComposerMaxHeight, setIdleComposerMaxHeight] = useState(640)

  useLayoutEffect(() => {
    if (hasThread) return
    const measure = () => {
      const appHeader =
        Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--app-header-total-height')
        ) || 56
      setIdleComposerMaxHeight(Math.max(280, Math.floor(window.innerHeight - appHeader - 220)))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [hasThread, open])

  useEffect(() => {
    if (!open) {
      appliedSeedRef.current = null
      return
    }
    if (!seedPrompt || appliedSeedRef.current === seedPrompt) return
    appliedSeedRef.current = seedPrompt
    setPrompt(seedPrompt)
  }, [open, seedPrompt, setPrompt])

  return (
    <ReaderPanel
      open={open}
      onOpenChange={next => {
        if (!next) onClose()
      }}
      title="AI 助理"
      description="围绕选中的文字提问，读懂每一段"
      theme={theme}
      bodyClassName="flex min-h-0 flex-col overflow-hidden p-0"
      className={hasThread ? 'h-[78dvh] sm:h-auto' : 'h-auto sm:top-auto'}
      headerAction={
        onExpand ? (
          <Button
            variant="ghost"
            size="icon"
            className="-mt-1 size-10 rounded-xl"
            onClick={() => onExpand(prompt)}
            aria-label="全屏展开"
          >
            <Maximize2 className="size-4" />
          </Button>
        ) : undefined
      }
    >
      {hasThread ? (
        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          completion={completion}
          messagesEndRef={messagesEndRef}
          variant="dialog"
        />
      ) : null}

      <div
        className={
          hasThread ? 'relative shrink-0 border-t border-border p-3' : 'relative shrink-0 p-3'
        }
      >
        {hasMessages && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClear}
            disabled={isLoading}
            className="mb-3 h-9 gap-1.5 rounded-xl px-3 shadow-none"
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
          textareaMaxHeight={hasThread ? 160 : idleComposerMaxHeight}
        />
      </div>
    </ReaderPanel>
  )
}
