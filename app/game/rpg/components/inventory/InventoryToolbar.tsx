'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CopperDisplay } from '../shared/CopperDisplay'
import { ItemQuality, QUALITY_COLORS, QUALITY_NAMES } from '../../types'
import { INVENTORY_CATEGORIES, RECYCLE_QUALITIES } from './inventoryConfig'

interface QualityStat {
  count: number
  totalPrice: number
}

const AUTO_RECYCLE_INCREMENTS = [10, 50, 100] as const
const AUTO_RECYCLE_MAX = 99999
const AUTO_RECYCLE_BTN_CLASS =
  'bg-muted text-muted-foreground hover:bg-muted/80 rounded px-1 py-1.5 text-xs transition-colors disabled:opacity-50'

const TOOLBAR_ACTION_BTN_CLASS =
  'flex shrink-0 items-center justify-center whitespace-nowrap rounded px-3 py-1.5 text-sm transition-colors'

interface InventoryToolbarProps {
  autoRecycleMaxValue: number | null
  categoryId: string
  inventoryCount: number
  inventorySize: number
  isLoading: boolean
  isSavingAutoRecycle: boolean
  onAutoRecycleMaxValueChange: (maxValue: number | null) => void
  onCategoryChange: (categoryId: string) => void
  onRecycleQuality: (quality: string) => void
  onShowStorageChange: (showStorage: boolean) => void
  onSort: (sortType: 'default' | 'quality' | 'price', inStorage: boolean) => void
  qualityStats: Record<string, QualityStat>
  recyclingQuality: string | null
  showStorage: boolean
  storageCount: number
  storageSize: number
}

export function InventoryToolbar({
  autoRecycleMaxValue,
  categoryId,
  inventoryCount,
  inventorySize,
  isLoading,
  isSavingAutoRecycle,
  onAutoRecycleMaxValueChange,
  onCategoryChange,
  onRecycleQuality,
  onShowStorageChange,
  onSort,
  qualityStats,
  recyclingQuality,
  showStorage,
  storageCount,
  storageSize,
}: InventoryToolbarProps) {
  const [sortBy, setSortBy] = useState<'default' | 'quality' | 'price'>('default')
  const recycleAllStats = Object.values(qualityStats).reduce(
    (total, stats) => ({
      count: total.count + stats.count,
      totalPrice: total.totalPrice + stats.totalPrice,
    }),
    { count: 0, totalPrice: 0 }
  )
  const isRecycling = recyclingQuality != null

  const handleAdjustAutoRecycleValue = (delta: number) => {
    const current = autoRecycleMaxValue ?? 0
    const next = current + delta
    if (next <= 0) {
      onAutoRecycleMaxValueChange(null)
      return
    }
    onAutoRecycleMaxValueChange(Math.min(AUTO_RECYCLE_MAX, next))
  }

  const handleSort = (sortType: 'default' | 'quality' | 'price') => {
    setSortBy(sortType)
    onSort(sortType, showStorage)
  }

  const sortOptions = [
    { value: 'default' as const, label: '时间' },
    { value: 'quality' as const, label: '品质' },
    { value: 'price' as const, label: '价格' },
  ]

  return (
    <div className="mb-3 flex shrink-0 flex-col gap-2 sm:mb-4 sm:gap-3">
      <div className="flex w-full min-w-0 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => onShowStorageChange(false)}
          className={`flex min-w-0 flex-1 items-center justify-center truncate rounded px-2.5 py-2 text-xs whitespace-nowrap sm:px-3 sm:text-sm ${
            !showStorage ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          背包 {inventoryCount}/{inventorySize}
        </button>
        <button
          type="button"
          onClick={() => onShowStorageChange(true)}
          className={`flex min-w-0 flex-1 items-center justify-center truncate rounded px-2.5 py-2 text-xs whitespace-nowrap sm:px-3 sm:text-sm ${
            showStorage ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          仓库 {storageCount}/{storageSize}
        </button>
      </div>

      <div className="flex w-full min-w-0 items-stretch gap-2 sm:gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`${TOOLBAR_ACTION_BTN_CLASS} ${
                categoryId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              title="筛选"
            >
              <span>筛选</span>
              {categoryId && (
                <span className="ml-1 text-xs">
                  {INVENTORY_CATEGORIES.find(category => category.id === categoryId)?.emoji}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-2" align="end">
            <button
              type="button"
              onClick={() => onCategoryChange('')}
              className={`hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-left text-sm ${
                !categoryId ? 'bg-muted font-medium' : ''
              }`}
            >
              全部
            </button>
            {INVENTORY_CATEGORIES.map(category => (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={`hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-left text-sm ${
                  categoryId === category.id ? 'bg-muted font-medium' : ''
                }`}
              >
                <span className="mr-2">{category.emoji}</span>
                {category.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {!showStorage ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`${TOOLBAR_ACTION_BTN_CLASS} bg-muted text-muted-foreground hover:bg-muted/80`}
                title="回收"
              >
                <span>回收</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 space-y-1 p-2" align="end">
              <button
                type="button"
                onClick={() => onRecycleQuality('all')}
                disabled={isLoading || isRecycling || recycleAllStats.count === 0}
                className="bg-destructive/15 text-destructive hover:bg-destructive/20 flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>
                  全部回收
                  <span className="ml-1 text-xs opacity-70">×{recycleAllStats.count}</span>
                </span>
                <span className="flex items-center gap-1">
                  <CopperDisplay copper={recycleAllStats.totalPrice} size="xs" />
                  {recyclingQuality === 'all' && <span className="animate-spin">⏳</span>}
                </span>
              </button>
              {RECYCLE_QUALITIES.map(quality => {
                const stats = qualityStats[quality] || { count: 0, totalPrice: 0 }
                const isDisabled = stats.count === 0

                return (
                  <button
                    key={quality}
                    type="button"
                    onClick={() => onRecycleQuality(quality)}
                    disabled={isLoading || isRecycling || isDisabled}
                    className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: `${QUALITY_COLORS[quality as ItemQuality]}${isDisabled ? '10' : '20'}`,
                      color: isDisabled
                        ? `${QUALITY_COLORS[quality as ItemQuality]}60`
                        : QUALITY_COLORS[quality as ItemQuality],
                    }}
                  >
                    <span>
                      {QUALITY_NAMES[quality as ItemQuality]}
                      <span className="ml-1 text-xs opacity-70">×{stats.count}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CopperDisplay copper={stats.totalPrice} size="xs" />
                      {recyclingQuality === quality && <span className="animate-spin">⏳</span>}
                    </span>
                  </button>
                )
              })}
              <div className="border-border mt-2 border-t pt-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">自动回收（单价≤）</span>
                  <span className="flex items-center gap-1">
                    {autoRecycleMaxValue && autoRecycleMaxValue > 0 ? (
                      <CopperDisplay copper={autoRecycleMaxValue} size="xs" />
                    ) : (
                      <span className="text-muted-foreground text-xs">关闭</span>
                    )}
                    {isSavingAutoRecycle && <span className="animate-spin text-xs">⏳</span>}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {AUTO_RECYCLE_INCREMENTS.map(amount => (
                    <button
                      key={`dec-${amount}`}
                      type="button"
                      onClick={() => handleAdjustAutoRecycleValue(-amount)}
                      disabled={
                        isLoading ||
                        isSavingAutoRecycle ||
                        !autoRecycleMaxValue ||
                        autoRecycleMaxValue <= 0
                      }
                      className={AUTO_RECYCLE_BTN_CLASS}
                    >
                      -{amount}
                    </button>
                  ))}
                </div>
                <div className="mt-1 grid grid-cols-3 gap-1">
                  {AUTO_RECYCLE_INCREMENTS.map(amount => (
                    <button
                      key={`inc-${amount}`}
                      type="button"
                      onClick={() => handleAdjustAutoRecycleValue(amount)}
                      disabled={isLoading || isSavingAutoRecycle}
                      className={AUTO_RECYCLE_BTN_CLASS}
                    >
                      +{amount}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onAutoRecycleMaxValueChange(null)}
                  disabled={
                    isLoading ||
                    isSavingAutoRecycle ||
                    !autoRecycleMaxValue ||
                    autoRecycleMaxValue <= 0
                  }
                  className={`${AUTO_RECYCLE_BTN_CLASS} mt-1.5 w-full`}
                >
                  关闭
                </button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <div className={`${TOOLBAR_ACTION_BTN_CLASS} invisible pointer-events-none`} aria-hidden>
            回收
          </div>
        )}

        <div
          className="bg-muted flex min-w-0 flex-1 basis-0 overflow-hidden rounded"
          role="group"
          aria-label="排序"
        >
          {sortOptions.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSort(option.value)}
              disabled={isLoading}
              className={`flex min-w-0 flex-1 basis-0 items-center justify-center px-1 py-1.5 text-xs whitespace-nowrap transition-colors disabled:opacity-50 sm:px-2 sm:text-sm ${
                sortBy === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/80'
              } ${index > 0 ? 'border-border/60 border-l' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
