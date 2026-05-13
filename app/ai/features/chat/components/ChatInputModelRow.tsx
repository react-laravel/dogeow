import React from 'react'
import {
  type AIProvider,
  type OllamaModelListItem,
  OllamaModelSelector,
  ProviderSelector,
  ZhipuaiModelSelector,
} from './ChatInputModelSelector'

interface ChatInputModelRowProps {
  chatMode: 'ai' | 'knowledge'
  provider?: AIProvider
  onProviderChange?: (value: AIProvider) => void
  model?: string
  onModelChange?: (value: string) => void
  ollamaModels: OllamaModelListItem[]
  isLoading: boolean
  isLoadingOllamaModels: boolean
}

export const ChatInputModelRow = React.memo<ChatInputModelRowProps>(
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
    const selectedModel = model ?? ''

    if (chatMode === 'ai' && provider && onProviderChange) {
      return (
        <div className="mb-2 flex items-center gap-1.5 text-sm">
          <ProviderSelector
            provider={provider}
            onProviderChange={onProviderChange}
            isLoading={isLoading}
          />
          {onModelChange && (provider === 'ollama' || provider === 'zhipuai') && (
            <>
              <span className="text-muted-foreground">·</span>
              {provider === 'ollama' && (
                <OllamaModelSelector
                  model={selectedModel}
                  onModelChange={onModelChange}
                  ollamaModels={ollamaModels}
                  isLoading={isLoading}
                  isLoadingOllamaModels={isLoadingOllamaModels}
                />
              )}
              {provider === 'zhipuai' && (
                <ZhipuaiModelSelector
                  model={selectedModel}
                  onModelChange={onModelChange}
                  isLoading={isLoading}
                />
              )}
            </>
          )}
        </div>
      )
    }

    if (chatMode === 'knowledge' && onModelChange) {
      return (
        <div className="mb-2 flex items-center gap-1.5 text-sm">
          <span className="px-0 py-1 text-muted-foreground">Ollama</span>
          <span className="text-muted-foreground">·</span>
          <OllamaModelSelector
            model={selectedModel}
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

ChatInputModelRow.displayName = 'ChatInputModelRow'
