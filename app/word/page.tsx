'use client'

import { ProgressStats } from './components/ProgressStats'
import { CheckInCalendar } from './components/CheckInCalendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import {
  BookOpen,
  Settings,
  AlertCircle,
  CheckCircle2,
  PenLine,
  Brain,
  Search,
  ScanLine,
  FileInput,
  ChevronRight,
} from 'lucide-react'
import { useWordSettings, useWordStats } from './hooks/useWord'
import { PageContainer } from '@/components/layout'

export default function WordPage() {
  const { data: settings } = useWordSettings()
  const { data: stats } = useWordStats()
  const todayCheckedIn = stats?.today_checked_in ?? false

  return (
    <PageContainer maxWidth="2xl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">背单词</h1>
          {todayCheckedIn ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
              <CheckCircle2 className="h-3 w-3" />
              今日已打卡
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              <AlertCircle className="h-3 w-3" />
              今日未打卡
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/word/search" title="搜索单词">
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/word/import" title="导入文本">
            <Button variant="outline" size="icon">
              <FileInput className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/word/scan" title="摄像头扫描">
            <Button variant="outline" size="icon">
              <ScanLine className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/word/settings" title="设置">
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="text-primary h-4 w-4" />
            <CardTitle className="text-base">单词书</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Link href="/word/books">
            <button
              type="button"
              className="hover:bg-accent/40 flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors"
            >
              <div className="min-w-0">
                <div className="font-medium">{settings?.current_book?.name ?? '选择单词书'}</div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {settings?.current_book
                    ? `当前已选择，${settings.current_book.total_words} 词`
                    : '进入单词书内页查看和切换学习内容'}
                </p>
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
            </button>
          </Link>
        </CardContent>
      </Card>

      {/* 统计数据 */}
      <ProgressStats />

      {/* 学习模式 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 开始学习 / 再学一组 */}
        <Link href={todayCheckedIn ? '/word/learn?continue=1' : '/word/learn'}>
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <BookOpen className="text-primary h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{todayCheckedIn ? '再学一组' : '开始学习'}</h3>
                  <p className="text-muted-foreground text-sm">
                    {todayCheckedIn ? '继续学习新单词 + 复习' : '学习新单词 + 复习旧单词'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 例句填空 */}
        <Link href="/word/fill-blank">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                  <PenLine className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">例句填空</h3>
                  <p className="text-muted-foreground text-sm">根据例句拼写单词</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/word/quiz">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900">
                  <Brain className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">词汇量测验</h3>
                  <p className="text-muted-foreground text-sm">
                    随机选择题，快速检查当前词库掌握度
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 打卡日历 */}
      <CheckInCalendar />
    </PageContainer>
  )
}
