import React from 'react'
import { ArrowUp, Square, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/helpers'
import { ChatInputImagePreview } from './ChatInputImagePreview'
import {
  type AIProvider,
  type CodexModelListItem,
  type OllamaModelListItem,
} from './ChatInputModelSelector'
import { ChatInputModelRow } from './ChatInputModelRow'
import type { CodexReasoningEffort } from '../request-model'

interface ChatInputProps {
  prompt: string
  onPromptChange: (value: string) => void
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
  onSend: () => void
  onStop?: () => void
  isLoading: boolean
  ollamaModels?: OllamaModelListItem[]
  isLoadingOllamaModels?: boolean
  codexModels?: CodexModelListItem[]
  isLoadingCodexModels?: boolean
  supportsImages?: boolean
  model?: string
  onModelChange?: (value: string) => void
  codexReasoningEffort?: CodexReasoningEffort
  onCodexReasoningEffortChange?: (value: CodexReasoningEffort) => void
  provider?: AIProvider
  onProviderChange?: (value: AIProvider) => void
  chatMode?: 'ai' | 'knowledge'
  onChatModeChange?: (value: 'ai' | 'knowledge') => void
  images?: Array<{ id: string; preview: string; uploading?: boolean }>
  isUploadingImages?: boolean
  onImageSelect?: (files: FileList | null) => void
  onRemoveImage?: (index: number) => void
  variant?: 'dialog' | 'page'
  placeholder?: string
}

export const ChatInput = React.memo<ChatInputProps>(
  ({
    prompt,
    onPromptChange,
    inputRef,
    onSend,
    onStop,
    isLoading,
    ollamaModels = [],
    isLoadingOllamaModels = false,
    codexModels = [],
    isLoadingCodexModels = false,
    supportsImages = false,
    model,
    onModelChange,
    codexReasoningEffort,
    onCodexReasoningEffortChange,
    provider,
    onProviderChange,
    chatMode,
    images = [],
    isUploadingImages = false,
    onImageSelect,
    onRemoveImage,
    variant = 'page',
    placeholder,
  }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const localInputRef = React.useRef<HTMLTextAreaElement>(null)
    const textareaRef = inputRef ?? localInputRef
    const canUploadImages = chatMode !== 'knowledge' && !!onImageSelect && supportsImages
    const uploading = isUploadingImages || images.some(image => image.uploading)
    const canSend =
      (prompt.trim().length > 0 || (canUploadImages && images.length > 0)) && !uploading

    React.useLayoutEffect(() => {
      const input = textareaRef.current
      if (!input) return
      input.style.height = 'auto'
      input.style.height = `${Math.min(Math.max(input.scrollHeight, 56), 160)}px`
    }, [prompt, textareaRef])

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.nativeEvent.isComposing || event.keyCode === 229) return
      if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        if (canSend && !isLoading) onSend()
      }
    }

    return (
      <div
        className={cn(
          'bg-background shrink-0 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]',
          variant === 'dialog' ? 'sm:px-6' : 'p-4'
        )}
      >
        <div className="mx-auto w-full max-w-3xl">
          <div className="bg-card focus-within:border-primary/40 rounded-2xl border p-2 shadow-xs transition-colors">
            {canUploadImages && (
              <ChatInputImagePreview
                images={images}
                onRemoveImage={onRemoveImage}
                className="px-2 pt-2 pb-1"
              />
            )}
            {canUploadImages && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                aria-label="选择图片文件"
                onChange={event => {
                  onImageSelect?.(event.target.files)
                  event.target.value = ''
                }}
              />
            )}
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={event => onPromptChange(event.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="消息"
              placeholder={
                placeholder || (images.length > 0 ? '询问关于图片的问题...' : '输入消息...')
              }
              className="max-h-[min(10rem,calc(var(--chat-viewport-height,100dvh)*0.22))] min-h-14 w-full resize-none overflow-y-auto border-0 bg-transparent px-3 py-2.5 text-base shadow-none focus-visible:ring-0 focus-visible:outline-none"
              rows={2}
            />
            <div className="flex min-w-0 items-center gap-2 px-1 pb-1">
              {canUploadImages && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 shrink-0"
                  disabled={isLoading || uploading || images.length >= 5}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="上传图片"
                >
                  <ImagePlus className="size-5" />
                </Button>
              )}
              <div className="min-w-0 flex-1">
                {chatMode && (
                  <ChatInputModelRow
                    chatMode={chatMode}
                    provider={provider}
                    onProviderChange={onProviderChange}
                    model={model}
                    onModelChange={onModelChange}
                    codexReasoningEffort={codexReasoningEffort}
                    onCodexReasoningEffortChange={onCodexReasoningEffortChange}
                    ollamaModels={ollamaModels}
                    codexModels={codexModels}
                    isLoading={isLoading}
                    isLoadingOllamaModels={isLoadingOllamaModels}
                    isLoadingCodexModels={isLoadingCodexModels}
                  />
                )}
              </div>
              <Button
                onClick={isLoading ? onStop : onSend}
                disabled={isLoading ? !onStop : !canSend}
                size="icon"
                className="size-10 shrink-0 rounded-xl"
                aria-label={isLoading ? '停止生成' : '发送消息'}
              >
                {isLoading ? (
                  <Square className="size-4 fill-current" />
                ) : (
                  <ArrowUp className="size-5" />
                )}
              </Button>
            </div>
          </div>
          {uploading && (
            <p role="status" className="text-muted-foreground mt-2 text-xs">
              图片上传中，完成后即可发送…
            </p>
          )}
          <p className="text-muted-foreground mt-2 hidden text-center text-[11px] sm:block">
            Enter 发送 · Shift + Enter 换行
          </p>
        </div>
      </div>
    )
  }
)
ChatInput.displayName = 'ChatInput'
