'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useWordStats } from '../hooks/useWord'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Calendar, BookOpen, TrendingUp } from 'lucide-react'

export function ProgressStats() {
  const { data: stats, isLoading } = useWordStats()

  if (isLoading) {
    return (
      <Card className="gap-0 py-0">
        <CardContent className="flex items-center justify-center py-5">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* 已打卡天数 */}
          <div className="flex min-w-0 items-center gap-2 sm:justify-center">
            <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Calendar className="text-muted-foreground size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-lg leading-none font-bold sm:text-xl">{stats.check_in_days}</div>
              <p className="text-muted-foreground mt-1 truncate text-[11px]">打卡天数</p>
            </div>
          </div>

          {/* 已学单词 */}
          <div className="flex min-w-0 items-center gap-2 border-x px-2 sm:justify-center sm:px-4">
            <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg">
              <BookOpen className="text-muted-foreground size-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg leading-none font-bold sm:text-xl">
                {stats.learned_words_count}
              </div>
              <p className="text-muted-foreground mt-1 truncate text-[11px]">
                {stats.total_words > 0 ? `/ ${stats.total_words}` : '已学单词'}
              </p>
            </div>
          </div>

          {/* 学习进度 */}
          <div className="flex min-w-0 items-center gap-2 sm:justify-center">
            <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg">
              <TrendingUp className="text-muted-foreground size-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg leading-none font-bold sm:text-xl">
                {stats.progress_percentage.toFixed(0)}%
              </div>
              <p className="text-muted-foreground mt-1 truncate text-[11px]">学习进度</p>
            </div>
          </div>
        </div>

        {/* 进度条 */}
        {stats.total_words > 0 && (
          <div
            role="progressbar"
            aria-label="单词学习进度"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(stats.progress_percentage, 100)}
            className="bg-muted mt-3 h-1 overflow-hidden rounded-full"
          >
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${Math.min(stats.progress_percentage, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
