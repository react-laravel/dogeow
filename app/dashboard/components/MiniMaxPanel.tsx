import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { apiRequest } from '@/lib/api'
import { cn } from '@/lib/helpers'
import type {
  MiniMaxSubscriptionResponse,
  MiniMaxSubscriptionDetailResponse,
  MiniMaxBillingResponse,
} from '../types'

// 自动刷新间隔（毫秒）
const REFRESH_INTERVAL = 10000

function MiniMaxRefreshButton() {
  const { isLoading, mutate } = useSWR<MiniMaxSubscriptionResponse>(
    '/minimax/subscription',
    url => apiRequest<MiniMaxSubscriptionResponse>(url, 'GET', undefined, { handleError: false }),
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: true, // 回到tab时自动刷新
      isPaused: () => typeof document !== 'undefined' && document.visibilityState !== 'visible',
    }
  )
  const [countdown, setCountdown] = useState(() => REFRESH_INTERVAL / 1000)
  // 计时器逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (!isLoading) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            return REFRESH_INTERVAL / 1000
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isLoading, REFRESH_INTERVAL])

  // 手动刷新并重置倒计时
  const handleManualRefresh = async () => {
    setCountdown(REFRESH_INTERVAL / 1000)
    await mutate()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleManualRefresh}
      disabled={isLoading}
      className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
    >
      <span className="mr-2 text-[11px] tabular-nums text-muted-foreground min-w-[28px] text-right">
        {countdown}s
      </span>
      <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
      刷新
    </Button>
  )
}

export function MiniMaxPanel() {
  const sub = useSWR<MiniMaxSubscriptionResponse>(
    '/minimax/subscription',
    url => apiRequest<MiniMaxSubscriptionResponse>(url, 'GET', undefined, { handleError: false }),
    { refreshInterval: 30000 }
  )
  const detail = useSWR<MiniMaxSubscriptionDetailResponse>(
    '/minimax/subscription-detail',
    url =>
      apiRequest<MiniMaxSubscriptionDetailResponse>(url, 'GET', undefined, { handleError: false }),
    { revalidateOnFocus: true, refreshInterval: 30000 }
  )
  const billing = useSWR<MiniMaxBillingResponse>(
    '/minimax/billing',
    url => apiRequest<MiniMaxBillingResponse>(url, 'GET', undefined, { handleError: false }),
    { revalidateOnFocus: true, refreshInterval: 30000 }
  )

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
  const weekPct = weekTotal > 0 ? ((weekUsed / weekTotal) * 100).toFixed(2) : '0'

  // 套餐到期时间
  const subscribeEnd = detailData?.current_subscribe?.current_subscribe_end_time
  const subscribeEndStr = fmtDate(subscribeEnd)
  const [subscribeDaysLeft, setSubscribeDaysLeft] = useState<number | null>(null)
  useEffect(() => {
    if (!subscribeEnd) {
      setTimeout(() => setSubscribeDaysLeft(null), 0)
      return
    }
    let days = null
    try {
      const now = Date.now()
      if (typeof subscribeEnd === 'string' && subscribeEnd.includes('/')) {
        const [mm, dd, yyyy] = subscribeEnd.split('/')
        const expiry = new Date(`${yyyy}-${mm}-${dd}T00:00:00+08:00`)
        days = Math.ceil((expiry.getTime() - now) / 86400000)
      } else {
        days = Math.ceil((new Date(Number(subscribeEnd)).getTime() - now) / 86400000)
      }
    } catch {
      days = null
    }
    setTimeout(() => setSubscribeDaysLeft(days), 0)
  }, [subscribeEnd])

  // Token 消耗：从账单记录聚合（created_at 是秒级时间戳，账单延迟约1-2天）
  const billingRecords = useMemo(() => billingData?.charge_records ?? [], [billingData])

  // 近7天消耗（每次 billingRecords 变化时重新计算）
  const [weeklyTokens, setWeeklyTokens] = useState(0)
  useEffect(() => {
    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    setTimeout(() => {
      setWeeklyTokens(
        billingRecords
          .filter(r => r.created_at * 1000 >= sevenDaysAgo)
          .reduce((sum, r) => sum + (Number(r.consume_token) || 0), 0)
      )
    }, 0)
  }, [billingRecords])

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

      {/* 套餐到期时间 - 单行 */}
      {subscribeEndStr !== '—' && (
        <div className="rounded-xl border bg-muted/30 p-3">
          <div className="flex items-baseline justify-between gap-x-1.5">
            <span className="text-muted-foreground text-xs">
              {detailData?.current_subscribe?.current_subscribe_title ?? '套餐'}
            </span>
            {subscribeDaysLeft !== null && (
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  subscribeDaysLeft <= 3
                    ? 'text-destructive'
                    : subscribeDaysLeft <= 7
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground'
                )}
              >
                {subscribeDaysLeft > 0
                  ? `还有 ${subscribeDaysLeft} 天 (${subscribeEndStr})`
                  : `今日到期 (${subscribeEndStr})`}
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
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-2xl font-bold sm:text-3xl">
                    {cycleRemain.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-sm">次剩余</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {fmtTime(subModel?.remains_time ?? 0)}后重置
                </span>
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
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-2xl font-bold sm:text-3xl">
                    {weekRemain.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-sm">次剩余</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {fmtTime(subModel?.weekly_remains_time ?? 0)}后重置
                </span>
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
          {billingData && billingRecords.length > 0 && (
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="flex items-baseline justify-between gap-x-1.5">
                <span className="text-muted-foreground text-xs">近7天 Token</span>
                <div className="flex items-baseline gap-x-1.5">
                  <span className="text-primary text-base font-bold">
                    {fmtTokens(weeklyTokens)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    截至 {lastRecordDate ?? '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 模型列表 */}
          {models.length > 0 && (
            <div>
              <div className="text-muted-foreground mb-2 text-xs font-medium">
                支持的模型 ({models.length})
              </div>
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

export { MiniMaxRefreshButton }
