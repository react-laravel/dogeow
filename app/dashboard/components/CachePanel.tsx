import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { RefreshCw, Trash2, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { Badge } from '@/components/ui/badge'
import { apiRequest } from '@/lib/api'
import type { DashboardCacheItem, DashboardCacheClearResponse } from '../types'

export function CachePanel() {
  const [clearingId, setClearingId] = useState<string | null>(null)

  const {
    data: cacheItems,
    isLoading,
    mutate,
  } = useSWR<DashboardCacheItem[]>('/cache', apiRequest, {
    revalidateOnFocus: false,
  })

  const sortedItems = useMemo(
    () => [...(cacheItems ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [cacheItems]
  )

  const handleClear = async (item: DashboardCacheItem) => {
    const confirmed = window.confirm(`确认清理缓存：${item.name}？`)
    if (!confirmed) return

    setClearingId(item.id)
    try {
      await apiRequest<DashboardCacheClearResponse>(`/cache/${item.id}`, 'DELETE')
      await mutate()
    } finally {
      setClearingId(null)
    }
  }

  return (
    <div className="flex min-h-[520px] flex-col gap-4">
      <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
        <div className="text-sm text-muted-foreground">可在此查看和清理服务端缓存项</div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => mutate()}>
          <RefreshCw className="h-3.5 w-3.5" />
          刷新
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background">
        {isLoading ? (
          <div className="p-4">
            <LoadingState message="加载缓存列表..." size="sm" />
          </div>
        ) : sortedItems.length > 0 ? (
          <div className="divide-y">
            {sortedItems.map(item => {
              const isClearing = clearingId === item.id

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <h3 className="truncate text-sm font-semibold sm:text-base">{item.name}</h3>
                      <Badge variant={item.has_value ? 'default' : 'secondary'}>
                        {item.has_value ? '已缓存' : '未命中'}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground mb-2 text-xs sm:text-sm">
                      {item.description}
                    </p>

                    <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-[11px] sm:text-xs">
                      <span>标识: {item.id}</span>
                      <span>TTL: {item.ttl_human}</span>
                      <span>Key: {item.cache_key}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1.5"
                      disabled={isClearing}
                      onClick={() => handleClear(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isClearing ? '清理中...' : '清理'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-muted-foreground p-6 text-sm">暂无可管理缓存项</div>
        )}
      </div>
    </div>
  )
}
