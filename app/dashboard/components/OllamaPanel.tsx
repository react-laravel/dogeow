'use client'

import { useCallback, useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Bot, Monitor, RotateCcw, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/helpers'
import {
  OLLAMA_ACCESS_MODE_OPTIONS,
  getOllamaAccessModeLabel,
  type OllamaAccessModeSelection,
  useOllamaAccessMode,
} from '@/app/ai/features/chat/hooks/ollamaAccessMode'
import {
  DEFAULT_BROWSER_OLLAMA_ADDRESS,
  fetchBrowserLocalOllamaDebugInfo,
  type BrowserOllamaDebugInfo,
  normalizeBrowserOllamaAddress,
  useBrowserOllamaAddress,
} from '@/app/ai/features/chat/hooks/browserOllama'
import { DashboardCard } from './DashboardCard'

const MODE_DESCRIPTIONS: Record<OllamaAccessModeSelection, string> = {
  default: '使用站点默认设置。适合统一跟随部署环境。',
  auto: '优先连接浏览器直连的 Ollama 地址，失败后回退到服务器。',
  browser: '只连接浏览器直连的 Ollama 地址，不再回退到服务器。',
  server: '只连接服务器侧配置的 Ollama，不再尝试浏览器直连。',
}

const MODE_ICONS: Record<OllamaAccessModeSelection, LucideIcon> = {
  default: RotateCcw,
  auto: Bot,
  browser: Monitor,
  server: Server,
}

const MODE_SELECTIONS: OllamaAccessModeSelection[] = ['default', ...OLLAMA_ACCESS_MODE_OPTIONS]

export function OllamaPanel() {
  const { ollamaAccessModeSelection, effectiveOllamaAccessMode, setOllamaAccessModeSelection } =
    useOllamaAccessMode()
  const {
    browserOllamaAddress,
    browserOllamaBaseUrl,
    setBrowserOllamaAddress,
    resetBrowserOllamaAddress,
  } = useBrowserOllamaAddress()
  const [draftBrowserOllamaAddress, setDraftBrowserOllamaAddress] = useState(browserOllamaAddress)
  const [debugInfo, setDebugInfo] = useState<BrowserOllamaDebugInfo | null>(null)
  const [debugError, setDebugError] = useState<string | null>(null)
  const [isLoadingDebugInfo, setIsLoadingDebugInfo] = useState(false)

  useEffect(() => {
    setDraftBrowserOllamaAddress(browserOllamaAddress)
  }, [browserOllamaAddress])

  const loadDebugInfo = useCallback(async () => {
    setIsLoadingDebugInfo(true)
    setDebugError(null)

    try {
      const nextDebugInfo = await fetchBrowserLocalOllamaDebugInfo()
      setDebugInfo(nextDebugInfo)
    } catch (error) {
      setDebugInfo(null)
      setDebugError(error instanceof Error ? error.message : '无法获取 Ollama 调试信息')
    } finally {
      setIsLoadingDebugInfo(false)
    }
  }, [])

  useEffect(() => {
    void loadDebugInfo()
  }, [browserOllamaAddress, loadDebugInfo])

  const normalizedDraftBrowserOllamaAddress =
    normalizeBrowserOllamaAddress(draftBrowserOllamaAddress)
  const hasBrowserOllamaAddressChanges =
    normalizedDraftBrowserOllamaAddress !== browserOllamaAddress
  const isUsingDefaultBrowserOllamaAddress =
    browserOllamaAddress === DEFAULT_BROWSER_OLLAMA_ADDRESS &&
    normalizedDraftBrowserOllamaAddress === DEFAULT_BROWSER_OLLAMA_ADDRESS

  return (
    <DashboardCard
      title="Ollama 访问模式"
      description="配置通用 AI 面板中 Ollama 的模型列表与聊天请求来源。"
      icon={Bot}
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
            <div className="text-muted-foreground text-xs font-medium">浏览器直连地址</div>
            <div className="space-y-3">
              <Input
                value={draftBrowserOllamaAddress}
                onChange={event => setDraftBrowserOllamaAddress(event.target.value)}
                placeholder={DEFAULT_BROWSER_OLLAMA_ADDRESS}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
              <p className="text-muted-foreground text-xs leading-5">
                默认使用 {DEFAULT_BROWSER_OLLAMA_ADDRESS}。可以改成 Tailscale macOS 地址，或
                Tailscale Serve 的 HTTPS 地址。HTTPS 页面里直接请求 HTTP 地址会被 iOS/Safari 拦截。
              </p>
              <p className="text-muted-foreground break-all text-xs leading-5">
                当前请求地址：{browserOllamaBaseUrl}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => setBrowserOllamaAddress(draftBrowserOllamaAddress)}
                  disabled={!hasBrowserOllamaAddressChanges}
                >
                  保存地址
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetBrowserOllamaAddress}
                  disabled={isUsingDefaultBrowserOllamaAddress}
                >
                  恢复默认
                </Button>
                <Button variant="outline" size="sm" onClick={() => void loadDebugInfo()}>
                  {isLoadingDebugInfo ? '调试中...' : '刷新调试列表'}
                </Button>
              </div>
            </div>
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

        <div className="space-y-3 rounded-xl border bg-muted/30 p-3 text-xs leading-5">
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs font-medium">地址调试</div>
            <p className="text-muted-foreground break-all">
              直接请求当前地址的 /api/tags，并按前端实际规则过滤 embed/cloud
              模型。若这里显示混合内容或 CORS 提示，请优先改用 Tailscale Serve 的 HTTPS 地址。
            </p>
          </div>

          {debugError ? (
            <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-3 break-all">
              {debugError}
            </div>
          ) : null}

          {debugInfo ? (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1 rounded-xl border bg-background/60 p-3">
                  <div className="text-muted-foreground">原始模型数</div>
                  <div className="text-sm font-medium">{debugInfo.rawModels.length}</div>
                </div>
                <div className="space-y-1 rounded-xl border bg-background/60 p-3">
                  <div className="text-muted-foreground">过滤后聊天模型数</div>
                  <div className="text-sm font-medium">{debugInfo.chatModels.length}</div>
                </div>
                <div className="space-y-1 rounded-xl border bg-background/60 p-3">
                  <div className="text-muted-foreground">被过滤模型数</div>
                  <div className="text-sm font-medium">{debugInfo.excludedModels.length}</div>
                </div>
              </div>

              <div className="space-y-1 rounded-xl border bg-background/60 p-3">
                <div className="text-muted-foreground">调试请求地址</div>
                <div className="break-all text-sm font-medium">{debugInfo.tagsUrl}</div>
                {debugInfo.pageOrigin ? (
                  <div className="text-muted-foreground break-all">
                    页面来源：{debugInfo.pageOrigin}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-2 rounded-xl border bg-background/60 p-3">
                  <div className="text-muted-foreground">过滤后聊天模型</div>
                  {debugInfo.chatModels.length > 0 ? (
                    <div className="space-y-1">
                      {debugInfo.chatModels.map(model => (
                        <div key={model.name} className="rounded-lg border px-2 py-1 break-all">
                          {model.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">没有可用聊天模型</div>
                  )}
                </div>

                <div className="space-y-2 rounded-xl border bg-background/60 p-3">
                  <div className="text-muted-foreground">被过滤模型</div>
                  {debugInfo.excludedModels.length > 0 ? (
                    <div className="space-y-1">
                      {debugInfo.excludedModels.map(model => (
                        <div
                          key={`${model.name}-${model.reason}`}
                          className="rounded-lg border px-2 py-1"
                        >
                          <div className="break-all">{model.name}</div>
                          <div className="text-muted-foreground break-all">{model.reason}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">没有模型被过滤</div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
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
          <p>自动：先尝试上面保存的浏览器直连地址，失败后回退到服务器。</p>
          <p>仅服务器：要求服务器已配置 OLLAMA_BASE_URL，适合统一走线上部署的 Ollama。</p>
          <p>浏览器直连：要求目标 Ollama 通过 OLLAMA_ORIGINS 允许站点域名访问。</p>
          <p>
            这里的地址和访问模式都只保存在当前浏览器。若要让所有用户统一默认访问模式， 请设置
            NEXT_PUBLIC_OLLAMA_ACCESS_MODE 并重新部署。
          </p>
        </div>
      </div>
    </DashboardCard>
  )
}
