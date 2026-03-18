import React from 'react'
import {
  Send,
  Square,
  Bot,
  BookOpen,
  ImagePlus,
  Volume2,
  VolumeX,
  Wand2,
  Video,
  Music,
  Mic,
  MicOff,
  History,
} from 'lucide-react'
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
import { GenerationModal } from './GenerationModal'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import {
  type AIProvider,
  type OllamaModelListItem,
  ProviderSelector,
  OllamaModelSelector,
  ZhipuaiModelSelector,
} from './ChatInputModelSelector'

interface ChatInputProps {
  prompt: string
  onPromptChange: (value: string) => void
  onSend: () => void
  onStop?: () => void
  isLoading: boolean
  ollamaModels?: OllamaModelListItem[]
  isLoadingOllamaModels?: boolean
  supportsImages?: boolean
  model?: string
  onModelChange?: (value: string) => void
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
  ttsEnabled?: boolean
  onTtsEnabledChange?: (value: boolean) => void
  onGenerateImage?: (prompt: string) => void
  onGenerateVideo?: (prompt: string) => void
  onGenerateMusic?: (prompt: string, lyrics: string) => void
  isGeneratingMedia?: boolean
  generationError?: string
  onOpenImageHistory?: () => void
}

const ModelSelectorRow = React.memo<{
  chatMode: 'ai' | 'knowledge'
  provider?: AIProvider
  onProviderChange?: (value: AIProvider) => void
  model?: string
  onModelChange?: (value: string) => void
  ollamaModels: OllamaModelListItem[]
  isLoading: boolean
  isLoadingOllamaModels: boolean
}>(
  ({
    chatMode,
    provider,
    onProviderChange,
    model,
    onModelChange,
    ollamaModels,
    isLoading,
    isLoadingOllamaModels,
  }) => {
    if (chatMode === 'ai' && provider && onProviderChange) {
      return (
        <div className="mb-2 flex items-center gap-1.5 text-sm">
          <ProviderSelector
            provider={provider}
            onProviderChange={onProviderChange}
            isLoading={isLoading}
          />
          {model && onModelChange && (provider === 'ollama' || provider === 'zhipuai') && (
            <>
              <span className="text-muted-foreground">·</span>
              {provider === 'ollama' && (
                <OllamaModelSelector
                  model={model}
                  onModelChange={onModelChange}
                  ollamaModels={ollamaModels}
                  isLoading={isLoading}
                  isLoadingOllamaModels={isLoadingOllamaModels}
                />
              )}
              {provider === 'zhipuai' && (
                <ZhipuaiModelSelector
                  model={model}
                  onModelChange={onModelChange}
                  isLoading={isLoading}
                />
              )}
            </>
          )}
        </div>
      )
    }

    if (chatMode === 'knowledge' && model && onModelChange) {
      return (
        <div className="mb-2 flex items-center gap-1.5 text-sm">
          <span className="px-0 py-1 text-muted-foreground">Ollama</span>
          <span className="text-muted-foreground">·</span>
          <OllamaModelSelector
            model={model}
            onModelChange={onModelChange}
            ollamaModels={ollamaModels}
            isLoading={isLoading}
            isLoadingOllamaModels={isLoadingOllamaModels}
          />
        </div>
      )
    }

    return null
  }
)
ModelSelectorRow.displayName = 'ModelSelectorRow'

export const ChatInput = React.memo<ChatInputProps>(
  ({
    prompt,
    onPromptChange,
    onSend,
    onStop,
    isLoading,
    ollamaModels = [],
    isLoadingOllamaModels = false,
    supportsImages = false,
    model,
    onModelChange,
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
    ttsEnabled,
    onTtsEnabledChange,
    onGenerateImage,
    onGenerateVideo,
    onGenerateMusic,
    isGeneratingMedia,
    generationError,
    onOpenImageHistory,
  }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const canSend = prompt.trim().length > 0 || images.length > 0
    const canUploadImages = chatMode !== 'knowledge' && !!onImageSelect && supportsImages

    // Generation modal state
    const [genModalType, setGenModalType] = React.useState<'image' | 'video' | 'music' | null>(null)
    const [genPrompt, setGenPrompt] = React.useState('')
    const [genLyrics, setGenLyrics] = React.useState('')

    // Voice input state
    const [interimTranscript, setInterimTranscript] = React.useState('')
    // prompt as dep ensures closure always has latest value (no stale ref issue)
    const handleTranscript = React.useCallback(
      (_text: string, isFinal: boolean) => {
        if (isFinal) {
          onPromptChange(prompt + _text)
          setInterimTranscript('')
        } else {
          setInterimTranscript(_text)
        }
      },
      [prompt, onPromptChange]
    )

    const { isListening, startListening, stopListening } = useVoiceInput({
      onTranscript: handleTranscript,
      continuous: false,
    })

    const voiceButton = chatMode === 'ai' && (
      <Button
        variant="outline"
        size="icon"
        className={cn(
          'h-10 w-10 border-2 transition-all',
          isListening && 'text-red-500 animate-pulse'
        )}
        onClick={() => (isListening ? stopListening() : startListening())}
        disabled={isLoading}
        aria-label={isListening ? '停止语音输入' : '开始语音输入'}
        title={isListening ? '停止语音输入' : '开始语音输入'}
      >
        {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>
    )

    const openGenModal = (type: 'image' | 'video' | 'music') => {
      setGenModalType(type)
      setGenPrompt('')
      setGenLyrics('')
    }

    const handleGenSubmit = () => {
      if (!genPrompt.trim()) return
      if (genModalType === 'music' && !genLyrics.trim()) return
      if (genModalType === 'image') {
        onGenerateImage?.(genPrompt.trim())
      } else if (genModalType === 'video') {
        onGenerateVideo?.(genPrompt.trim())
      } else if (genModalType === 'music') {
        onGenerateMusic?.(genPrompt.trim(), genLyrics.trim())
      }
      setGenModalType(null)
      setGenPrompt('')
      setGenLyrics('')
    }

    const ttsToggle = chatMode === 'ai' && onTtsEnabledChange && (
      <Button
        variant="outline"
        size="icon"
        className={cn('h-10 w-10 border-2', ttsEnabled && 'text-cyan-500')}
        onClick={() => onTtsEnabledChange?.(!ttsEnabled)}
        aria-label={ttsEnabled ? '关闭语音播报' : '开启语音播报'}
        title={ttsEnabled ? '关闭语音播报' : '开启语音播报'}
      >
        {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </Button>
    )

    const genButtons = chatMode === 'ai' && (
      <>
        {onOpenImageHistory && (
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-2"
            onClick={onOpenImageHistory}
            disabled={isLoading || !!isGeneratingMedia}
            aria-label="图片历史"
            title="图片历史"
          >
            <History className="h-5 w-5" />
          </Button>
        )}
        {onGenerateImage && (
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-2"
            onClick={() => openGenModal('image')}
            disabled={isLoading || !!isGeneratingMedia}
            aria-label="生成图片"
            title="生成图片"
          >
            <Wand2 className="h-5 w-5" />
          </Button>
        )}
        {onGenerateVideo && (
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-2"
            onClick={() => openGenModal('video')}
            disabled={isLoading || !!isGeneratingMedia}
            aria-label="生成视频"
            title="生成视频"
          >
            <Video className="h-5 w-5" />
          </Button>
        )}
        {onGenerateMusic && (
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-2"
            onClick={() => openGenModal('music')}
            disabled={isLoading || !!isGeneratingMedia}
            aria-label="生成音乐"
            title="生成音乐"
          >
            <Music className="h-5 w-5" />
          </Button>
        )}
      </>
    )

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
      <ModelSelectorRow
        chatMode={chatMode}
        provider={provider}
        onProviderChange={onProviderChange}
        model={model}
        onModelChange={onModelChange}
        ollamaModels={ollamaModels}
        isLoading={isLoading}
        isLoadingOllamaModels={isLoadingOllamaModels}
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

    const iconsRow = (
      <div className="flex flex-wrap items-center gap-1.5">
        {ttsToggle}
        {voiceButton}
        {genButtons}
        {uploadButton}
      </div>
    )

    const uploadStatus = canUploadImages && isUploadingImages && (
      <div className="text-muted-foreground mt-2 text-xs">图片上传中...</div>
    )

    if (variant === 'dialog') {
      return (
        <div className="flex-none border-t p-2">
          {imagePreview}
          {fileInput}
          {iconsRow}
          <div className="mb-1.5">{modelSelector}</div>
          <div className="flex items-end gap-2">
            <Textarea
              value={prompt + interimTranscript}
              onChange={event => onPromptChange(event.target.value)}
              placeholder={
                placeholder || (images.length > 0 ? '询问关于图片的问题...' : '输入消息...')
              }
              className={cn(
                'flex-1 min-w-0 max-h-[80px] min-h-[48px] resize-none py-2.5',
                interimTranscript && 'text-blue-500'
              )}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            {sendButton}
          </div>
          {uploadStatus}
          {/* Generation modal */}
          <GenerationModal
            open={genModalType !== null}
            type={genModalType}
            prompt={genPrompt}
            onPromptChange={setGenPrompt}
            lyrics={genLyrics}
            onLyricsChange={setGenLyrics}
            onSubmit={handleGenSubmit}
            onClose={() => setGenModalType(null)}
            isLoading={!!isGeneratingMedia}
            error={generationError}
          />
        </div>
      )
    }

    // page variant
    return (
      <div className="bg-background border-t p-4">
        <div className="mx-auto max-w-4xl">
          {imagePreview}
          {fileInput}
          {iconsRow}
          <div className="mb-1.5">{modelSelector}</div>
          <div className="flex items-end gap-2">
            <Textarea
              value={prompt + interimTranscript}
              onChange={event => onPromptChange(event.target.value)}
              placeholder={
                placeholder || (images.length > 0 ? '询问关于图片的问题...' : '输入消息...')
              }
              className={cn(
                'flex-1 min-w-0 max-h-[80px] min-h-[48px] resize-none py-2.5',
                interimTranscript && 'text-blue-500'
              )}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            {sendButton}
          </div>
          {uploadStatus}
          {/* Generation modal */}
          <GenerationModal
            open={genModalType !== null}
            type={genModalType}
            prompt={genPrompt}
            onPromptChange={setGenPrompt}
            lyrics={genLyrics}
            onLyricsChange={setGenLyrics}
            onSubmit={handleGenSubmit}
            onClose={() => setGenModalType(null)}
            isLoading={!!isGeneratingMedia}
            error={generationError}
          />
        </div>
      </div>
    )
  }
)

ChatInput.displayName = 'ChatInput'
