'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/helpers'
import type { BookToolbarTheme } from '@/app/book/utils/theme'
import { getBookOverlayCssVars } from '@/app/book/utils/theme'

export interface ChapterGroup {
  label: string
  chapters: { id: string; title: string }[]
}

interface GroupedChapterPickerProps {
  chapterGroups: ChapterGroup[]
  currentChapterId: string
  selectedTitle?: string
  placeholder?: string
  controlClass?: string
  toolbarTheme?: BookToolbarTheme | null
  onChapterChange: (chapterId: string) => void
}

function findVolumeLabel(groups: ChapterGroup[], chapterId: string): string | null {
  for (const group of groups) {
    if (group.chapters.some(ch => ch.id === chapterId)) {
      return group.label
    }
  }
  return null
}

export function GroupedChapterPicker({
  chapterGroups,
  currentChapterId,
  selectedTitle,
  placeholder = '选择篇目',
  controlClass,
  toolbarTheme,
  onChapterChange,
}: GroupedChapterPickerProps) {
  const [open, setOpen] = useState(false)
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(() => {
    const label = findVolumeLabel(chapterGroups, currentChapterId)
    return label ? new Set([label]) : new Set()
  })

  const currentVolumeLabel = useMemo(
    () => findVolumeLabel(chapterGroups, currentChapterId),
    [chapterGroups, currentChapterId]
  )

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && currentVolumeLabel) {
      setExpandedVolumes(prev => {
        if (prev.has(currentVolumeLabel)) return prev
        const next = new Set(prev)
        next.add(currentVolumeLabel)
        return next
      })
    }
    setOpen(nextOpen)
  }

  const allVolumeLabels = useMemo(() => chapterGroups.map(group => group.label), [chapterGroups])

  const expandAll = () => setExpandedVolumes(new Set(allVolumeLabels))

  const collapseAll = () => setExpandedVolumes(new Set())

  const toggleVolume = (label: string) => {
    setExpandedVolumes(prev => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  const handleSelectChapter = (chapterId: string) => {
    onChapterChange(chapterId)
    setOpen(false)
  }

  const allExpanded =
    allVolumeLabels.length > 0 && allVolumeLabels.every(label => expandedVolumes.has(label))

  const toggleAllVolumes = () => {
    if (allExpanded) {
      collapseAll()
    } else {
      expandAll()
    }
  }

  const themed = Boolean(toolbarTheme)
  const itemHoverClass = themed ? 'hover:bg-[var(--book-hover)]' : 'hover:bg-accent'
  const selectedClass = themed ? 'bg-[var(--book-accent)] font-medium' : 'bg-accent font-medium'
  const volumeCollapsedClass = themed ? 'bg-[var(--book-hover)]' : 'bg-accent/40'
  const mutedClass = themed ? 'text-[color:var(--book-muted)]' : 'text-muted-foreground'
  const borderClass = themed ? 'border-[color:var(--book-muted)]/25' : 'border-border/60'

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={placeholder}
          aria-expanded={open}
          className={cn(
            'min-w-0 flex-1 basis-[min(100%,14rem)] justify-between font-normal',
            controlClass
          )}
        >
          <span className="truncate">{selectedTitle ?? placeholder}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={8}
        align="center"
        className={cn(
          'flex max-h-[min(80dvh,36rem)] w-[min(calc(100vw-1.5rem),28rem)] flex-col gap-0 overflow-hidden p-0',
          themed && 'border bg-transparent shadow-lg backdrop-blur-none'
        )}
        style={toolbarTheme ? getBookOverlayCssVars(toolbarTheme) : undefined}
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2',
            borderClass
          )}
        >
          <span className={cn('shrink-0 text-sm whitespace-nowrap', mutedClass)}>按卷浏览</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 shrink-0', themed && 'hover:bg-[var(--book-hover)]')}
            onClick={toggleAllVolumes}
            aria-label={allExpanded ? '全部收起' : '全部展开'}
          >
            {allExpanded ? (
              <ChevronsDownUp className="size-4" />
            ) : (
              <ChevronsUpDown className="size-4" />
            )}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {chapterGroups.map(group => {
            const expanded = expandedVolumes.has(group.label)
            const containsCurrent = group.chapters.some(ch => ch.id === currentChapterId)

            return (
              <div key={group.label} className="mb-0.5 last:mb-0">
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2.5 py-2.5 text-left text-sm font-medium',
                    itemHoverClass,
                    containsCurrent && !expanded && volumeCollapsedClass
                  )}
                  onClick={() => toggleVolume(group.label)}
                  aria-expanded={expanded}
                >
                  {expanded ? (
                    <ChevronDown className="size-4 shrink-0 opacity-60" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 opacity-60" />
                  )}
                  <span className="flex-1 truncate">{group.label}</span>
                  <span className={cn('text-xs tabular-nums', mutedClass)} aria-hidden>
                    {group.chapters.length}
                  </span>
                </button>

                {expanded ? (
                  <ul className="pb-1 pl-7">
                    {group.chapters.map(ch => {
                      const selected = ch.id === currentChapterId
                      return (
                        <li key={ch.id}>
                          <button
                            type="button"
                            className={cn(
                              'flex w-full rounded-md px-2.5 py-2 text-left text-sm',
                              itemHoverClass,
                              selected && selectedClass
                            )}
                            onClick={() => handleSelectChapter(ch.id)}
                            aria-current={selected ? 'true' : undefined}
                          >
                            {ch.title}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
