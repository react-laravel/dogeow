'use client'

import { useState } from 'react'
import {
  addDays,
  addMonths,
  format,
  getDaysInMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  useCheckInCalendar,
  useYearCheckInCalendar,
  useLast365CheckInCalendar,
} from '../hooks/useWord'
import { WordPanel } from './WordPanel'
import type { CalendarDay } from '../types'

function MonthGrid({
  date,
  days,
  compact = false,
}: {
  date: Date
  days: CalendarDay[]
  compact?: boolean
}) {
  const first = startOfMonth(date)
  const byDate = new Map(days.map(day => [day.date, day]))
  const today = format(new Date(), 'yyyy-MM-dd')
  return (
    <div className="grid grid-cols-7 gap-1 text-center">
      {['日', '一', '二', '三', '四', '五', '六'].map(day => (
        <span key={day} className="text-muted-foreground py-1 text-xs">
          {day}
        </span>
      ))}
      {Array.from({ length: first.getDay() }, (_, index) => (
        <span key={`empty-${index}`} />
      ))}
      {Array.from({ length: getDaysInMonth(date) }, (_, index) => {
        const key = format(addDays(first, index), 'yyyy-MM-dd')
        const day = byDate.get(key)
        return (
          <span
            key={key}
            title={`${key} · ${day?.checked ? `新词 ${day.new_words_count} · 复习 ${day.review_words_count}` : '未打卡'}`}
            aria-label={`${key}${day?.checked ? ' 已打卡' : ''}`}
            aria-current={key === today ? 'date' : undefined}
            className={`flex flex-col items-center justify-center gap-1 rounded-lg text-xs ${compact ? 'h-7' : 'h-10'} ${day?.checked ? 'bg-primary/10 text-primary font-medium' : ''} ${key === today ? 'ring-primary ring-1 ring-inset' : ''}`}
          >
            {index + 1}
            {!compact && (
              <span
                className={`size-1 rounded-full ${day?.checked ? 'bg-primary' : 'bg-transparent'}`}
              />
            )}
          </span>
        )
      })}
    </div>
  )
}

export function CheckInCalendar() {
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState<'year' | 'last365' | null>(null)
  const year = date.getFullYear()
  const { data: month, isLoading, error, mutate } = useCheckInCalendar(year, date.getMonth() + 1)
  const annual = useYearCheckInCalendar(year)
  const recent = useLast365CheckInCalendar()
  const checked = month?.calendar.filter(day => day.checked).length ?? 0
  const detailLoading = view === 'year' ? annual.isLoading : recent.isLoading
  const detailError = view === 'year' ? annual.error : recent.error
  const recentDays = new Map(recent.data?.calendar.map(day => [day.date, day]) ?? [])
  const lastDate = recent.data ? parseISO(recent.data.end_date) : new Date()
  const firstDate = startOfWeek(
    recent.data ? parseISO(recent.data.start_date) : subDays(lastDate, 364)
  )
  const weekCount = Math.ceil(
    (Math.round((lastDate.getTime() - firstDate.getTime()) / 86400000) + 1) / 7
  )

  return (
    <section className="bg-card overflow-hidden rounded-2xl border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
        <div>
          <h2 className="text-sm font-semibold">学习日历</h2>
          <p className="text-muted-foreground mt-1 text-xs">本月已打卡 {checked} 天</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="上个月"
            onClick={() => setDate(addMonths(date, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm tabular-nums">{format(date, 'yyyy.MM')}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="下个月"
            onClick={() => setDate(addMonths(date, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center p-10">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="space-y-2 py-6 text-center text-sm">
            <p>日历加载失败</p>
            <Button variant="outline" onClick={() => void mutate()}>
              重试
            </Button>
          </div>
        ) : (
          <MonthGrid date={date} days={month?.calendar ?? []} />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2">
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <span className="bg-primary size-1.5 rounded-full" />
          已打卡
        </span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setView('year')}>
            全年记录
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setView('last365')}>
            近 365 天
          </Button>
        </div>
      </div>
      <WordPanel
        open={view !== null}
        onOpenChange={open => !open && setView(null)}
        title="学习记录"
        description="每一次学习，都在这里留下记录。"
        className="sm:max-w-3xl"
      >
        <div className="space-y-5 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="bg-muted flex gap-1 rounded-lg p-1">
              <Button
                size="sm"
                variant={view === 'year' ? 'secondary' : 'ghost'}
                onClick={() => setView('year')}
              >
                全年
              </Button>
              <Button
                size="sm"
                variant={view === 'last365' ? 'secondary' : 'ghost'}
                onClick={() => setView('last365')}
              >
                近 365 天
              </Button>
            </div>
            {view === 'year' && (
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="上一年"
                  onClick={() => setDate(addMonths(date, -12))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm">{year} 年</span>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="下一年"
                  onClick={() => setDate(addMonths(date, 12))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
          {detailLoading ? (
            <div className="flex justify-center p-12">
              <LoadingSpinner />
            </div>
          ) : detailError ? (
            <div className="space-y-3 p-6 text-center">
              <p>学习记录加载失败</p>
              <Button
                variant="outline"
                onClick={() => void (view === 'year' ? annual.mutate() : recent.mutate())}
              >
                重试
              </Button>
            </div>
          ) : view === 'year' ? (
            <div className="grid gap-5 min-[380px]:grid-cols-2 sm:grid-cols-3">
              {Array.from({ length: 12 }, (_, index) => (
                <div key={index} className="min-w-0 space-y-2">
                  <h3 className="text-sm font-medium">{index + 1} 月</h3>
                  <MonthGrid
                    date={new Date(year, index, 1)}
                    days={annual.data?.calendar ?? []}
                    compact
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                {format(firstDate, 'yyyy.MM.dd')} — {format(lastDate, 'yyyy.MM.dd')}
              </p>
              <div
                className="overflow-x-auto rounded-xl border p-3"
                tabIndex={0}
                aria-label="近 365 天学习记录，可横向滚动"
              >
                <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
                  {Array.from({ length: weekCount * 7 }, (_, index) => {
                    const date = addDays(firstDate, index)
                    const key = format(date, 'yyyy-MM-dd')
                    const day = recentDays.get(key)
                    return (
                      <span
                        key={key}
                        title={`${key} · 新词 ${day?.new_words_count ?? 0} · 复习 ${day?.review_words_count ?? 0}`}
                        aria-label={`${key}${day?.checked ? ' 已打卡' : ' 未打卡'}`}
                        className={`size-3 rounded-sm ${date > lastDate ? 'invisible' : day?.checked ? 'bg-primary' : 'bg-muted'}`}
                      />
                    )
                  })}
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                每列为一周，着色方格表示已打卡。左右滑动查看完整记录。
              </p>
            </div>
          )}
        </div>
      </WordPanel>
    </section>
  )
}
