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
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 p-4 text-white shadow-lg shadow-orange-950/10 sm:p-5">
      <BookOpen
        className="pointer-events-none absolute -top-5 -right-4 size-36 rotate-[-8deg] opacity-10"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
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
          <p className="mt-1.5 text-sm text-white/85">
            {todayCheckedIn
              ? '继续学习新单词，同时巩固需要复习的内容。'
              : '新词与复习穿插进行，完成后自动记录今日打卡。'}
          </p>
        </div>

        <Button
          asChild
          size="lg"
          variant="secondary"
          className="mt-4 w-full bg-white text-orange-700 shadow-sm hover:bg-orange-50 sm:w-auto"
        >
          <Link href={learningHref}>
            {todayCheckedIn ? '继续学习' : '开始学习'}
            <ArrowRight className="size-4" />
          </Link>
        </Button>

        <Link
          href="/word/books"
          className="mt-4 flex items-center gap-3 rounded-xl border border-white/20 bg-black/10 px-3 py-2.5 transition-colors hover:bg-black/15 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <BookOpen className="size-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {currentBook?.name ?? '选择学习单词书'}
            </span>
            <span className="block truncate text-xs text-white/75">
              {currentBook
                ? `共 ${currentBook.total_words} 词 · 点击切换`
                : '选择后即可制定学习计划'}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-white/70" />
        </Link>
      </div>
    </section>
  )
}
