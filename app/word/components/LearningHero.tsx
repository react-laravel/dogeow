import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Book } from '../types'

interface LearningHeroProps {
  todayCheckedIn: boolean
  currentBook?: Book
}

export function LearningHero({ todayCheckedIn, currentBook }: LearningHeroProps) {
  const learningHref = todayCheckedIn ? '/word/learn?continue=1' : '/word/learn'

  return (
    <section className="bg-card relative overflow-hidden rounded-2xl border p-4 shadow-none sm:p-5">
      <BookOpen
        className="text-primary pointer-events-none absolute -top-5 -right-4 size-36 rotate-[-8deg] opacity-[0.06]"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <span className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
            {todayCheckedIn ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {todayCheckedIn ? '今日已完成一组' : '今日学习计划'}
          </span>
        </div>

        <div className="max-w-md">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {todayCheckedIn ? '保持手感，再学一组' : '开始今天的学习'}
          </h2>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {todayCheckedIn
              ? '继续学习新单词，同时巩固需要复习的内容。'
              : '新词与复习穿插进行，完成后自动记录今日打卡。'}
          </p>
        </div>

        <Button asChild size="lg" className="mt-4 w-full shadow-sm sm:w-auto">
          <Link href={learningHref}>
            {todayCheckedIn ? '继续学习' : '开始学习'}
            <ArrowRight className="size-4" />
          </Link>
        </Button>

        <Link
          href="/word/books"
          className="bg-muted/40 hover:bg-muted/70 focus-visible:ring-ring mt-4 flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <BookOpen className="size-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {currentBook?.name ?? '选择学习单词书'}
            </span>
            <span className="text-muted-foreground block truncate text-xs">
              {currentBook
                ? `共 ${currentBook.total_words} 词 · 点击切换`
                : '选择后即可制定学习计划'}
            </span>
          </span>
          <ChevronRight className="text-muted-foreground size-4 shrink-0" />
        </Link>
      </div>
    </section>
  )
}
