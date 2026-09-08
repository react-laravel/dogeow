import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { useEffect } from 'react'
import NotePage from '../page'

const { newNode, createLink } = vi.hoisted(() => ({ newNode: vi.fn(), createLink: vi.fn() }))
vi.mock('@/lib/auth', () => ({ isAdminSync: () => true }))
vi.mock('../components/GraphView', () => ({
  default: function GraphMock({
    query,
    onNewNodeRef,
    onCreateLinkRef,
  }: {
    query: string
    onNewNodeRef: { current: (() => void) | null }
    onCreateLinkRef: { current: (() => void) | null }
  }) {
    useEffect(() => {
      onNewNodeRef.current = newNode
      onCreateLinkRef.current = createLink
    }, [onNewNodeRef, onCreateLinkRef])
    return <div data-testid="graph-view">{query}</div>
  },
}))

// Mock dependencies
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/note'),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  ),
}))

vi.mock('@/lib/api', () => ({
  get: vi.fn(),
}))

vi.mock('@/lib/api/wiki', () => ({
  getWikiGraph: vi.fn().mockResolvedValue({ nodes: [], links: [] }),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('@/components/novel-editor/markdown-preview', () => ({
  default: ({ content }: { content: string }) => <div data-testid="markdown">{content}</div>,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
}))

vi.mock('../components/NoteSpeedDial', () => ({
  default: () => <div data-testid="note-speed-dial">NoteSpeedDial</div>,
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date) => date.toISOString()),
}))

vi.mock('date-fns/locale', () => ({
  zhCN: {},
}))

describe('NotePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('should render loading state initially', async () => {
    const { get } = await import('@/lib/api')
    vi.mocked(get).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(
      <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
        <NotePage />
      </SWRConfig>
    )

    // Should show loading skeleton
    expect(screen.getAllByTestId('card')).toHaveLength(3)
  })

  it('should render empty state when no notes', async () => {
    const { get } = await import('@/lib/api')
    vi.mocked(get).mockResolvedValue({ notes: [] })

    render(
      <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
        <NotePage />
      </SWRConfig>
    )

    await waitFor(() => {
      expect(screen.getByText('暂无笔记')).toBeInTheDocument()
      expect(screen.getByText('请添加您的第一个笔记')).toBeInTheDocument()
    })
  })

  it('should render notes when data is loaded', async () => {
    const mockNotes = [
      {
        id: 1,
        title: 'Test Note 1',
        content: 'Test content 1',
        content_markdown: '# Test Note 1\n\nTest content 1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        is_draft: false,
      },
      {
        id: 2,
        title: 'Test Note 2',
        content: 'Test content 2',
        content_markdown: '# Test Note 2\n\nTest content 2',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T13:00:00Z',
        is_draft: true,
      },
    ]

    const { get } = await import('@/lib/api')
    vi.mocked(get).mockResolvedValue({ notes: mockNotes })

    render(
      <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
        <NotePage />
      </SWRConfig>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Note 1')).toBeInTheDocument()
      expect(screen.getByText('Test Note 2')).toBeInTheDocument()
    })
  })

  it('should render title-only notes in the list', async () => {
    const mockNotes = [
      {
        id: 3,
        title: '只有标题的笔记',
        content:
          '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}',
        content_markdown: '',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        is_draft: false,
      },
    ]

    const { get } = await import('@/lib/api')
    vi.mocked(get).mockResolvedValue(mockNotes)

    render(
      <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
        <NotePage />
      </SWRConfig>
    )

    await waitFor(() => {
      expect(screen.getByText('只有标题的笔记')).toBeInTheDocument()
      expect(screen.getByText('(无内容)')).toBeInTheDocument()
    })
  })

  it('should render note cards with correct links', async () => {
    const mockNotes = [
      {
        id: 1,
        title: 'Test Note',
        content: 'Test content',
        content_markdown: '# Test Note\n\nTest content',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        is_draft: false,
      },
    ]

    const { get } = await import('@/lib/api')
    vi.mocked(get).mockResolvedValue({ notes: mockNotes })

    render(
      <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
        <NotePage />
      </SWRConfig>
    )

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Test Note/ })
      expect(link).toHaveAttribute('href', '/note/1')
    })
  })

  it('should handle API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { get } = await import('@/lib/api')
    vi.mocked(get).mockRejectedValue(new Error('API Error'))

    const { toast } = await import('sonner')

    render(
      <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
        <NotePage />
      </SWRConfig>
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('获取笔记列表失败:', expect.any(Error))
      expect(toast.error).toHaveBeenCalledWith('无法加载笔记列表')
    })

    consoleSpy.mockRestore()
  })

  it('should render draft notes with lock icon', async () => {
    const mockNotes = [
      {
        id: 1,
        title: 'Draft Note',
        content: 'Draft content',
        content_markdown: '# Draft Note\n\nDraft content',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        is_draft: true,
      },
    ]

    const { get } = await import('@/lib/api')
    vi.mocked(get).mockResolvedValue({ notes: mockNotes })

    const { container } = render(
      <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
        <NotePage />
      </SWRConfig>
    )

    await waitFor(() => {
      expect(screen.getByText('Draft Note')).toBeInTheDocument()
      expect(container.querySelector('svg.lucide-lock')).toBeTruthy()
    })
  })

  it('should format dates correctly', async () => {
    const mockNotes = [
      {
        id: 1,
        title: 'Test Note',
        content: 'Test content',
        content_markdown: '# Test Note\n\nTest content',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        is_draft: false,
      },
    ]

    const { get } = await import('@/lib/api')
    vi.mocked(get).mockResolvedValue({ notes: mockNotes })

    const { format } = await import('date-fns')
    vi.mocked(format).mockReturnValue('2024-01-01')

    render(
      <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
        <NotePage />
      </SWRConfig>
    )

    await waitFor(() => {
      expect(format).toHaveBeenCalled()
    })
  })

  it('should handle empty notes array', async () => {
    const { get } = await import('@/lib/api')
    vi.mocked(get).mockResolvedValue({ notes: [] })

    render(
      <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
        <NotePage />
      </SWRConfig>
    )

    await waitFor(() => {
      expect(screen.getByText('暂无笔记')).toBeInTheDocument()
    })
  })

  it('should handle null API response', async () => {
    const { get } = await import('@/lib/api')
    vi.mocked(get).mockResolvedValue(null)

    render(
      <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
        <NotePage />
      </SWRConfig>
    )

    await waitFor(() => {
      expect(screen.getByText('暂无笔记')).toBeInTheDocument()
    })
  })

  it('should handle undefined API response', async () => {
    const { get } = await import('@/lib/api')
    vi.mocked(get).mockResolvedValue(undefined)

    render(
      <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
        <NotePage />
      </SWRConfig>
    )

    await waitFor(() => {
      expect(screen.getByText('暂无笔记')).toBeInTheDocument()
    })
  })
  it('keeps one working search and both creation actions in graph view', async () => {
    const { get } = await import('@/lib/api')
    vi.mocked(get).mockResolvedValue([])
    render(
      <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
        <NotePage />
      </SWRConfig>
    )
    fireEvent.click(screen.getByRole('tab', { name: /图谱/ }))
    await screen.findByRole('button', { name: '新建节点' })
    expect(screen.getAllByRole('searchbox')).toHaveLength(1)
    fireEvent.change(screen.getByRole('searchbox', { name: '搜索图谱节点' }), {
      target: { value: '旅行' },
    })
    expect(screen.getByTestId('graph-view')).toHaveTextContent('旅行')
    fireEvent.click(screen.getByRole('button', { name: '新建节点' }))
    fireEvent.click(screen.getByRole('button', { name: '创建链接' }))
    expect(newNode).toHaveBeenCalledOnce()
    expect(createLink).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: '清空搜索图谱节点' }))
    expect(screen.getByTestId('graph-view')).toBeEmptyDOMElement()
  })

  it('searches notes and keeps the new-note action accessible', async () => {
    const { get } = await import('@/lib/api')
    vi.mocked(get).mockResolvedValue([
      {
        id: 1,
        title: '旅行计划',
        content: '目的地',
        content_markdown: '目的地',
        updated_at: '2024-01-01',
        is_draft: false,
      },
      {
        id: 2,
        title: '项目记录',
        content: '进度',
        content_markdown: '进度',
        updated_at: '2024-01-02',
        is_draft: false,
      },
    ])
    render(
      <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
        <NotePage />
      </SWRConfig>
    )
    await screen.findByText('旅行计划')
    fireEvent.change(screen.getByRole('searchbox', { name: '搜索笔记' }), {
      target: { value: '项目' },
    })
    expect(screen.queryByText('旅行计划')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '新建笔记' })).toHaveAttribute('href', '/note/new')
    expect(screen.getByText('项目记录')).toBeInTheDocument()
  })
})
