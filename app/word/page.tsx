'use client'

import Link from 'next/link'
import { Brain, ChevronRight, FileInput, PenLine, RotateCcw, ScanLine, Search } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { ProgressStats } from './components/ProgressStats'
import { CheckInCalendar } from './components/CheckInCalendar'
import { LearningHero } from './components/LearningHero'
import { WordPageHeader } from './components/WordPageHeader'
import { useWordSettings, useWordStats } from './hooks/useWord'

const practice = [
  { href: '/word/review', title: '复习巩固', description: '回顾到期单词', icon: RotateCcw },
  { href: '/word/fill-blank', title: '例句填空', description: '在语境中练拼写', icon: PenLine },
  { href: '/word/quiz', title: '词汇量测验', description: '了解词汇掌握情况', icon: Brain },
]
const tools = [
  { href: '/word/search', title: '查单词', icon: Search },
  { href: '/word/import', title: '导入文本', icon: FileInput },
  { href: '/word/scan', title: '拍照识词', icon: ScanLine },
]

export default function WordPage() {
  const { data: settings } = useWordSettings()
  const { data: stats } = useWordStats()
  return (
    <PageContainer maxWidth="5xl" className="space-y-6">
      <WordPageHeader title="背单词" description="每天学一点，让积累看得见。" />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <LearningHero
            todayCheckedIn={stats?.today_checked_in ?? false}
            currentBook={settings?.current_book}
          />
          <ProgressStats />
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">巩固与练习</h2>
            <div className="bg-card divide-y overflow-hidden rounded-2xl border">
              {practice.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:bg-accent/60 focus-visible:ring-ring flex items-center gap-3 px-4 py-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <item.icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{item.title}</span>
                    <span className="text-muted-foreground mt-0.5 block text-xs">
                      {item.description}
                    </span>
                  </span>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        </div>
        <div className="min-w-0 space-y-5">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">词汇工具</h2>
            <div className="grid grid-cols-3 gap-2">
              {tools.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="bg-card hover:bg-accent/60 focus-visible:ring-ring flex min-w-0 flex-col items-center gap-2 rounded-xl border px-2 py-4 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <item.icon className="text-primary size-5" />
                  {item.title}
                </Link>
              ))}
            </div>
          </section>
          <CheckInCalendar />
        </div>
      </div>
    </PageContainer>
  )
}
