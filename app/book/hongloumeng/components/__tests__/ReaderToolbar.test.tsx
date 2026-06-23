import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReaderToolbar } from '../ReaderToolbar'
import type { ReaderSettings } from '../../hooks/useReaderSettings'
import type { BookNarrationStatus, BookNarrationMode } from '../../hooks/useBookNarration'

const defaultSettings: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  theme: 'light',
  pairDisplayMode: 'stacked',
  contentMode: 'both',
  originalFontFamily: 'serif',
  translationFontFamily: 'sans-serif',
  chapterId: 1,
}

const chapters = [
  { id: 1, title: '第一回 甄士隐梦幻识通灵' },
  { id: 2, title: '第二回 贾夫人仙逝扬州城' },
]

describe('ReaderToolbar', () => {
  const defaultProps = {
    chapters,
    settings: defaultSettings,
    markCount: 0,
    onChapterChange: vi.fn(),
    onAddBookmark: vi.fn(),
    onOpenMarks: vi.fn(),
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
    expect(screen.getByText('第一回 甄士隐梦幻识通灵')).toBeInTheDocument()
    expect(screen.getByText('第二回 贾夫人仙逝扬州城')).toBeInTheDocument()
  })

  it('shows bookmark button', () => {
    render(<ReaderToolbar {...defaultProps} />)
    expect(screen.getByRole('button', { name: '添加当前位置书签' })).toBeInTheDocument()
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
    expect(onChapterChange).toHaveBeenCalledWith(2)
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

  it('shows marks list button with count badge', () => {
    render(<ReaderToolbar {...defaultProps} markCount={5} />)
    const listButton = screen.getByRole('button', { name: '打开书签与收藏' })
    expect(listButton).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows 99+ when mark count exceeds 99', () => {
    render(<ReaderToolbar {...defaultProps} markCount={150} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('does not show badge when markCount is 0', () => {
    const { container } = render(<ReaderToolbar {...defaultProps} markCount={0} />)
    expect(container.querySelector('.absolute')).toBeFalsy()
  })

  it('calls onAddBookmark when bookmark button is clicked', () => {
    const onAddBookmark = vi.fn()
    render(<ReaderToolbar {...defaultProps} onAddBookmark={onAddBookmark} />)
    const bookmarkButton = screen.getByRole('button', { name: '添加当前位置书签' })
    fireEvent.click(bookmarkButton)
    expect(onAddBookmark).toHaveBeenCalled()
  })
})
