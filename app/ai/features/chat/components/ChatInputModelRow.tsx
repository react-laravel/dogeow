import React from 'react'
import {
  type AIProvider,
  type CodexModelListItem,
  CodexModelSelector,
  CodexReasoningEffortSelector,
  type OllamaModelListItem,
  OllamaModelSelector,
  ProviderSelector,
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
    const selectedModel = model ?? ''

    if (provider && onProviderChange) {
      return (
        <div className="mb-2 flex items-center gap-1.5 text-sm">
          <ProviderSelector
            provider={provider}
            onProviderChange={onProviderChange}
            isLoading={isLoading}
          />
          {onModelChange && (provider === 'ollama' || provider === 'codex') && (
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
              {provider === 'codex' && (
                <>
                  <CodexModelSelector
                    model={selectedModel}
                    onModelChange={onModelChange}
                    isLoading={isLoading}
                    codexModels={codexModels}
                    isLoadingCodexModels={isLoadingCodexModels}
                  />
                  {codexReasoningEffort && onCodexReasoningEffortChange && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <CodexReasoningEffortSelector
                        model={selectedModel}
                        effort={codexReasoningEffort}
                        onEffortChange={onCodexReasoningEffortChange}
                        isLoading={isLoading}
                      />
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )
    }

    return null
  }
)

ChatInputModelRow.displayName = 'ChatInputModelRow'
