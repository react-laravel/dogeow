import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BookMarksPanel } from '../BookMarksPanel'
import type { BookMark } from '../types/marks'

const createPositionMark = (overrides: Partial<BookMark> = {}): BookMark => ({
  id: 'mark-1',
  kind: 'position',
  chapterId: 1,
  chapterTitle: '第一回',
  scrollTop: 120,
  pairIndex: 3,
  ...overrides,
})

const createCollectionMark = (overrides: Partial<BookMark> = {}): BookMark => ({
  id: 'mark-2',
  kind: 'collection',
  chapterId: 1,
  chapterTitle: '第一回',
  excerpt: 'selected text',
  ...overrides,
})

describe('BookMarksPanel', () => {
  it('renders when open', () => {
    render(
      <BookMarksPanel
        open={true}
        onOpenChange={vi.fn()}
        marks={[]}
        onJump={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    expect(screen.getByText('书签与收藏')).toBeInTheDocument()
  })

  it('does not render dialog content when closed', () => {
    render(
      <BookMarksPanel
        open={false}
        onOpenChange={vi.fn()}
        marks={[]}
        onJump={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    expect(screen.queryByText('书签与收藏')).not.toBeInTheDocument()
  })

  it('renders bookmarks section with empty state', () => {
    render(
      <BookMarksPanel
        open={true}
        onOpenChange={vi.fn()}
        marks={[]}
        onJump={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    expect(screen.getByText('书签')).toBeInTheDocument()
    expect(
      screen.getByText('还没有书签，可在工具栏添加当前位置，或选中文字后添加。')
    ).toBeInTheDocument()
  })

  it('renders collections section with empty state', () => {
    render(
      <BookMarksPanel
        open={true}
        onOpenChange={vi.fn()}
        marks={[]}
        onJump={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    expect(screen.getByText('收藏')).toBeInTheDocument()
    expect(screen.getByText('选中文字后，点「收藏」即可保存片段。')).toBeInTheDocument()
  })

  it('renders position bookmarks', () => {
    const marks = [createPositionMark()]
    render(
      <BookMarksPanel
        open={true}
        onOpenChange={vi.fn()}
        marks={marks}
        onJump={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    expect(screen.getByText('第一回')).toBeInTheDocument()
    expect(screen.getByText('第 4 句')).toBeInTheDocument()
  })

  it('renders collection marks with excerpt', () => {
    const marks = [createCollectionMark()]
    render(
      <BookMarksPanel
        open={true}
        onOpenChange={vi.fn()}
        marks={marks}
        onJump={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    expect(screen.getByText('selected text')).toBeInTheDocument()
  })

  it('renders collection marks with pair index', () => {
    const marks = [createCollectionMark({ excerpt: undefined, pairIndex: 5 })]
    render(
      <BookMarksPanel
        open={true}
        onOpenChange={vi.fn()}
        marks={marks}
        onJump={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    expect(screen.getByText('第 6 句')).toBeInTheDocument()
  })

  it('calls onJump and onOpenChange when bookmark is clicked', () => {
    const onJump = vi.fn()
    const onOpenChange = vi.fn()
    const marks = [createPositionMark()]
    render(
      <BookMarksPanel
        open={true}
        onOpenChange={onOpenChange}
        marks={marks}
        onJump={onJump}
        onRemove={vi.fn()}
      />
    )

    const markItem = screen.getByText('第一回').closest('[role="button"]')
    if (markItem) {
      fireEvent.click(markItem)
      expect(onJump).toHaveBeenCalledWith(marks[0])
      expect(onOpenChange).toHaveBeenCalledWith(false)
    }
  })

  it('calls onRemove when delete button is clicked', () => {
    const onRemove = vi.fn()
    const marks = [createPositionMark()]
    render(
      <BookMarksPanel
        open={true}
        onOpenChange={vi.fn()}
        marks={marks}
        onJump={vi.fn()}
        onRemove={onRemove}
      />
    )

    const deleteButton = screen.getByRole('button', { name: '删除' })
    fireEvent.click(deleteButton)
    expect(onRemove).toHaveBeenCalledWith('mark-1')
  })

  it('renders mixed bookmarks and collections', () => {
    const marks = [createPositionMark({ id: 'p1' }), createCollectionMark({ id: 'c1' })]
    render(
      <BookMarksPanel
        open={true}
        onOpenChange={vi.fn()}
        marks={marks}
        onJump={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    // Should have two mark entries
    expect(screen.getByText('第 4 句')).toBeInTheDocument()
    expect(screen.getByText('selected text')).toBeInTheDocument()
  })

  it('shows count badge for bookmarks', () => {
    const marks = [createPositionMark({ id: 'p1' }), createPositionMark({ id: 'p2' })]
    render(
      <BookMarksPanel
        open={true}
        onOpenChange={vi.fn()}
        marks={marks}
        onJump={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    expect(screen.getByText('(2)')).toBeInTheDocument()
  })
})
