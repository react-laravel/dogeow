'use client'

import './note-styles.css'
import { useState, useEffect, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { get } from '@/lib/api'
import { logger } from '@/lib/logger'
import { List, Network, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { NoteSectionHeader } from './components/NoteSectionHeader'
import { NoteSearchField } from './components/NoteSearchField'
import { getNotePreviewText } from './utils/noteUtils'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout'
import GraphView from './components/GraphView'
import { normalizeNotes } from './utils/api'
import { getWikiGraph } from '@/lib/api/wiki'
import type { Note } from './types/note'
import NoteLoadingSkeleton from './components/NoteLoadingSkeleton'
import NoteEmptyState from './components/NoteEmptyState'
import NoteCard from './components/NoteCard'
import NotePageGraphToolbar from './components/NotePageGraphToolbar'

type ViewMode = 'list' | 'graph'

const NOTE_VIEW_MODE_KEY = 'dogeow-note-view-mode'

function readStoredViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'list'
  try {
    const stored = sessionStorage.getItem(NOTE_VIEW_MODE_KEY)
    return stored === 'graph' || stored === 'list' ? stored : 'list'
  } catch {
    return 'list'
  }
}

async function fetchNotesList(): Promise<Note[]> {
  const data = await get<Note[] | { notes: Note[] }>('/notes', { handleError: false })
  return normalizeNotes<Note>(data)
}

function ViewModeSwitch({
  viewMode,
  onChangeMode,
  listCount,
  graphCount,
}: {
  viewMode: ViewMode
  onChangeMode: (mode: ViewMode) => void
  listCount: number
  graphCount: number
}) {
  return (
    <div
      className="border-border bg-muted/40 grid min-w-0 grid-cols-2 gap-1 rounded-xl border p-1"
      role="tablist"
      aria-label="视图切换"
      onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next =
          event.key === 'Home'
            ? 'list'
            : event.key === 'End'
              ? 'graph'
              : viewMode === 'list'
                ? 'graph'
                : 'list'
        onChangeMode(next)
        event.currentTarget.querySelector<HTMLButtonElement>(`[data-view="${next}"]`)?.focus()
      }}
    >
      <button
        type="button"
        role="tab"
        data-view="list"
        aria-controls="note-list-panel"
        tabIndex={viewMode === 'list' ? 0 : -1}
        aria-selected={viewMode === 'list'}
        onClick={() => onChangeMode('list')}
        className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm whitespace-nowrap transition-colors ${
          viewMode === 'list'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <List className="hidden size-4 shrink-0 min-[380px]:block" />
        <span>
          列表{' '}
          <span className="text-xs tabular-nums opacity-75">
            {listCount > 999 ? '999+' : listCount}
          </span>
        </span>
      </button>
      <button
        type="button"
        role="tab"
        data-view="graph"
        aria-controls="note-graph-panel"
        tabIndex={viewMode === 'graph' ? 0 : -1}
        aria-selected={viewMode === 'graph'}
        onClick={() => onChangeMode('graph')}
        className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm whitespace-nowrap transition-colors ${
          viewMode === 'graph'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Network className="hidden size-4 shrink-0 min-[380px]:block" />
        <span>
          图谱{' '}
          <span className="text-xs tabular-nums opacity-75">
            {graphCount > 999 ? '999+' : graphCount}
          </span>
        </span>
      </button>
    </div>
  )
}

export default function NotePage() {
  const pathname = usePathname()
  const [viewMode, setViewMode] = useState<ViewMode>(() => readStoredViewMode())
  const [graphQuery, setGraphQuery] = useState<string>('')
  const [listQuery, setListQuery] = useState('')
  const graphNewNodeRef = useRef<(() => void) | null>(null)
  const graphCreateLinkRef = useRef<(() => void) | null>(null)

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    try {
      sessionStorage.setItem(NOTE_VIEW_MODE_KEY, mode)
    } catch {
      // ignore storage failures
    }
  }

  const notesKey = pathname === '/note' ? '/notes' : null
  const {
    data: notes = [],
    isLoading: loading,
    error: notesError,
  } = useSWR<Note[]>(notesKey, fetchNotesList, {
    revalidateOnFocus: false,
  })

  useEffect(() => {
    if (notesError) {
      logger.error('获取笔记列表失败:', notesError)
      toast.error('无法加载笔记列表')
    }
  }, [notesError])

  const { data: graphNodeCount = 0, mutate: mutateGraphCount } = useSWR(
    'notes/graph-node-count',
    async () => {
      const graphData = await getWikiGraph()
      return graphData.nodes.length
    },
    { revalidateOnFocus: false }
  )

  useEffect(() => {
    if (viewMode === 'graph') {
      void mutateGraphCount()
    }
  }, [viewMode, mutateGraphCount])

  const sortedNotes = useMemo(() => {
    if (!Array.isArray(notes)) {
      return []
    }
    return [...notes].sort((a, b) => {
      const timeA = new Date(a.updated_at).getTime()
      const timeB = new Date(b.updated_at).getTime()
      return timeB - timeA
    })
  }, [notes])

  const noteCount = sortedNotes.length

  const visibleNotes = sortedNotes.filter(note =>
    `${note.title} ${getNotePreviewText(note)}`
      .toLocaleLowerCase()
      .includes(listQuery.trim().toLocaleLowerCase())
  )
  const graph = viewMode === 'graph'

  return (
    <PageContainer
      className={
        graph ? 'flex h-full min-h-0 min-w-0 flex-col py-3 sm:py-5' : 'min-w-0 py-3 sm:py-5'
      }
    >
      <NoteSectionHeader
        className="sticky top-0 z-20 bg-background pb-1"
        title="我的笔记"
        action={
          <ViewModeSwitch
            viewMode={viewMode}
            onChangeMode={handleViewModeChange}
            listCount={noteCount}
            graphCount={graphNodeCount}
          />
        }
      >
        <div
          className={
            graph
              ? 'flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center'
              : 'flex min-w-0 items-center gap-3'
          }
        >
          <NoteSearchField
            value={graph ? graphQuery : listQuery}
            onChange={graph ? setGraphQuery : setListQuery}
            label={graph ? '搜索图谱节点' : '搜索笔记'}
            placeholder={graph ? '搜索节点、标签或摘要' : '搜索笔记标题或摘要'}
          />
          {graph ? (
            <NotePageGraphToolbar
              onNewNode={() => graphNewNodeRef.current?.()}
              onCreateLink={() => graphCreateLinkRef.current?.()}
            />
          ) : (
            <Button asChild className="h-11 rounded-xl shadow-none sm:w-auto">
              <Link href="/note/new">
                <Plus className="size-4" />
                新建笔记
              </Link>
            </Button>
          )}
        </div>
      </NoteSectionHeader>
      {graph ? (
        <section
          id="note-graph-panel"
          role="tabpanel"
          aria-label="图谱视图"
          className="min-h-0 flex-1"
        >
          <GraphView
            query={graphQuery}
            onNewNodeRef={graphNewNodeRef}
            onCreateLinkRef={graphCreateLinkRef}
          />
        </section>
      ) : (
        <section id="note-list-panel" role="tabpanel" aria-label="列表视图">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {listQuery ? `找到 ${visibleNotes.length} 篇笔记` : `共 ${noteCount} 篇笔记`}
            </span>
            <span>最近更新</span>
          </div>
          {loading ? (
            <NoteLoadingSkeleton />
          ) : noteCount === 0 ? (
            <NoteEmptyState />
          ) : visibleNotes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
              <p className="text-sm font-medium">没有找到相关笔记</p>
              <p className="mt-2 text-xs text-muted-foreground">试试其他关键词，或查看全部笔记。</p>
              <Button variant="ghost" className="mt-3" onClick={() => setListQuery('')}>
                清空搜索
              </Button>
            </div>
          ) : (
            <div
              className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
              role="list"
              aria-label="笔记列表"
            >
              {visibleNotes.map(note => (
                <div key={note.id} role="listitem" className="min-w-0">
                  <NoteCard note={note} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </PageContainer>
  )
}
