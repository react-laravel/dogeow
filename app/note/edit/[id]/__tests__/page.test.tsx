import { act, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EditNotePage from '../page'
import { resetInFlightNoteMutationsForTests } from '../noteMutationLockStore'

const {
  mockApiRequest,
  mockCreateMutation,
  mockGetCurrentContent,
  mockUseNoteShortcuts,
  mockToastError,
  mockToastSuccess,
} = vi.hoisted(() => ({
  mockApiRequest: vi.fn(),
  mockCreateMutation: vi.fn(),
  mockGetCurrentContent: vi.fn(() => ({
    content:
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"stale"}]}]}',
    markdown: 'stale markdown',
  })),
  mockUseNoteShortcuts: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}))

let currentLoaderState: {
  note: {
    id: number
    title: string
    content: string
    content_markdown: string
    is_draft: boolean
  } | null
  loading: boolean
  error: string | null
}

let currentRouteId = '1'

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: currentRouteId }),
}))

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}))

vi.mock('@/lib/api', () => ({
  createMutation: mockCreateMutation,
}))

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
    success: mockToastSuccess,
  },
}))

vi.mock('../../../hooks/useNoteLoader', () => ({
  useNoteLoader: () => currentLoaderState,
}))

vi.mock('../../../hooks/useNoteContent', () => ({
  useNoteContent: () => ({
    getCurrentContent: mockGetCurrentContent,
  }),
}))

vi.mock('../../../hooks/useNoteShortcuts', () => ({
  useNoteShortcuts: mockUseNoteShortcuts,
}))

vi.mock('../../../components/NoteEditorToolbar', () => ({
  NoteEditorToolbar: ({
    title,
    isPrivate,
    isSaving,
  }: {
    title: string
    isPrivate: boolean
    isSaving: boolean
  }) => (
    <div
      data-testid="toolbar"
      data-private={isPrivate ? 'true' : 'false'}
      data-saving={isSaving ? 'true' : 'false'}
    >
      {title}
    </div>
  ),
}))

vi.mock('../../../components/NoteLoadingState', () => ({
  NoteLoadingState: () => <div>loading</div>,
}))

vi.mock('../../../components/NoteErrorState', () => ({
  NoteErrorState: ({ message }: { message: string }) => <div>{message}</div>,
}))

vi.mock('@/components/layout', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('EditNotePage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    resetInFlightNoteMutationsForTests()
    currentRouteId = '1'
    mockCreateMutation.mockImplementation(() => mockApiRequest)
    currentLoaderState = {
      note: {
        id: 1,
        title: '已加载笔记',
        content: '',
        content_markdown: '',
        is_draft: false,
      },
      loading: false,
      error: null,
    }
  })

  it('should disable save actions when the page no longer has a loaded note', async () => {
    const { rerender } = render(<EditNotePage />)

    await waitFor(() => {
      expect(mockUseNoteShortcuts).toHaveBeenCalled()
      expect(mockUseNoteShortcuts.mock.lastCall?.[0].isSaving).toBe(false)
    })

    currentLoaderState = {
      note: null,
      loading: false,
      error: null,
    }

    rerender(<EditNotePage />)

    await waitFor(() => {
      expect(mockUseNoteShortcuts.mock.lastCall?.[0].isSaving).toBe(true)
    })

    const latestShortcutsOptions = mockUseNoteShortcuts.mock.lastCall?.[0]

    await act(async () => {
      await latestShortcutsOptions?.onSave()
      await latestShortcutsOptions?.onTogglePrivacy()
    })

    expect(mockApiRequest).not.toHaveBeenCalled()
  })

  it('should ignore an old privacy request after switching to another note', async () => {
    let resolveRequest: (() => void) | undefined
    mockApiRequest.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveRequest = resolve
        })
    )

    const { rerender } = render(<EditNotePage />)

    await waitFor(() => {
      expect(mockUseNoteShortcuts.mock.lastCall?.[0].isSaving).toBe(false)
      expect(document.querySelector('[data-testid="toolbar"]')?.textContent).toBe('已加载笔记')
      expect(document.querySelector('[data-testid="toolbar"]')?.getAttribute('data-private')).toBe(
        'false'
      )
    })

    const firstShortcutsOptions = mockUseNoteShortcuts.mock.lastCall?.[0]

    await act(async () => {
      void firstShortcutsOptions?.onTogglePrivacy()
    })

    expect(mockCreateMutation).toHaveBeenCalledWith('/notes/1', 'PUT')

    currentRouteId = '2'
    currentLoaderState = {
      note: {
        id: 2,
        title: '第二篇笔记',
        content: '',
        content_markdown: '',
        is_draft: false,
      },
      loading: false,
      error: null,
    }

    rerender(<EditNotePage />)

    await act(async () => {
      resolveRequest?.()
    })

    await waitFor(() => {
      expect(mockUseNoteShortcuts.mock.lastCall?.[0].isSaving).toBe(false)
      expect(document.querySelector('[data-testid="toolbar"]')?.textContent).toBe('第二篇笔记')
      expect(document.querySelector('[data-testid="toolbar"]')?.getAttribute('data-private')).toBe(
        'false'
      )
    })
  })

  it('should ignore an old privacy request even after navigating back to the same note id', async () => {
    let resolveRequest: (() => void) | undefined
    mockApiRequest.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveRequest = resolve
        })
    )

    const { rerender } = render(<EditNotePage />)

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.textContent).toBe('已加载笔记')
      expect(document.querySelector('[data-testid="toolbar"]')?.getAttribute('data-private')).toBe(
        'false'
      )
    })

    const firstShortcutsOptions = mockUseNoteShortcuts.mock.lastCall?.[0]

    await act(async () => {
      void firstShortcutsOptions?.onTogglePrivacy()
    })

    currentRouteId = '2'
    currentLoaderState = {
      note: {
        id: 2,
        title: '第二篇笔记',
        content: '',
        content_markdown: '',
        is_draft: false,
      },
      loading: false,
      error: null,
    }
    rerender(<EditNotePage />)

    currentRouteId = '1'
    currentLoaderState = {
      note: {
        id: 1,
        title: '重新进入的第一篇笔记',
        content: '',
        content_markdown: '',
        is_draft: false,
      },
      loading: false,
      error: null,
    }
    rerender(<EditNotePage />)

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.getAttribute('data-saving')).toBe(
        'true'
      )
      expect(mockUseNoteShortcuts.mock.lastCall?.[0].isSaving).toBe(true)
    })

    await act(async () => {
      resolveRequest?.()
    })

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.textContent).toBe(
        '重新进入的第一篇笔记'
      )
      expect(document.querySelector('[data-testid="toolbar"]')?.getAttribute('data-private')).toBe(
        'false'
      )
      expect(document.querySelector('[data-testid="toolbar"]')?.getAttribute('data-saving')).toBe(
        'false'
      )
      expect(mockUseNoteShortcuts.mock.lastCall?.[0].isSaving).toBe(false)
    })
  })

  it('should ignore a stale save callback that fires after navigating to another note', async () => {
    const { rerender } = render(<EditNotePage />)

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.textContent).toBe('已加载笔记')
    })

    const firstShortcutsOptions = mockUseNoteShortcuts.mock.lastCall?.[0]

    currentRouteId = '2'
    currentLoaderState = {
      note: {
        id: 2,
        title: '第二篇笔记',
        content: '',
        content_markdown: '',
        is_draft: false,
      },
      loading: false,
      error: null,
    }

    rerender(<EditNotePage />)

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.textContent).toBe('第二篇笔记')
    })

    await act(async () => {
      await firstShortcutsOptions?.onSave()
    })

    expect(mockCreateMutation).not.toHaveBeenCalled()
    expect(mockApiRequest).not.toHaveBeenCalled()
  })

  it('should ignore a stale privacy callback that fires after navigating to another note', async () => {
    const { rerender } = render(<EditNotePage />)

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.textContent).toBe('已加载笔记')
    })

    const firstShortcutsOptions = mockUseNoteShortcuts.mock.lastCall?.[0]

    currentRouteId = '2'
    currentLoaderState = {
      note: {
        id: 2,
        title: '第二篇笔记',
        content: '',
        content_markdown: '',
        is_draft: false,
      },
      loading: false,
      error: null,
    }

    rerender(<EditNotePage />)

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.textContent).toBe('第二篇笔记')
    })

    await act(async () => {
      await firstShortcutsOptions?.onTogglePrivacy()
    })

    expect(mockCreateMutation).not.toHaveBeenCalled()
    expect(mockApiRequest).not.toHaveBeenCalled()
  })

  it('should block a stale same-note callback from another live page instance before it rerenders', async () => {
    render(<EditNotePage />)
    render(<EditNotePage />)

    await waitFor(() => {
      expect(mockUseNoteShortcuts.mock.calls.length).toBeGreaterThanOrEqual(2)
      expect(document.querySelectorAll('[data-testid="toolbar"]')).toHaveLength(2)
    })

    const firstShortcutsOptions = mockUseNoteShortcuts.mock.calls.at(-2)?.[0]
    const secondShortcutsOptions = mockUseNoteShortcuts.mock.calls.at(-1)?.[0]

    let resolveRequest: (() => void) | undefined
    mockApiRequest.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveRequest = resolve
        })
    )

    await act(async () => {
      void firstShortcutsOptions?.onSave()
      void secondShortcutsOptions?.onSave()
    })

    await waitFor(() => {
      expect(mockCreateMutation).toHaveBeenCalledTimes(1)
      expect(mockApiRequest).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      resolveRequest?.()
    })
  })

  it('should release the same-note lock in a newly mounted page instance when an older save finishes', async () => {
    let resolveRequest: (() => void) | undefined
    mockApiRequest.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveRequest = resolve
        })
    )

    const firstRender = render(<EditNotePage />)

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.textContent).toBe('已加载笔记')
    })

    const firstShortcutsOptions = mockUseNoteShortcuts.mock.lastCall?.[0]

    await act(async () => {
      void firstShortcutsOptions?.onSave()
    })

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.getAttribute('data-saving')).toBe(
        'true'
      )
      expect(mockUseNoteShortcuts.mock.lastCall?.[0].isSaving).toBe(true)
    })

    firstRender.unmount()

    render(<EditNotePage />)

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.textContent).toBe('已加载笔记')
      expect(document.querySelector('[data-testid="toolbar"]')?.getAttribute('data-saving')).toBe(
        'true'
      )
      expect(mockUseNoteShortcuts.mock.lastCall?.[0].isSaving).toBe(true)
    })

    await act(async () => {
      resolveRequest?.()
    })

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.getAttribute('data-saving')).toBe(
        'false'
      )
      expect(mockUseNoteShortcuts.mock.lastCall?.[0].isSaving).toBe(false)
    })
  })

  it('should block a new save for the same note id while an older save is still in flight', async () => {
    let resolveRequest: (() => void) | undefined
    mockApiRequest.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveRequest = resolve
        })
    )

    const { rerender } = render(<EditNotePage />)

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.textContent).toBe('已加载笔记')
    })

    const firstShortcutsOptions = mockUseNoteShortcuts.mock.lastCall?.[0]

    await act(async () => {
      void firstShortcutsOptions?.onSave()
    })

    currentRouteId = '2'
    currentLoaderState = {
      note: {
        id: 2,
        title: '第二篇笔记',
        content: '',
        content_markdown: '',
        is_draft: false,
      },
      loading: false,
      error: null,
    }
    rerender(<EditNotePage />)

    currentRouteId = '1'
    currentLoaderState = {
      note: {
        id: 1,
        title: '重新进入的第一篇笔记',
        content: '',
        content_markdown: '',
        is_draft: false,
      },
      loading: false,
      error: null,
    }
    rerender(<EditNotePage />)

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.getAttribute('data-saving')).toBe(
        'true'
      )
      expect(mockUseNoteShortcuts.mock.lastCall?.[0].isSaving).toBe(true)
    })

    const latestShortcutsOptions = mockUseNoteShortcuts.mock.lastCall?.[0]

    await act(async () => {
      await latestShortcutsOptions?.onSave()
    })

    expect(mockCreateMutation).toHaveBeenCalledTimes(1)
    expect(mockApiRequest).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveRequest?.()
    })
  })

  it('should ignore an old save request after switching to another note', async () => {
    let resolveRequest: (() => void) | undefined
    mockApiRequest.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveRequest = resolve
        })
    )

    const { rerender } = render(<EditNotePage />)

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.textContent).toBe('已加载笔记')
    })

    const firstShortcutsOptions = mockUseNoteShortcuts.mock.lastCall?.[0]

    await act(async () => {
      void firstShortcutsOptions?.onSave()
    })

    expect(mockCreateMutation).toHaveBeenCalledWith('/notes/1', 'PUT')

    currentRouteId = '2'
    currentLoaderState = {
      note: {
        id: 2,
        title: '第二篇笔记',
        content: '',
        content_markdown: '',
        is_draft: false,
      },
      loading: false,
      error: null,
    }

    rerender(<EditNotePage />)

    await act(async () => {
      resolveRequest?.()
    })

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.textContent).toBe('第二篇笔记')
      expect(document.querySelector('[data-testid="toolbar"]')?.getAttribute('data-private')).toBe(
        'false'
      )
      expect(mockUseNoteShortcuts.mock.lastCall?.[0].isSaving).toBe(false)
    })
  })

  it('should ignore a repeated save while a mutation is already in flight', async () => {
    let resolveRequest: (() => void) | undefined
    mockApiRequest.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveRequest = resolve
        })
    )

    render(<EditNotePage />)

    await waitFor(() => {
      expect(document.querySelector('[data-testid="toolbar"]')?.textContent).toBe('已加载笔记')
    })

    const firstShortcutsOptions = mockUseNoteShortcuts.mock.lastCall?.[0]

    await act(async () => {
      void firstShortcutsOptions?.onSave()
      void firstShortcutsOptions?.onSave()
    })

    expect(mockCreateMutation).toHaveBeenCalledTimes(1)
    expect(mockApiRequest).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveRequest?.()
    })

    await waitFor(() => {
      expect(mockUseNoteShortcuts.mock.lastCall?.[0].isSaving).toBe(false)
    })
  })
})
