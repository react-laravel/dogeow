'use client'

import { ProgressStats } from './components/ProgressStats'
import { CheckInCalendar } from './components/CheckInCalendar'
import { LearningHero } from './components/LearningHero'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Settings, PenLine, Brain, Search, ScanLine, FileInput } from 'lucide-react'
import { useWordSettings, useWordStats } from './hooks/useWord'
import { PageContainer } from '@/components/layout'

export default function WordPage() {
  const { data: settings } = useWordSettings()
  const { data: stats } = useWordStats()
  const todayCheckedIn = stats?.today_checked_in ?? false

  return (
    <PageContainer maxWidth="2xl" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">背单词</h1>
          <p className="text-muted-foreground mt-0.5 text-xs">每天一小组，稳步积累词汇</p>
        </div>
        <div className="bg-card flex shrink-0 gap-0.5 rounded-xl border p-1 shadow-xs">
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link href="/word/search" aria-label="搜索单词">
              <Search className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link href="/word/import" aria-label="导入文本">
              <FileInput className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link href="/word/scan" aria-label="摄像头扫描">
              <ScanLine className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link href="/word/settings" aria-label="单词设置">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <LearningHero todayCheckedIn={todayCheckedIn} currentBook={settings?.current_book} />

      {/* 统计数据 */}
      <ProgressStats />

      {/* 学习模式 */}
      <section className="space-y-2.5">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold">专项练习</h2>
            <p className="text-muted-foreground text-xs">换一种方式巩固已学内容</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/word/fill-blank" className="group">
            <Card className="h-full gap-0 py-0 shadow-none transition-colors group-hover:bg-blue-50/60 dark:group-hover:bg-blue-950/20">
              <CardContent className="flex items-center gap-3 p-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900">
                  <PenLine className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">例句填空</h3>
                  <p className="text-muted-foreground truncate text-xs">根据例句拼写单词</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/word/quiz" className="group">
            <Card className="h-full gap-0 py-0 shadow-none transition-colors group-hover:bg-emerald-50/60 dark:group-hover:bg-emerald-950/20">
              <CardContent className="flex items-center gap-3 p-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900">
                  <Brain className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">词汇量测验</h3>
                  <p className="text-muted-foreground truncate text-xs">快速检查当前词库掌握度</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* 打卡日历 */}
      <CheckInCalendar />
    </PageContainer>
  )
}
