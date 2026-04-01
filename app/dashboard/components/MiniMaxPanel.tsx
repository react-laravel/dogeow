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

interface MediaQuotaPlan {
  id: string
  label: string
  speechDaily: string
  imageDaily: string
  videoFastDaily: string
  videoDaily: string
  musicDaily: string
}

const STANDARD_MEDIA_QUOTA_PLANS: MediaQuotaPlan[] = [
  {
    id: 'starter',
    label: 'Starter',
    speechDaily: '—',
    imageDaily: '—',
    videoFastDaily: '—',
    videoDaily: '—',
    musicDaily: '—',
  },
  {
    id: 'plus',
    label: 'Plus',
    speechDaily: '4,000 字符/日',
    imageDaily: '50 张/日',
    videoFastDaily: '—',
    videoDaily: '—',
    musicDaily: '—',
  },
  {
    id: 'max',
    label: 'Max',
    speechDaily: '11,000 字符/日',
    imageDaily: '120 张/日',
    videoFastDaily: '2 个/日',
    videoDaily: '2 个/日',
    musicDaily: '4 首/日（每首≤5分钟）',
  },
]

const SPEED_MEDIA_QUOTA_PLANS: MediaQuotaPlan[] = [
  {
    id: 'plus-speed',
    label: 'Plus-极速版',
    speechDaily: '9,000 字符/日',
    imageDaily: '100 张/日',
    videoFastDaily: '—',
    videoDaily: '—',
    musicDaily: '—',
  },
  {
    id: 'max-speed',
    label: 'Max-极速版',
    speechDaily: '19,000 字符/日',
    imageDaily: '200 张/日',
    videoFastDaily: '3 个/日',
    videoDaily: '3 个/日',
    musicDaily: '7 首/日（每首≤5分钟）',
  },
  {
    id: 'ultra-speed',
    label: 'Ultra-极速版',
    speechDaily: '50,000 字符/日',
    imageDaily: '800 张/日',
    videoFastDaily: '5 个/日',
    videoDaily: '5 个/日',
    musicDaily: '15 首/日（每首≤5分钟）',
  },
]

function normalizePlanTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[\-_/]/g, '')
    .replace(/[()（）]/g, '')
    .replace(/套餐/g, '')
}

function resolveCurrentPlanId(planTitle: string | undefined): string | null {
  if (!planTitle) return null

  const normalized = normalizePlanTitle(planTitle)
  if (!normalized) return null

  if (normalized.includes('ultra极速版') || normalized.includes('ultraspeed')) {
    return 'ultra-speed'
  }
  if (normalized.includes('max极速版') || normalized.includes('maxspeed')) {
    return 'max-speed'
  }
  if (normalized.includes('plus极速版') || normalized.includes('plusspeed')) {
    return 'plus-speed'
  }
  if (normalized.includes('starter')) {
    return 'starter'
  }
  if (normalized.includes('max')) {
    return 'max'
  }
  if (normalized.includes('plus')) {
    return 'plus'
  }

  return null
}

function getCurrentPlanSummary(planId: string | null): {
  speechDaily: string
  imageDaily: string
  videoFastDaily: string
  videoDaily: string
  musicDaily: string
} {
  const allPlans = [...STANDARD_MEDIA_QUOTA_PLANS, ...SPEED_MEDIA_QUOTA_PLANS]
  const matched = allPlans.find(plan => plan.id === planId)

  return {
    speechDaily: matched?.speechDaily ?? '—',
    imageDaily: matched?.imageDaily ?? '—',
    videoFastDaily: matched?.videoFastDaily ?? '—',
    videoDaily: matched?.videoDaily ?? '—',
    musicDaily: matched?.musicDaily ?? '—',
  }
}

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
  }, [isLoading])

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
  const currentPlanTitle = detailData?.current_subscribe?.current_subscribe_title
  const currentPlanId = resolveCurrentPlanId(currentPlanTitle)
  const currentPlanSummary = getCurrentPlanSummary(currentPlanId)

  const findModelQuota = (candidates: string[]) => {
    const target = models.find(model => candidates.includes(model.model_name))
    if (!target) return null

    const total = target.current_interval_total_count ?? 0
    const remain = target.current_interval_usage_count ?? 0
    const used = total - remain
    const percent = total > 0 ? ((used / total) * 100).toFixed(1) : '0'

    return {
      modelName: target.model_name,
      total,
      remain,
      used,
      percent,
    }
  }

  const musicQuota = findModelQuota(['music-2.5', 'music-2.0'])
  const speechQuota = findModelQuota(['speech-2.8-hd', 'speech-hd', 'speech-2.8'])
  const imageQuota = findModelQuota(['image-01'])
  const videoFastQuota = findModelQuota(['MiniMax-Hailuo-2.3-Fast-6s-768p'])
  const videoQuota = findModelQuota([
    'MiniMax-Hailuo-2.3-6s-768p',
    'MiniMax-Hailuo-02-6s-768p',
    'MiniMax-Hailuo-2.3',
    'MiniMax-Hailuo-02',
  ])

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

      {/* 套餐信息 */}
      {subscribeEndStr !== '—' && (
        <div className="rounded-xl border bg-muted/30 p-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {detailData?.current_subscribe?.current_subscribe_title ?? '套餐'}
              </span>
              <span className="text-xs font-medium text-primary">
                {weekTotal > 0 ? '您是尊敬的周限制用户' : '您是尊敬的非周限制用户'}
              </span>
            </div>
            {subscribeDaysLeft !== null && (
              <div className="text-xs text-muted-foreground">
                {subscribeDaysLeft > 0
                  ? `还有 ${subscribeDaysLeft} 天到期 (${subscribeEndStr})`
                  : `今日到期 (${subscribeEndStr})`}
              </div>
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

          {/* 本周用量 - 仅当有周限制时显示 */}
          {weekTotal > 0 && (
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
          )}

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

          {/* 音乐/视频额度 */}
          <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
            <div className="text-xs font-medium text-muted-foreground">音乐与视频额度</div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  title: 'Speech 2.8',
                  quota: speechQuota,
                  dailyLimit: currentPlanSummary.speechDaily,
                },
                {
                  title: 'image-01',
                  quota: imageQuota,
                  dailyLimit: currentPlanSummary.imageDaily,
                },
                {
                  title: 'Hailuo-2.3-Fast 768P 6s',
                  quota: videoFastQuota,
                  dailyLimit: currentPlanSummary.videoFastDaily,
                },
                {
                  title: 'Hailuo-2.3 768P 6s',
                  quota: videoQuota,
                  dailyLimit: currentPlanSummary.videoDaily,
                },
                {
                  title: 'Music-2.5',
                  quota: musicQuota,
                  dailyLimit: currentPlanSummary.musicDaily,
                },
              ].map(item => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-lg border bg-background/70 px-3 py-2"
                >
                  <span className="text-[11px] text-muted-foreground">{item.title}</span>
                  <span className="text-sm font-medium">
                    {item.quota
                      ? `${item.quota.remain.toLocaleString()} / ${item.quota.total.toLocaleString()}`
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!isLoading && !error && models.length === 0 && (
        <div className="text-muted-foreground text-sm">暂无订阅信息</div>
      )}
    </div>
  )
}

export { MiniMaxRefreshButton }
