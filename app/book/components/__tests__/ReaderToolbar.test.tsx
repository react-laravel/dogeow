import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReaderToolbar } from '../ReaderToolbar'
import type { ReaderSettings } from '@/app/book/types/reader'
import type { BookNarrationStatus, BookNarrationMode } from '@/app/book/types/narration'

const defaultSettings: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  theme: 'light',
  pairDisplayMode: 'muted',
  contentMode: 'both',
  originalFontFamily: 'yahei',
  translationFontFamily: 'yahei',
  chapterId: 1,
}

const chapters = [
  { id: '1', title: '第一回 甄士隐梦幻识通灵' },
  { id: '2', title: '第二回 贾夫人仙逝扬州城' },
]

describe('ReaderToolbar', () => {
  const defaultProps = {
    chapters,
    currentChapterId: '1',
    settings: defaultSettings,
    bookmarkCount: 0,
    collectionCount: 0,
    onChapterChange: vi.fn(),
    onOpenBookmarks: vi.fn(),
    onOpenCollections: vi.fn(),
    onOpenSettings: vi.fn(),
    narrationStatus: 'idle' as BookNarrationStatus,
    narrationMode: 'original' as BookNarrationMode,
    onNarrationModeChange: vi.fn(),
    onStartNarration: vi.fn(),
    onPauseNarration: vi.fn(),
    onResumeNarration: vi.fn(),
    onStopNarration: vi.fn(),
  }

  it('renders chapter selector', () => {
    render(<ReaderToolbar {...defaultProps} />)
    expect(screen.getAllByText('第一回 甄士隐梦幻识通灵').length).toBeGreaterThan(0)
    expect(screen.getAllByText('第二回 贾夫人仙逝扬州城').length).toBeGreaterThan(0)
  })

  it('shows display and collection buttons', () => {
    render(<ReaderToolbar {...defaultProps} />)
    expect(screen.getByRole('button', { name: '打开展示列表' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '打开收藏列表' })).toBeInTheDocument()
  })

  it('shows settings button', () => {
    render(<ReaderToolbar {...defaultProps} />)
    expect(screen.getByRole('button', { name: '打开阅读设置' })).toBeInTheDocument()
  })

  it('calls onChapterChange when chapter is selected', () => {
    const onChapterChange = vi.fn()
    render(<ReaderToolbar {...defaultProps} onChapterChange={onChapterChange} />)

    // Select the second chapter
    const selectTriggers = screen.getAllByRole('combobox')
    // The first combobox is the chapter selector
    fireEvent.click(selectTriggers[0])
    // After clicking, the options should be visible
    const option = screen.getByText('第二回 贾夫人仙逝扬州城')
    fireEvent.click(option)
    expect(onChapterChange).toHaveBeenCalledWith('2')
  })

  it('renders grouped chapters with volume labels', () => {
    render(
      <ReaderToolbar
        {...defaultProps}
        chapters={[
          { id: '0-0', title: '第1卷 · 一件小事' },
          { id: '0-1', title: '第1卷 · 一觉' },
        ]}
        chapterGroups={[
          {
            label: '第1卷',
            chapters: [
              { id: '0-0', title: '一件小事' },
              { id: '0-1', title: '一觉' },
            ],
          },
        ]}
        currentChapterId="0-0"
      />
    )

    const chapterTrigger = screen.getByRole('button', { name: '选择章节' })
    expect(chapterTrigger).toHaveTextContent('一件小事')
    expect(screen.getByText('第1卷')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /全部(展开|收起)/ })).toBeInTheDocument()
    expect(screen.queryByText('第1卷 · 一件小事')).not.toBeInTheDocument()
  })

  it('shows play button when narration is idle', () => {
    render(<ReaderToolbar {...defaultProps} narrationStatus="idle" />)
    expect(screen.getByRole('button', { name: '从当前位置开始听书' })).toBeInTheDocument()
  })

  it('shows pause button when narration is playing', () => {
    render(<ReaderToolbar {...defaultProps} narrationStatus="playing" />)
    expect(screen.getByRole('button', { name: '暂停听书' })).toBeInTheDocument()
  })

  it('shows resume button when narration is paused', () => {
    render(<ReaderToolbar {...defaultProps} narrationStatus="paused" />)
    expect(screen.getByRole('button', { name: '继续听书' })).toBeInTheDocument()
  })

  it('shows stop button when narration is active', () => {
    render(<ReaderToolbar {...defaultProps} narrationStatus="playing" />)
    expect(screen.getByRole('button', { name: '停止听书' })).toBeInTheDocument()
  })

  it('calls onStartNarration when play is clicked', () => {
    const onStartNarration = vi.fn()
    render(<ReaderToolbar {...defaultProps} onStartNarration={onStartNarration} />)
    const playButton = screen.getByRole('button', { name: '从当前位置开始听书' })
    fireEvent.click(playButton)
    expect(onStartNarration).toHaveBeenCalled()
  })

  it('shows collection count badge', () => {
    render(<ReaderToolbar {...defaultProps} collectionCount={5} />)
    expect(screen.getByRole('button', { name: '打开收藏列表' })).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows bookmark count badge', () => {
    render(<ReaderToolbar {...defaultProps} bookmarkCount={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows 99+ when collection count exceeds 99', () => {
    render(<ReaderToolbar {...defaultProps} collectionCount={150} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('does not show badge when counts are 0', () => {
    const { container } = render(
      <ReaderToolbar {...defaultProps} bookmarkCount={0} collectionCount={0} />
    )
    expect(container.querySelector('.absolute')).toBeFalsy()
  })

  it('calls onOpenBookmarks when display button is clicked', () => {
    const onOpenBookmarks = vi.fn()
    render(<ReaderToolbar {...defaultProps} onOpenBookmarks={onOpenBookmarks} />)
    fireEvent.click(screen.getByRole('button', { name: '打开展示列表' }))
    expect(onOpenBookmarks).toHaveBeenCalled()
  })
})
