import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BookMarksPanel } from '../BookMarksPanel'
import type { BookMark } from '@/app/book/utils/bookMarks'

const createPositionMark = (overrides: Partial<BookMark> = {}): BookMark => ({
  id: 'mark-1',
  bookId: 'luxun',
  kind: 'position',
  chapterId: '0-0',
  chapterTitle: '第一回',
  scrollTop: 120,
  pairIndex: 3,
  excerpt: '',
  note: '',
  createdAt: Date.now(),
  ...overrides,
})

const createCollectionMark = (overrides: Partial<BookMark> = {}): BookMark => ({
  id: 'mark-2',
  bookId: 'luxun',
  kind: 'collection',
  chapterId: '0-0',
  chapterTitle: '第一回',
  scrollTop: 120,
  pairIndex: null,
  excerpt: 'selected text',
  note: '',
  createdAt: Date.now(),
  ...overrides,
})

describe('BookMarksPanel', () => {
  it('renders position panel when open', () => {
    render(
      <BookMarksPanel
        kind="position"
        open={true}
        onOpenChange={vi.fn()}
        marks={[]}
        onJump={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    expect(screen.getByText('展示')).toBeInTheDocument()
    expect(screen.queryByText('收藏')).not.toBeInTheDocument()
  })

  it('renders collection panel when open', () => {
    render(
      <BookMarksPanel
        kind="collection"
        open={true}
        onOpenChange={vi.fn()}
        marks={[]}
        onJump={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    expect(screen.getByText('收藏')).toBeInTheDocument()
    expect(screen.queryByText('展示')).not.toBeInTheDocument()
  })

  it('does not render dialog content when closed', () => {
    render(
      <BookMarksPanel
        kind="position"
        open={false}
        onOpenChange={vi.fn()}
        marks={[]}
        onJump={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    expect(screen.queryByText('展示')).not.toBeInTheDocument()
  })

  it('renders position bookmarks only in position panel', () => {
    render(
      <BookMarksPanel
        kind="position"
        open={true}
        onOpenChange={vi.fn()}
        marks={[createPositionMark(), createCollectionMark()]}
        onJump={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getByText('第一回')).toBeInTheDocument()
    expect(screen.queryByText('selected text')).not.toBeInTheDocument()
  })

  it('renders collections only in collection panel', () => {
    render(
      <BookMarksPanel
        kind="collection"
        open={true}
        onOpenChange={vi.fn()}
        marks={[createPositionMark(), createCollectionMark()]}
        onJump={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getByText('selected text')).toBeInTheDocument()
    expect(screen.getAllByText('第一回')).toHaveLength(1)
  })

  it('calls onJump and onOpenChange when bookmark is clicked', () => {
    const onJump = vi.fn()
    const onOpenChange = vi.fn()
    const mark = createPositionMark()

    render(
      <BookMarksPanel
        kind="position"
        open={true}
        onOpenChange={onOpenChange}
        marks={[mark]}
        onJump={onJump}
        onRemove={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('第一回'))
    expect(onJump).toHaveBeenCalledWith(mark)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('calls onAddCurrent from position panel', () => {
    const onAddCurrent = vi.fn()

    render(
      <BookMarksPanel
        kind="position"
        open={true}
        onOpenChange={vi.fn()}
        marks={[]}
        onJump={vi.fn()}
        onRemove={vi.fn()}
        onAddCurrent={onAddCurrent}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '记录当前位置' }))
    expect(onAddCurrent).toHaveBeenCalled()
  })
})
