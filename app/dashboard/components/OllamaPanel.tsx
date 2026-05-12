'use client'

import type { LucideIcon } from 'lucide-react'
import { Bot, Monitor, RotateCcw, Server } from 'lucide-react'
import { cn } from '@/lib/helpers'
import {
  OLLAMA_ACCESS_MODE_OPTIONS,
  getOllamaAccessModeLabel,
  type OllamaAccessModeSelection,
  useOllamaAccessMode,
} from '@/app/ai/features/chat/hooks/ollamaAccessMode'
import { DashboardCard } from './DashboardCard'

const MODE_DESCRIPTIONS: Record<OllamaAccessModeSelection, string> = {
  default: '使用站点默认设置。适合统一跟随部署环境。',
  auto: '优先连接当前设备的本机 Ollama，失败后回退到服务器。',
  browser: '只连接当前设备的本机 Ollama，不再回退到服务器。',
  server: '只连接服务器侧配置的 Ollama，不再尝试当前设备的本机服务。',
}

const MODE_ICONS: Record<OllamaAccessModeSelection, LucideIcon> = {
  default: RotateCcw,
  auto: Bot,
  browser: Monitor,
  server: Server,
}

const MODE_SELECTIONS: OllamaAccessModeSelection[] = ['default', ...OLLAMA_ACCESS_MODE_OPTIONS]

export function OllamaPanel() {
  const {
    ollamaAccessModeSelection,
    effectiveOllamaAccessMode,
    defaultOllamaAccessMode,
    setOllamaAccessModeSelection,
  } = useOllamaAccessMode()

  return (
    <DashboardCard
      title="Ollama 访问模式"
      description="配置通用 AI 面板中 Ollama 的模型列表与聊天请求来源。"
      icon={Bot}
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
            <div className="text-muted-foreground text-xs font-medium">站点默认</div>
            <div className="text-sm font-medium">
              {getOllamaAccessModeLabel(defaultOllamaAccessMode)}
            </div>
            <p className="text-muted-foreground text-xs leading-5">
              由环境变量 NEXT_PUBLIC_OLLAMA_ACCESS_MODE 控制，未设置时默认使用自动模式。
            </p>
          </div>

          <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
            <div className="text-muted-foreground text-xs font-medium">当前生效</div>
            <div className="text-sm font-medium">
              {getOllamaAccessModeLabel(effectiveOllamaAccessMode)}
            </div>
            <p className="text-muted-foreground text-xs leading-5">
              当前浏览器选择：{getOllamaAccessModeLabel(ollamaAccessModeSelection)}。
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {MODE_SELECTIONS.map(mode => {
            const Icon = MODE_ICONS[mode]
            const active = ollamaAccessModeSelection === mode

            return (
              <button
                key={mode}
                type="button"
                onClick={() => setOllamaAccessModeSelection(mode)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'hover:bg-muted/50 border-border'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {getOllamaAccessModeLabel(mode)}
                  </span>
                  <span className="text-muted-foreground block text-xs leading-5">
                    {MODE_DESCRIPTIONS[mode]}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="space-y-2 rounded-xl border bg-muted/30 p-3 text-xs leading-5">
          <p>自动：先尝试当前设备的 localhost:11434，失败后回退到服务器。</p>
          <p>仅服务器：要求服务器已配置 OLLAMA_BASE_URL，适合统一走线上部署的 Ollama。</p>
          <p>仅本机：要求当前设备正在运行 Ollama，并通过 OLLAMA_ORIGINS 允许线上域名访问。</p>
          <p>
            这里的选择只保存在当前浏览器。若要让所有用户统一默认值，请设置
            NEXT_PUBLIC_OLLAMA_ACCESS_MODE 并重新部署。
          </p>
        </div>
      </div>
    </DashboardCard>
  )
}
