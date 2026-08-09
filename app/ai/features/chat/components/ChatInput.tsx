import React from 'react'
import { Send, Square, Bot, BookOpen, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
    onChatModeChange,
    images = [],
    isUploadingImages = false,
    onImageSelect,
    onRemoveImage,
    variant = 'page',
    placeholder,
  }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const canSend = prompt.trim().length > 0 || images.length > 0
    const canUploadImages = chatMode !== 'knowledge' && !!onImageSelect && supportsImages

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onImageSelect?.(event.target.files)
      event.target.value = ''
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        if (canSend && !isLoading) {
          onSend()
        }
      }
    }

    const imagePreview = canUploadImages && (
      <ChatInputImagePreview
        images={images}
        onRemoveImage={onRemoveImage}
        className={variant === 'dialog' ? 'mb-2' : 'mb-3'}
      />
    )

    const fileInput = canUploadImages && (
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
    )

    const modelSelector = chatMode && (
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
    )

    const uploadButton = canUploadImages && (
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 border-2"
        disabled={isLoading || images.length >= 5}
        onClick={() => fileInputRef.current?.click()}
        aria-label="上传图片"
      >
        <ImagePlus className={cn('h-5 w-5', images.length > 0 && 'text-cyan-500')} />
      </Button>
    )

    const sendButton = (
      <Button
        onClick={isLoading && onStop ? onStop : onSend}
        disabled={isLoading ? false : !canSend}
        size="icon"
        className="h-10 w-10 shrink-0"
      >
        {isLoading ? <Square className="h-5 w-5" /> : <Send className="h-5 w-5" />}
      </Button>
    )

    const uploadStatus = canUploadImages && isUploadingImages && (
      <div className="text-muted-foreground mt-2 text-xs">图片上传中...</div>
    )

    const inputContent = (
      <>
        {imagePreview}
        {fileInput}
        {uploadButton}
        <div className="mb-1.5">{modelSelector}</div>
        <div className="flex items-end gap-2">
          <Textarea
            value={prompt}
            onChange={event => onPromptChange(event.target.value)}
            placeholder={
              placeholder || (images.length > 0 ? '询问关于图片的问题...' : '输入消息...')
            }
            className={cn('flex-1 min-w-0 max-h-[80px] min-h-[48px] resize-none py-2.5')}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />
          {sendButton}
        </div>
        {uploadStatus}
      </>
    )

    if (variant === 'dialog') {
      return <div className="flex-none border-t p-2">{inputContent}</div>
    }

    // page variant
    return (
      <div className="bg-background border-t p-4">
        <div className="mx-auto max-w-4xl">{inputContent}</div>
      </div>
    )
  }
)

ChatInput.displayName = 'ChatInput'
