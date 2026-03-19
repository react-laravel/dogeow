'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  Calendar,
  CreditCard,
  FileText,
  Globe,
  MapPin,
  Menu,
  Monitor,
  RefreshCw,
  Smartphone,
} from 'lucide-react'
import useSWR from 'swr'
import ProtectedRoute from '@/components/ProtectedRoute'
import { PageContainer, PageTitle } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { isAdminSync } from '@/lib/auth'
import { apiRequest } from '@/lib/api'
import { cn } from '@/lib/helpers'
import { getBrowserInfo, getOSInfo } from '@/lib/utils/userAgent'
import useAuthStore from '@/stores/authStore'

interface Location {
  country: string
  region: string
  city: string
  isp: string
  timezone: string
}

interface BasicInfo {
  ip: string
  user_agent: string
}

interface LocationInfo {
  location: Location
  error?: string
}

interface LogFile {
  name: string
  date: string
  size: number
  modified: number
}

interface DashboardCardProps {
  title: string
  description: string
  icon: LucideIcon
  children: React.ReactNode
  className?: string
}

type DashboardSection = 'location' | 'logs' | 'minimax'

const NAV_ITEMS: Array<{
  key: DashboardSection
  icon: LucideIcon
  label: string
}> = [
  { key: 'location', icon: MapPin, label: '我的位置' },
  { key: 'logs', icon: FileText, label: 'Laravel 日志' },
  { key: 'minimax', icon: CreditCard, label: 'MiniMax 订阅' },
]

function DashboardNavItem({
  icon: Icon,
  label,
  active,
  onSelect,
}: {
  icon: LucideIcon
  label: string
  active?: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
        active
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  )
}

interface MiniMaxModelRemain {
  model_name: string
  remains_time: number
  current_interval_total_count: number
  current_interval_usage_count: number
  current_weekly_total_count: number
  current_weekly_usage_count: number
  weekly_remains_time: number
  start_time: number
  end_time: number
  weekly_start_time: number
  weekly_end_time: number
}

interface MiniMaxSubscriptionResponse {
  model_remains: MiniMaxModelRemain[]
  base_resp?: { status_code: number; status_msg: string }
}

interface MiniMaxSubscriptionDetailResponse {
  current_subscribe?: {
    current_subscribe_end_time?: string
    current_subscribe_title?: string
    current_credit_reload_time?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

interface MiniMaxBillingRecord {
  consume_token: string | number
  created_at: number
  consume_time?: string
  [key: string]: unknown
}

interface MiniMaxBillingResponse {
  charge_records?: MiniMaxBillingRecord[]
  total_cnt?: number
  [key: string]: unknown
}

// 共享 SWR hooks，两个组件使用相同缓存 key，mutate 自动同步
function useMiniMaxSubscription() {
  const fetcher = async <T,>(url: string): Promise<T> =>
    apiRequest<T>(url, 'GET', undefined, { handleError: false }) as Promise<T>

  const sub = useSWR<MiniMaxSubscriptionResponse>('/minimax/subscription', fetcher, {
    refreshInterval: 60000,
  })
  const detail = useSWR<MiniMaxSubscriptionDetailResponse>(
    '/minimax/subscription-detail',
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60000 }
  )
  const billing = useSWR<MiniMaxBillingResponse>('/minimax/billing', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000,
  })

  return {
    sub,
    detail,
    billing,
    refresh: () => {
      sub.mutate()
      detail.mutate()
      billing.mutate()
    },
  }
}

function MiniMaxRefreshButton() {
  const { isLoading, mutate } = useSWR<MiniMaxSubscriptionResponse>(
    '/minimax/subscription',
    url => apiRequest<MiniMaxSubscriptionResponse>(url, 'GET', undefined, { handleError: false }),
    { refreshInterval: 60000 }
  )
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => mutate()}
      disabled={isLoading}
      className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
    >
      <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
      刷新
    </Button>
  )
}

function DashboardCard({
  title,
  description,
  icon: Icon,
  className,
  children,
}: DashboardCardProps) {
  return (
    <section className={cn('bg-background rounded-2xl border p-4 shadow-sm sm:p-5', className)}>
      <div className="mb-4 flex items-start gap-3 border-b pb-4">
        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

export default function Dashboard() {
  const { isAuthenticated } = useAuthStore()
  const isAdmin = useMemo(() => isAdminSync(), [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 从 URL 读取当前 section，默认 location
  const activeSection = (searchParams.get('section') as DashboardSection) || 'location'

  const setActiveSection = (section: DashboardSection) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', section)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // 共享 SWR hooks
  const { sub, detail, billing } = useMiniMaxSubscription()

  if (!isAuthenticated) {
    return <div className="text-muted-foreground p-6">正在加载用户信息...</div>
  }

  const visibleNavItems = NAV_ITEMS.filter(item => item.key === 'location' || isAdmin)

  const activeNavLabel = visibleNavItems.find(n => n.key === activeSection)?.label ?? '仪表盘'

  const activeContent = (() => {
    switch (activeSection) {
      case 'location':
        return <LocationPanel />
      case 'logs':
        return <LogPanel />
      case 'minimax':
        return <MiniMaxPanel sub={sub} detail={detail} billing={billing} />
    }
  })()

  return (
    <ProtectedRoute>
      <PageContainer maxWidth="6xl" className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* 顶部栏 */}
        <header className="mb-6 flex items-center gap-3">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-56 p-0"
              style={{ top: 'var(--app-header-height, 50px)' }}
            >
              <SheetHeader className="border-b p-4">
                <SheetTitle className="text-base">仪表盘</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3">
                {visibleNavItems.map(item => (
                  <DashboardNavItem
                    key={item.key}
                    icon={item.icon}
                    label={item.label}
                    active={activeSection === item.key}
                    onSelect={() => {
                      setActiveSection(item.key)
                      setSidebarOpen(false)
                    }}
                  />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <PageTitle className="flex-1 text-2xl sm:text-3xl">{activeNavLabel}</PageTitle>
          {activeSection === 'minimax' && <MiniMaxRefreshButton />}
        </header>

        {/* 内容区 */}
        <div className="mx-auto max-w-5xl">{activeContent}</div>
      </PageContainer>
    </ProtectedRoute>
  )
}

function LocationPanel() {
  const { data: basicInfo, isLoading: basicLoading } = useSWR<BasicInfo>(
    '/client-basic-info',
    apiRequest
  )

  const {
    data: locationInfo,
    isLoading: locationLoading,
    error: locationError,
  } = useSWR<LocationInfo>('/client-location-info', apiRequest)

  const browserInfo = getBrowserInfo(basicInfo?.user_agent)
  const osInfo = getOSInfo(basicInfo?.user_agent)
  const BrowserIcon = browserInfo.Icon
  const OSIcon = osInfo.Icon

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <Monitor className="h-3.5 w-3.5" />
          IP 地址
        </div>
        <div className="text-sm break-all">
          {basicLoading ? '加载中...' : basicInfo?.ip || '未知'}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <Globe className="h-3.5 w-3.5" />
          地理位置
        </div>
        <div className="text-sm">
          {locationLoading ? (
            <LoadingState message="正在获取地理位置信息..." size="sm" />
          ) : locationError ? (
            <div className="text-destructive">地理位置信息获取失败，请稍后重试</div>
          ) : locationInfo?.location ? (
            <div className="space-y-1">
              <div>国家/地区：{locationInfo.location.country || '未知'}</div>
              <div>省份：{locationInfo.location.region || '未知'}</div>
              <div>城市：{locationInfo.location.city || '未知'}</div>
              <div>网络服务商：{locationInfo.location.isp || '未知'}</div>
              <div>时区：{locationInfo.location.timezone || '未知'}</div>
            </div>
          ) : (
            <div className="text-muted-foreground">暂无地理位置信息</div>
          )}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <Smartphone className="h-3.5 w-3.5" />
          浏览器信息
        </div>

        {basicLoading ? (
          <div className="text-sm">加载中...</div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-background text-foreground inline-flex items-center gap-1 rounded-full border px-2 py-1">
                <BrowserIcon className="h-3.5 w-3.5" />
                {browserInfo.label}
              </span>
              <span className="bg-background text-foreground inline-flex items-center gap-1 rounded-full border px-2 py-1">
                <OSIcon className="h-3.5 w-3.5" />
                {osInfo.label}
              </span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed break-all">
              {basicInfo?.user_agent || '未知 User-Agent'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function LogPanel() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  const { data: logFiles, isLoading: logsLoading } = useSWR<LogFile[]>('/logs', apiRequest, {
    revalidateOnFocus: false,
  })

  const logKey = selectedDate ? `/logs/show?date=${selectedDate}&lines=500` : null

  const {
    data: logData,
    isLoading: logContentLoading,
    mutate: mutateLog,
  } = useSWR<{ content: string }>(logKey, apiRequest, {
    revalidateOnFocus: false,
  })

  useEffect(() => {
    if (!hasInitialized && logFiles && logFiles.length > 0 && !selectedDate) {
      const latestFile = [...logFiles].sort((a, b) => b.date.localeCompare(a.date))[0]
      setSelectedDate(latestFile.date)
      setHasInitialized(true)
    }
  }, [logFiles, hasInitialized, selectedDate])

  useEffect(() => {
    if (!selectedDate) return

    let echo: {
      channel: (name: string) => { listen: (event: string, cb: () => void) => void }
      leave: (name: string) => void
    } | null = null

    const setupEcho = async () => {
      try {
        const { getEchoInstance } = await import('@/lib/websocket/echo')
        const instance = getEchoInstance()

        if (instance && typeof instance.channel === 'function') {
          echo = instance as typeof echo
          if (!echo) return
          const channel = echo.channel('log-updates')

          channel.listen('.log.updated', () => {
            mutateLog()
          })
        }
      } catch (error) {
        console.warn('WebSocket 连接失败:', error)
      }
    }

    setupEcho()

    return () => {
      if (echo) {
        echo.leave('log-updates')
      }
    }
  }, [selectedDate, mutateLog])

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex min-h-[520px] flex-col gap-4">
      <div className="rounded-xl border bg-muted/30 p-3">
        {logsLoading ? (
          <LoadingState message="加载日志列表..." size="sm" />
        ) : logFiles && logFiles.length > 0 ? (
          <Select
            value={selectedDate || ''}
            onValueChange={value => {
              if (value) {
                setSelectedDate(value)
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择日志日期" />
            </SelectTrigger>
            <SelectContent>
              {logFiles.map(file => (
                <SelectItem key={file.date} value={file.date}>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{file.date}</span>
                    <span className="text-muted-foreground text-xs">({formatSize(file.size)})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="text-muted-foreground text-sm">暂无可用日志文件</div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-background">
        {selectedDate ? (
          <ScrollArea className="h-[420px] sm:h-[500px]">
            <div className="p-3 sm:p-4">
              {logContentLoading ? (
                <LoadingState message="加载日志内容..." size="sm" />
              ) : logData?.content ? (
                <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                  {logData.content}
                </pre>
              ) : (
                <div className="text-muted-foreground text-sm">暂无日志内容</div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-muted-foreground flex h-[420px] items-center justify-center text-sm">
            请选择日志日期
          </div>
        )}
      </div>
    </div>
  )
}

function MiniMaxPanel({
  sub,
  detail,
  billing,
}: {
  sub: ReturnType<typeof useSWR<MiniMaxSubscriptionResponse>>
  detail: ReturnType<typeof useSWR<MiniMaxSubscriptionDetailResponse>>
  billing: ReturnType<typeof useSWR<MiniMaxBillingResponse>>
}) {
  const subData = sub.data ?? null
  const detailData = detail.data ?? null
  const billingData = billing.data ?? null
  const isLoading = sub.isLoading
  const error = sub.error

  const models = subData?.model_remains ?? []
  const subModel = models[0]

  const fmtTime = (ms: number): string => {
    const s = Math.floor(ms / 1000)
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    if (d > 0) return `${d}天${h}小时`
    if (h > 0) return `${h}小时${m}分`
    return `${m}分`
  }

  const fmtDate = (v: string | number | undefined): string => {
    if (!v) return '—'
    try {
      if (typeof v === 'string' && v.includes('/')) {
        // "04/17/2026" format → parse manually
        const [mm, dd, yyyy] = v.split('/')
        const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00+08:00`)
        return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
      }
      const d = new Date(Number(v))
      return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
    } catch {
      return String(v)
    }
  }

  const fmtTokens = (n: number): string => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return n.toLocaleString()
  }

  // usage_count 字段实际上是剩余次数
  const cycleTotal = subModel?.current_interval_total_count ?? 0
  const cycleRemain = subModel?.current_interval_usage_count ?? 0
  const cycleUsed = cycleTotal - cycleRemain
  const cyclePct = cycleTotal > 0 ? ((cycleUsed / cycleTotal) * 100).toFixed(1) : '0'

  const weekTotal = subModel?.current_weekly_total_count ?? 0
  const weekRemain = subModel?.current_weekly_usage_count ?? 0
  const weekUsed = weekTotal - weekRemain
  const weekPct = weekTotal > 0 ? ((weekUsed / weekTotal) * 100).toFixed(1) : '0'

  // 套餐到期时间
  const subscribeEnd = detailData?.current_subscribe?.current_subscribe_end_time
  const subscribeEndStr = fmtDate(subscribeEnd)
  const subscribeDaysLeft = useMemo(() => {
    if (!subscribeEnd) return null
    // eslint-disable-next-line react-hooks/purity -- snapshot of current time for display, intentionally not reactive
    const now = Date.now()
    try {
      if (typeof subscribeEnd === 'string' && subscribeEnd.includes('/')) {
        const [mm, dd, yyyy] = subscribeEnd.split('/')
        const expiry = new Date(`${yyyy}-${mm}-${dd}T00:00:00+08:00`)
        return Math.ceil((expiry.getTime() - now) / 86400000)
      }
      return Math.ceil((new Date(Number(subscribeEnd)).getTime() - now) / 86400000)
    } catch {
      return null
    }
  }, [subscribeEnd])

  // Token 消耗：从账单记录聚合（created_at 是秒级时间戳，账单延迟约1-2天）
  const billingRecords = billingData?.charge_records ?? []

  // 近7天消耗
  const sevenDaysAgo = useMemo(
    // eslint-disable-next-line react-hooks/purity -- snapshot of current time for display, intentionally not reactive
    () => Date.now() - 7 * 24 * 60 * 60 * 1000,
    []
  )
  const weeklyTokens = useMemo(
    () =>
      billingRecords
        .filter(r => r.created_at * 1000 >= sevenDaysAgo)
        .reduce((sum, r) => sum + (Number(r.consume_token) || 0), 0),
    [billingRecords, sevenDaysAgo]
  )

  // 数据截至日期
  const lastRecord = billingRecords[0]
  const lastRecordDate = lastRecord?.consume_time ? lastRecord.consume_time.split(' ')[0] : null

  return (
    <div className="space-y-4">
      {isLoading && <LoadingState message="加载 MiniMax 订阅信息..." size="sm" />}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error instanceof Error ? error.message : '获取订阅信息失败'}
        </div>
      )}

      {/* 套餐到期时间 - 醒目卡片 */}
      {subscribeEndStr !== '—' && (
        <div className="rounded-2xl border bg-muted/30 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs text-muted-foreground">
                {detailData?.current_subscribe?.current_subscribe_title ?? '套餐到期时间'}
              </div>
              <div className="mt-0.5 text-base font-semibold sm:text-lg">{subscribeEndStr}</div>
            </div>
            {subscribeDaysLeft !== null && (
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-medium',
                  subscribeDaysLeft <= 3
                    ? 'text-destructive'
                    : subscribeDaysLeft <= 7
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground'
                )}
              >
                {subscribeDaysLeft > 0 ? `还有 ${subscribeDaysLeft} 天` : '今日到期'}
              </span>
            )}
          </div>
        </div>
      )}

      {sub && (
        <>
          {/* 周期用量 - 突出显示 */}
          <div className="rounded-2xl border bg-muted/30 p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">本周期</div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-2xl font-bold sm:text-3xl">
                  {cycleRemain.toLocaleString()}
                </span>
                <span className="text-muted-foreground text-sm">次剩余</span>
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-primary/10">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(parseFloat(cyclePct), 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {cycleUsed.toLocaleString()}/{cycleTotal.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">已用 {cyclePct}%</span>
            </div>
          </div>

          {/* 本周用量 - 突出显示 */}
          <div className="rounded-2xl border bg-muted/30 p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">本周</div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-2xl font-bold sm:text-3xl">
                  {weekRemain.toLocaleString()}
                </span>
                <span className="text-muted-foreground text-sm">次剩余</span>
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-primary/10">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(parseFloat(weekPct), 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {weekUsed.toLocaleString()}/{weekTotal.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">已用 {weekPct}%</span>
            </div>
          </div>

          {/* Token 消耗 */}
          {billingData && billingRecords.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-muted/30 p-3 text-center">
                <div className="text-muted-foreground text-xs">近7天 Token</div>
                <div className="text-primary mt-1 text-base font-bold">
                  {fmtTokens(weeklyTokens)}
                </div>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3 text-center">
                <div className="text-muted-foreground text-xs">数据截至</div>
                <div className="text-primary mt-1 text-base font-bold">{lastRecordDate ?? '—'}</div>
              </div>
              <div className="col-span-2 rounded-xl border bg-muted/30 p-3 text-center sm:col-span-1">
                <div className="text-muted-foreground text-xs">支持模型数</div>
                <div className="text-primary mt-1 text-base font-bold">{models.length}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border bg-muted/30 p-3 text-center">
                <div className="text-muted-foreground text-xs">支持模型数</div>
                <div className="text-primary mt-1 text-base font-bold">{models.length}</div>
              </div>
            </div>
          )}

          {/* 次要信息 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border bg-muted/30 p-3 text-center">
              <div className="text-muted-foreground text-xs">周期剩余时间</div>
              <div className="text-primary mt-1 text-base font-bold">
                {fmtTime(subModel.remains_time)}
              </div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3 text-center">
              <div className="text-muted-foreground text-xs">本周剩余时间</div>
              <div className="text-primary mt-1 text-base font-bold">
                {fmtTime(subModel.weekly_remains_time)}
              </div>
            </div>
          </div>

          {/* 模型列表 */}
          {models.length > 0 && (
            <div>
              <div className="text-muted-foreground mb-2 text-xs font-medium">支持的模型</div>
              <div className="flex flex-wrap gap-1.5">
                {models.map(m => (
                  <span
                    key={m.model_name}
                    className="bg-muted text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs font-mono"
                  >
                    {m.model_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!isLoading && !error && models.length === 0 && (
        <div className="text-muted-foreground text-sm">暂无订阅信息</div>
      )}
    </div>
  )
}
