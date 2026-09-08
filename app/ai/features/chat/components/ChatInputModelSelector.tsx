import React from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/helpers'
import {
  CODEX_ULTRA_MODELS,
  FALLBACK_CODEX_MODELS,
  type CodexModelListItem,
  getCodexModelLabel,
} from '@/lib/utils/codex-models'
import type { CodexReasoningEffort } from '../request-model'

export type AIProvider = 'ollama' | 'codex'
export type { CodexModelListItem }

export interface OllamaModelListItem {
  name: string
  size?: number
  parameterSize?: string
  supportsVision?: boolean
}

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  ollama: 'Ollama',
  codex: 'ChatGPT',
}

const PROVIDER_STYLES: Record<AIProvider, string> = {
  ollama: 'bg-primary/10 ring-primary',
  codex: 'bg-primary/10 ring-primary',
}

const PROVIDER_DESCRIPTIONS: Record<AIProvider, string> = {
  ollama: '本地模型',
  // Server-side ChatGPT subscription via Codex auth.json — not a browser OAuth click.
  codex: 'ChatGPT 模型',
}

const CODEX_REASONING_EFFORTS: Array<{
  value: CodexReasoningEffort
  label: string
  desc: string
}> = [
  { value: 'minimal', label: '最低', desc: '最快' },
  { value: 'low', label: '较低', desc: '轻量' },
  { value: 'medium', label: '标准', desc: '默认' },
  { value: 'high', label: '较高', desc: '复杂' },
  { value: 'xhigh', label: '深度', desc: '最深' },
  { value: 'ultra', label: '超深', desc: '自动任务委派' },
]

export function getModelLabel(
  provider: AIProvider | undefined,
  model: string | undefined,
  codexModels: CodexModelListItem[] = FALLBACK_CODEX_MODELS
): string {
  if (!provider || !model) return ''
  if (provider === 'ollama') return model
  if (provider === 'codex') {
    return getCodexModelLabel(model, codexModels)
  }
  return model
}

export function getCodexReasoningEffortLabel(effort: CodexReasoningEffort): string {
  return CODEX_REASONING_EFFORTS.find(item => item.value === effort)?.label ?? effort
}

function formatOllamaModelMeta(model: OllamaModelListItem): string | undefined {
  if (model.parameterSize) return model.parameterSize
  if (typeof model.size === 'number' && model.size > 0) {
    const gb = model.size / (1024 * 1024 * 1024)
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(model.size / (1024 * 1024)).toFixed(0)} MB`
  }
  return undefined
}

// --- Provider Selector ---

interface ProviderSelectorProps {
  provider: AIProvider
  onProviderChange: (value: AIProvider) => void
  isLoading: boolean
}

export const ProviderSelector = React.memo<ProviderSelectorProps>(
  ({ provider, onProviderChange, isLoading }) => {
    const [open, setOpen] = React.useState(false)

    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            aria-label="选择服务来源"
            className="h-10 w-full min-w-0 justify-between gap-2 rounded-lg border px-3 font-normal"
          >
            <span className="truncate">{PROVIDER_LABELS[provider]}</span>
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="bg-popover z-[150] w-60 max-w-[calc(100vw-24px)]"
        >
          <DropdownMenuRadioGroup
            value={provider}
            onValueChange={v => onProviderChange(v as AIProvider)}
          >
            {(Object.keys(PROVIDER_LABELS) as AIProvider[]).map(p => (
              <DropdownMenuRadioItem
                key={p}
                value={p}
                className={cn(
                  'min-h-10 cursor-pointer',
                  provider === p && `font-medium ${PROVIDER_STYLES[p]}`
                )}
              >
                <div className="flex flex-col">
                  <span>{PROVIDER_LABELS[p]}</span>
                  <span className="text-muted-foreground text-xs">{PROVIDER_DESCRIPTIONS[p]}</span>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)
ProviderSelector.displayName = 'ProviderSelector'

// --- Ollama Model Selector ---

interface OllamaModelSelectorProps {
  model: string
  onModelChange: (value: string) => void
  ollamaModels: OllamaModelListItem[]
  isLoading: boolean
  isLoadingOllamaModels: boolean
}

export const OllamaModelSelector = React.memo<OllamaModelSelectorProps>(
  ({ model, onModelChange, ollamaModels, isLoading, isLoadingOllamaModels }) => {
    const [open, setOpen] = React.useState(false)
    const availableModels = ollamaModels
    const textOnly = availableModels.filter(item => !item.supportsVision)
    const vision = availableModels.filter(item => item.supportsVision)
    const hasModels = availableModels.length > 0
    const triggerLabel =
      model || (isLoadingOllamaModels ? '读取中...' : hasModels ? '选择模型' : '未发现模型')

    return (
      <div className="flex w-full min-w-0 flex-col gap-1.5">
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isLoading}
              aria-label="选择模型"
              className="h-10 w-full min-w-0 justify-between gap-2 rounded-lg border px-3 font-normal"
            >
              <span className="min-w-0 truncate">{triggerLabel}</span>
              {open ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="bg-popover z-[150] w-72 max-w-[calc(100vw-24px)]"
          >
            <DropdownMenuRadioGroup value={model} onValueChange={onModelChange}>
              {textOnly.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-muted-foreground text-xs">
                    文本
                  </DropdownMenuLabel>
                  {textOnly.map(item => (
                    <DropdownMenuRadioItem
                      key={item.name}
                      value={item.name}
                      className={cn(
                        'min-h-10 cursor-pointer',
                        model === item.name && 'bg-primary/10 ring-primary font-medium'
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="break-all">{item.name}</span>
                        {formatOllamaModelMeta(item) && (
                          <span className="text-muted-foreground text-xs">
                            {formatOllamaModelMeta(item)}
                          </span>
                        )}
                      </div>
                    </DropdownMenuRadioItem>
                  ))}
                </>
              )}
              {textOnly.length > 0 && vision.length > 0 && <DropdownMenuSeparator />}
              {vision.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-muted-foreground text-xs">
                    图像
                  </DropdownMenuLabel>
                  {vision.map(item => (
                    <DropdownMenuRadioItem
                      key={item.name}
                      value={item.name}
                      className={cn(
                        'min-h-10 cursor-pointer',
                        model === item.name && 'bg-primary/10 ring-primary font-medium'
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="break-all">{item.name}</span>
                        {formatOllamaModelMeta(item) && (
                          <span className="text-muted-foreground text-xs">
                            {formatOllamaModelMeta(item)}
                          </span>
                        )}
                      </div>
                    </DropdownMenuRadioItem>
                  ))}
                </>
              )}
            </DropdownMenuRadioGroup>
            {!isLoadingOllamaModels && !hasModels && (
              <div className="text-muted-foreground space-y-1.5 px-2 py-2 text-xs">
                <p>当前地址下未发现可用 Ollama 模型。</p>
                <Link
                  href="/dashboard?section=ollama"
                  className="text-primary font-medium underline-offset-2 hover:underline"
                  onClick={() => setOpen(false)}
                >
                  前往仪表盘配置 Ollama
                </Link>
              </div>
            )}
            {isLoadingOllamaModels && (
              <div className="text-muted-foreground px-2 py-1 text-xs">
                正在读取本地 Ollama 模型...
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {!isLoadingOllamaModels && !hasModels && (
          <Link
            href="/dashboard?section=ollama"
            className="text-primary px-0 text-[11px] font-medium underline-offset-2 hover:underline"
          >
            配置模型
          </Link>
        )}
      </div>
    )
  }
)
OllamaModelSelector.displayName = 'OllamaModelSelector'

// --- Codex Model Selector ---

interface CodexModelSelectorProps {
  model: string
  onModelChange: (value: string) => void
  isLoading: boolean
  codexModels?: CodexModelListItem[]
  isLoadingCodexModels?: boolean
}

export const CodexModelSelector = React.memo<CodexModelSelectorProps>(
  ({
    model,
    onModelChange,
    isLoading,
    codexModels = FALLBACK_CODEX_MODELS,
    isLoadingCodexModels = false,
  }) => {
    const [open, setOpen] = React.useState(false)
    const availableModels = codexModels.length > 0 ? codexModels : FALLBACK_CODEX_MODELS
    const triggerLabel =
      getModelLabel('codex', model, availableModels) ||
      (isLoadingCodexModels ? '读取中...' : availableModels.length > 0 ? '选择模型' : '未发现模型')

    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            aria-label="选择模型"
            className="h-10 w-full min-w-0 justify-between gap-2 rounded-lg border px-3 font-normal"
          >
            <span className="min-w-0 truncate">{triggerLabel}</span>
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="bg-popover z-[150] w-72 max-w-[calc(100vw-24px)]"
        >
          <DropdownMenuRadioGroup value={model} onValueChange={onModelChange}>
            {availableModels.map(m => (
              <DropdownMenuRadioItem
                key={m.value}
                value={m.value}
                className={cn(
                  'min-h-10 cursor-pointer',
                  model === m.value && 'bg-primary/10 text-primary font-medium'
                )}
              >
                <div className="flex flex-col">
                  <span>{m.label}</span>
                  {m.description ? (
                    <span className="text-muted-foreground text-xs line-clamp-1">
                      {m.description}
                    </span>
                  ) : null}
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          {isLoadingCodexModels && (
            <div className="text-muted-foreground px-2 py-1 text-xs">
              正在探测 ChatGPT 可用模型...
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)
CodexModelSelector.displayName = 'CodexModelSelector'

interface CodexReasoningEffortSelectorProps {
  model: string
  effort: CodexReasoningEffort
  onEffortChange: (value: CodexReasoningEffort) => void
  isLoading: boolean
}

export const CodexReasoningEffortSelector = React.memo<CodexReasoningEffortSelectorProps>(
  ({ model, effort, onEffortChange, isLoading }) => {
    const [open, setOpen] = React.useState(false)
    const availableEfforts = CODEX_ULTRA_MODELS.has(model)
      ? CODEX_REASONING_EFFORTS
      : CODEX_REASONING_EFFORTS.filter(item => item.value !== 'ultra')

    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            aria-label="选择思考深度"
            className="h-10 w-full min-w-0 justify-between gap-2 rounded-lg border px-3 font-normal"
          >
            <span>{getCodexReasoningEffortLabel(effort)}</span>
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="bg-popover z-[150] w-60 max-w-[calc(100vw-24px)]"
        >
          <DropdownMenuRadioGroup
            value={effort}
            onValueChange={value => onEffortChange(value as CodexReasoningEffort)}
          >
            {availableEfforts.map(item => (
              <DropdownMenuRadioItem
                key={item.value}
                value={item.value}
                className="min-h-10 cursor-pointer"
              >
                <div className="flex flex-col">
                  <span>{item.label}</span>
                  <span className="text-muted-foreground text-xs">{item.desc}</span>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)
CodexReasoningEffortSelector.displayName = 'CodexReasoningEffortSelector'
