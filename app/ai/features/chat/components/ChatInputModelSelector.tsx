import React from 'react'
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
import type { CodexReasoningEffort } from '../request-model'

export type AIProvider = 'github' | 'minimax' | 'ollama' | 'zhipuai' | 'codex'

export interface OllamaModelListItem {
  name: string
  size?: number
  parameterSize?: string
  supportsVision?: boolean
}

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  ollama: 'Ollama',
  github: 'GitHub',
  minimax: 'MiniMax',
  zhipuai: '智谱AI',
  codex: 'ChatGPT Codex',
}

const PROVIDER_STYLES: Record<AIProvider, string> = {
  ollama: 'bg-primary/10 ring-primary',
  github: 'bg-green-500/10 ring-green-500',
  minimax: 'bg-orange-500/10 ring-orange-500',
  zhipuai: 'bg-cyan-500/10 ring-cyan-500',
  codex: 'bg-sky-500/10 ring-sky-500',
}

const PROVIDER_DESCRIPTIONS: Record<AIProvider, string> = {
  ollama: '本地模型',
  github: 'GPT-5 Mini',
  minimax: 'M2.5',
  zhipuai: 'GLM 系列',
  codex: '设备登录',
}

const ZHIPUAI_MODELS = [
  { value: 'glm-4.7', label: 'GLM-4.7', desc: '最新旗舰' },
  { value: 'glm-4.6v-flash', label: 'GLM-4.6V Flash', desc: '视觉理解' },
  { value: 'glm-4.6v', label: 'GLM-4.6V', desc: '视觉理解(标准)' },
  { value: 'glm-4.5-air', label: 'GLM-4.5-Air', desc: '轻量快速' },
]

const CODEX_MODELS = [
  { value: 'gpt-5.5', label: 'GPT-5.5', desc: '复杂任务' },
  { value: 'gpt-5.4', label: 'GPT-5.4', desc: '强能力' },
  { value: 'gpt-5.4-mini', label: 'GPT-5.4 Mini', desc: '轻量快速' },
  { value: 'gpt-5.3-codex-spark', label: 'Codex Spark', desc: 'Pro 快速预览' },
]

const CODEX_REASONING_EFFORTS: Array<{
  value: CodexReasoningEffort
  label: string
  desc: string
}> = [
  { value: 'minimal', label: 'Minimal', desc: '最快' },
  { value: 'low', label: 'Low', desc: '轻量' },
  { value: 'medium', label: 'Medium', desc: '默认' },
  { value: 'high', label: 'High', desc: '复杂' },
  { value: 'xhigh', label: 'XHigh', desc: '最深' },
]

export function getModelLabel(provider: AIProvider | undefined, model: string | undefined): string {
  if (!provider || !model) return ''
  if (provider === 'ollama') return model
  if (provider === 'zhipuai') {
    const found = ZHIPUAI_MODELS.find(m => m.value === model)
    return found?.label ?? model
  }
  if (provider === 'github') return 'GPT-5 Mini'
  if (provider === 'minimax') return 'M2.5'
  if (provider === 'codex') {
    const found = CODEX_MODELS.find(m => m.value === model)
    return found?.label ?? model
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
            className="h-auto gap-1 px-0 py-1 font-normal text-muted-foreground hover:text-foreground"
          >
            {PROVIDER_LABELS[provider]}
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuRadioGroup
            value={provider}
            onValueChange={v => onProviderChange(v as AIProvider)}
          >
            {(Object.keys(PROVIDER_LABELS) as AIProvider[]).map(p => (
              <DropdownMenuRadioItem
                key={p}
                value={p}
                className={cn(
                  'cursor-pointer',
                  provider === p &&
                    `relative z-10 font-medium ring-2 ring-offset-1 ${PROVIDER_STYLES[p]}`
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
    const triggerLabel =
      model ||
      (isLoadingOllamaModels ? '读取中...' : availableModels.length > 0 ? '选择模型' : '未发现模型')
    const isTriggerDisabled = isLoading || (!isLoadingOllamaModels && availableModels.length === 0)

    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isTriggerDisabled}
            className="h-auto gap-1 px-0 py-1 font-normal text-muted-foreground hover:text-foreground"
          >
            {triggerLabel}
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
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
                      'cursor-pointer',
                      model === item.name &&
                        'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                    )}
                  >
                    <div className="flex flex-col">
                      <span>{item.name}</span>
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
                      'cursor-pointer',
                      model === item.name &&
                        'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                    )}
                  >
                    <div className="flex flex-col">
                      <span>{item.name}</span>
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
          {!isLoadingOllamaModels && availableModels.length === 0 && (
            <div className="text-muted-foreground px-2 py-1 text-xs">
              当前地址下未发现可用 Ollama 模型
            </div>
          )}
          {isLoadingOllamaModels && (
            <div className="text-muted-foreground px-2 py-1 text-xs">
              正在读取本地 Ollama 模型...
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)
OllamaModelSelector.displayName = 'OllamaModelSelector'

// --- Zhipuai Model Selector ---

interface ZhipuaiModelSelectorProps {
  model: string
  onModelChange: (value: string) => void
  isLoading: boolean
}

export const ZhipuaiModelSelector = React.memo<ZhipuaiModelSelectorProps>(
  ({ model, onModelChange, isLoading }) => {
    const [open, setOpen] = React.useState(false)

    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="h-auto gap-1 px-0 py-1 font-normal text-muted-foreground hover:text-foreground"
          >
            {getModelLabel('zhipuai', model)}
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuRadioGroup value={model} onValueChange={onModelChange}>
            {ZHIPUAI_MODELS.map(m => (
              <DropdownMenuRadioItem key={m.value} value={m.value} className="cursor-pointer">
                <div className="flex flex-col">
                  <span>{m.label}</span>
                  <span className="text-muted-foreground text-xs">{m.desc}</span>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)
ZhipuaiModelSelector.displayName = 'ZhipuaiModelSelector'

// --- Codex Model Selector ---

interface CodexModelSelectorProps {
  model: string
  onModelChange: (value: string) => void
  isLoading: boolean
}

export const CodexModelSelector = React.memo<CodexModelSelectorProps>(
  ({ model, onModelChange, isLoading }) => {
    const [open, setOpen] = React.useState(false)

    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="h-auto gap-1 px-0 py-1 font-normal text-muted-foreground hover:text-foreground"
          >
            {getModelLabel('codex', model)}
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuRadioGroup value={model} onValueChange={onModelChange}>
            {CODEX_MODELS.map(m => (
              <DropdownMenuRadioItem key={m.value} value={m.value} className="cursor-pointer">
                <div className="flex flex-col">
                  <span>{m.label}</span>
                  <span className="text-muted-foreground text-xs">{m.desc}</span>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)
CodexModelSelector.displayName = 'CodexModelSelector'

interface CodexReasoningEffortSelectorProps {
  effort: CodexReasoningEffort
  onEffortChange: (value: CodexReasoningEffort) => void
  isLoading: boolean
}

export const CodexReasoningEffortSelector = React.memo<CodexReasoningEffortSelectorProps>(
  ({ effort, onEffortChange, isLoading }) => {
    const [open, setOpen] = React.useState(false)

    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="h-auto gap-1 px-0 py-1 font-normal text-muted-foreground hover:text-foreground"
          >
            {getCodexReasoningEffortLabel(effort)}
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuRadioGroup
            value={effort}
            onValueChange={value => onEffortChange(value as CodexReasoningEffort)}
          >
            {CODEX_REASONING_EFFORTS.map(item => (
              <DropdownMenuRadioItem key={item.value} value={item.value} className="cursor-pointer">
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
