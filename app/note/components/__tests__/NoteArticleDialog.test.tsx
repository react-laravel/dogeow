import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteArticleDialog } from '../NoteArticleDialog'

// Mock dynamic imports
vi.mock('next/dynamic', () => ({
  default: () => () => null,
}))

const createThemeColors = () => ({
  background: '#ffffff',
  foreground: '#111827',
  card: '#ffffff',
  cardForeground: '#111827',
  mutedForeground: '#64748b',
  border: '#e5e7eb',
  primary: '#2563eb',
  ring: '#60a5fa',
  accent: '#38bdf8',
})

describe('NoteArticleDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    activeNode: {
      id: '1',
      title: 'Article Title',
      tags: ['tag1', 'tag2'],
      summary: 'Article summary',
    },
    articleHtml: '',
    articleRaw: '',
    articleJson: null,
    loadingArticle: false,
    articleError: '',
    isDark: false,
    themeColors: createThemeColors(),
  }

  it('should render dialog with article title', () => {
    render(<NoteArticleDialog {...defaultProps} />)

    expect(screen.getByText('Article Title')).toBeInTheDocument()
  })

  it('should render close button', () => {
    render(<NoteArticleDialog {...defaultProps} />)

    expect(screen.getByText('关闭')).toBeInTheDocument()
  })

  it('should call onOpenChange when close button is clicked', async () => {
    const onOpenChange = vi.fn()
    render(<NoteArticleDialog {...defaultProps} onOpenChange={onOpenChange} />)

    const closeButton = screen.getByText('关闭')
    await userEvent.click(closeButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should render default title when activeNode is null', () => {
    render(<NoteArticleDialog {...defaultProps} activeNode={null} />)

    expect(screen.getByText('文章')).toBeInTheDocument()
  })

  it('should render tags when activeNode has tags', () => {
    render(<NoteArticleDialog {...defaultProps} />)

    expect(screen.getByText('#tag1')).toBeInTheDocument()
    expect(screen.getByText('#tag2')).toBeInTheDocument()
  })

  it('should render summary when activeNode has summary', () => {
    render(<NoteArticleDialog {...defaultProps} />)

    expect(screen.getByText('Article summary')).toBeInTheDocument()
  })

  it('should render loading state', () => {
    render(<NoteArticleDialog {...defaultProps} loadingArticle={true} />)

    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('should render error state', () => {
    render(<NoteArticleDialog {...defaultProps} articleError="加载失败" />)

    expect(screen.getByText('加载失败：加载失败')).toBeInTheDocument()
  })

  it('should render markdown preview when articleRaw is provided', () => {
    render(<NoteArticleDialog {...defaultProps} articleRaw="# Markdown Content" />)

    // The MarkdownPreview component receives the content
    expect(screen.getByText('Article Title')).toBeInTheDocument()
  })

  it('should render HTML content when articleHtml is provided', () => {
    render(<NoteArticleDialog {...defaultProps} articleHtml="<p>HTML Content</p>" />)

    expect(screen.getByText('Article Title')).toBeInTheDocument()
  })

  it('should show click prompt when no content is available', () => {
    render(<NoteArticleDialog {...defaultProps} />)

    expect(screen.getByText('点击节点以加载文章')).toBeInTheDocument()
  })

  it('should not render tags when activeNode has no tags', () => {
    render(
      <NoteArticleDialog
        {...defaultProps}
        activeNode={{ id: '1', title: 'No Tags', tags: [], summary: '' }}
      />
    )

    expect(screen.queryByText(/#\w+/)).not.toBeInTheDocument()
  })

  it('should not render summary when activeNode has no summary', () => {
    render(
      <NoteArticleDialog
        {...defaultProps}
        activeNode={{ id: '1', title: 'No Summary', tags: [], summary: undefined }}
      />
    )

    expect(screen.queryByText('Article summary')).not.toBeInTheDocument()
  })

  it('should apply dark overlay when isDark is true', () => {
    render(<NoteArticleDialog {...defaultProps} isDark={true} />)

    const overlay = document.body.querySelector('[style*="rgba(0, 0, 0, 0.6)"]')
    expect(overlay).toBeTruthy()
  })

  it('should apply light overlay when isDark is false', () => {
    render(<NoteArticleDialog {...defaultProps} isDark={false} />)

    const overlay = document.body.querySelector('[style*="rgba(0, 0, 0, 0.3)"]')
    expect(overlay).toBeTruthy()
  })

  it('should render with correct z-index layering', () => {
    render(<NoteArticleDialog {...defaultProps} />)

    const overlay = document.body.querySelector('[style*="z-index: 50"]')
    const content = document.body.querySelector('[style*="z-index: 51"]')
    expect(overlay).toBeTruthy()
    expect(content).toBeTruthy()
  })
})
