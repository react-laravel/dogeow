import React from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  type AIProvider,
  type CodexModelListItem,
  CodexModelSelector,
  CodexReasoningEffortSelector,
  type OllamaModelListItem,
  OllamaModelSelector,
  ProviderSelector,
  getModelLabel,
  PROVIDER_LABELS,
} from './ChatInputModelSelector'
import type { CodexReasoningEffort } from '../request-model'

interface ChatInputModelRowProps {
  chatMode: 'ai' | 'knowledge'
  provider?: AIProvider
  onProviderChange?: (value: AIProvider) => void
  model?: string
  onModelChange?: (value: string) => void
  codexReasoningEffort?: CodexReasoningEffort
  onCodexReasoningEffortChange?: (value: CodexReasoningEffort) => void
  ollamaModels: OllamaModelListItem[]
  codexModels?: CodexModelListItem[]
  isLoading: boolean
  isLoadingOllamaModels: boolean
  isLoadingCodexModels?: boolean
}

export const ChatInputModelRow = React.memo<ChatInputModelRowProps>(
  ({
    provider,
    onProviderChange,
    model,
    onModelChange,
    codexReasoningEffort,
    onCodexReasoningEffortChange,
    ollamaModels,
    codexModels,
    isLoading,
    isLoadingOllamaModels,
    isLoadingCodexModels = false,
  }) => {
    const [open, setOpen] = React.useState(false)
    if (!provider || !onProviderChange) return null
    const label = getModelLabel(provider, model, codexModels) || PROVIDER_LABELS[provider]
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="text-muted-foreground h-10 max-w-full min-w-0 gap-2 px-2 text-xs"
            aria-label={`模型设置，当前 ${label}`}
          >
            <SlidersHorizontal className="size-4 shrink-0" />
            <span className="min-w-0 truncate">{label}</span>
            <ChevronDown className="size-3 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="top"
          collisionPadding={12}
          sideOffset={12}
          className="bg-popover z-[140] max-h-[min(480px,var(--radix-popover-content-available-height))] w-[min(340px,calc(100vw-24px))] space-y-4 overflow-y-auto p-4"
          aria-label="模型设置"
        >
          <div>
            <h3 className="text-sm font-semibold">模型设置</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              按问题需要调整，应用于接下来发送的消息。
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs">服务来源</p>
            <ProviderSelector
              provider={provider}
              onProviderChange={onProviderChange}
              isLoading={isLoading}
            />
          </div>
          {onModelChange && (
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs">模型</p>
              {provider === 'ollama' ? (
                <OllamaModelSelector
                  model={model ?? ''}
                  onModelChange={onModelChange}
                  ollamaModels={ollamaModels}
                  isLoading={isLoading}
                  isLoadingOllamaModels={isLoadingOllamaModels}
                />
              ) : (
                <CodexModelSelector
                  model={model ?? ''}
                  onModelChange={onModelChange}
                  codexModels={codexModels}
                  isLoading={isLoading}
                  isLoadingCodexModels={isLoadingCodexModels}
                />
              )}
            </div>
          )}
          {provider === 'codex' && codexReasoningEffort && onCodexReasoningEffortChange && (
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs">思考深度</p>
              <CodexReasoningEffortSelector
                model={model ?? ''}
                effort={codexReasoningEffort}
                onEffortChange={onCodexReasoningEffortChange}
                isLoading={isLoading}
              />
            </div>
          )}
          <Button variant="secondary" className="w-full" onClick={() => setOpen(false)}>
            完成
          </Button>
        </PopoverContent>
      </Popover>
    )
  }
)
ChatInputModelRow.displayName = 'ChatInputModelRow'
