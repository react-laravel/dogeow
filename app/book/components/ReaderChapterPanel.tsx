'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronRight, Search, LocateFixed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/helpers'
import { ReaderPanel } from './ReaderPanel'
import type { BookTheme } from '@/app/book/types/reader'

export interface ReaderChapter {
  id: string
  title: string
}
export interface ReaderChapterGroup {
  label: string
  chapters: ReaderChapter[]
}
interface ReaderChapterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  theme: BookTheme
  chapters: ReaderChapter[]
  chapterGroups?: ReaderChapterGroup[]
  currentChapterId: string
  onChapterChange: (id: string) => void
}

export function ReaderChapterPanel({
  open,
  onOpenChange,
  theme,
  chapters,
  chapterGroups,
  currentChapterId,
  onChapterChange,
}: ReaderChapterPanelProps) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const currentRef = useRef<HTMLButtonElement>(null)
  const changeOpen = (nextOpen: boolean) => {
    if (!nextOpen) {
      setQuery('')
      setExpanded({})
    }
    onOpenChange(nextOpen)
  }
  const groups = chapterGroups?.length ? chapterGroups : [{ label: '', chapters }]
  const allChapters = groups.flatMap(group => group.chapters)
  const selectedIndex = allChapters.findIndex(chapter => chapter.id === currentChapterId)
  const needle = query.trim().toLocaleLowerCase()
  const filtered = groups
    .map(group => ({
      ...group,
      chapters: group.chapters.filter(chapter =>
        `${group.label} ${chapter.title} ${chapter.id}`.toLocaleLowerCase().includes(needle)
      ),
    }))
    .filter(group => group.chapters.length)
  const locateCurrent = () => {
    setQuery('')
    const group = groups.find(group =>
      group.chapters.some(chapter => chapter.id === currentChapterId)
    )
    if (group?.label) setExpanded(prev => ({ ...prev, [group.label]: true }))
    requestAnimationFrame(() =>
      currentRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    )
  }
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() =>
      currentRef.current?.scrollIntoView({ block: 'center' })
    )
    return () => cancelAnimationFrame(frame)
  }, [open, currentChapterId])

  return (
    <ReaderPanel
      open={open}
      onOpenChange={changeOpen}
      title="目录"
      description={`${allChapters.length} 章${selectedIndex >= 0 ? ` · 当前第 ${selectedIndex + 1} 章` : ''}`}
      theme={theme}
      bodyClassName="flex flex-col gap-4 overflow-hidden p-0"
    >
      <div className="space-y-3 px-5 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
          <Input
            aria-label="搜索章节"
            placeholder="搜索章节名称或序号"
            value={query}
            onChange={event => setQuery(event.target.value)}
            className="h-11 rounded-xl bg-muted/40 pl-9 shadow-none"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 px-1 text-xs text-muted-foreground"
          onClick={locateCurrent}
        >
          <LocateFixed className="size-3.5" />
          定位当前章节
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-5">
        {!filtered.length && (
          <p className="px-2 py-12 text-center text-sm text-muted-foreground">没有找到相关章节</p>
        )}
        {filtered.map(group => {
          const containsCurrent = group.chapters.some(chapter => chapter.id === currentChapterId)
          const isExpanded =
            !group.label || Boolean(needle) || (expanded[group.label] ?? containsCurrent)
          return (
            <section key={group.label} className="mb-2">
              {group.label && (
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center gap-2 rounded-xl bg-muted/50 px-3 text-left text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-expanded={isExpanded}
                  onClick={() => setExpanded(prev => ({ ...prev, [group.label]: !isExpanded }))}
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{group.label}</span>
                  <span className="text-xs text-muted-foreground">{group.chapters.length} 篇</span>
                </button>
              )}
              {isExpanded && (
                <ul className={cn('space-y-1', group.label && 'mt-1')}>
                  {group.chapters.map(chapter => {
                    const selected = chapter.id === currentChapterId
                    return (
                      <li key={chapter.id}>
                        <button
                          type="button"
                          ref={selected ? currentRef : undefined}
                          aria-current={selected ? 'location' : undefined}
                          onClick={() => {
                            onChapterChange(chapter.id)
                            changeOpen(false)
                          }}
                          className={cn(
                            'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm leading-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            selected ? 'bg-primary/10 font-medium text-primary' : 'hover:bg-accent'
                          )}
                        >
                          <span className="min-w-0 flex-1 break-words">{chapter.title}</span>
                          {selected && <Check className="size-4 shrink-0" />}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </ReaderPanel>
  )
}
