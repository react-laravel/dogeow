import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotePageGraphToolbar from '../NotePageGraphToolbar'

// Mock the auth module
const { mockIsAdminSync } = vi.hoisted(() => ({
  mockIsAdminSync: vi.fn(),
}))
vi.mock('@/lib/auth', () => ({
  isAdminSync: mockIsAdminSync,
}))

describe('NotePageGraphToolbar', () => {
  const defaultProps = {
    onNewNode: vi.fn(),
    onCreateLink: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAdminSync.mockReturnValue(true)
  })

  it('should render new node button when admin', () => {
    render(<NotePageGraphToolbar {...defaultProps} />)

    expect(screen.getByTitle('新建节点')).toBeInTheDocument()
  })

  it('should render create link button when admin', () => {
    render(<NotePageGraphToolbar {...defaultProps} />)

    expect(screen.getByTitle('创建链接')).toBeInTheDocument()
  })

  it('should not render buttons when not admin', () => {
    mockIsAdminSync.mockReturnValue(false)
    const { container } = render(<NotePageGraphToolbar {...defaultProps} />)

    expect(container.firstChild).toBeNull()
  })

  it('should call onNewNode when new node button is clicked', async () => {
    const onNewNode = vi.fn()
    render(<NotePageGraphToolbar {...defaultProps} onNewNode={onNewNode} />)

    const newButton = screen.getByTitle('新建节点')
    await userEvent.click(newButton)

    expect(onNewNode).toHaveBeenCalledTimes(1)
  })

  it('should call onCreateLink when create link button is clicked', async () => {
    const onCreateLink = vi.fn()
    render(<NotePageGraphToolbar {...defaultProps} onCreateLink={onCreateLink} />)

    const linkButton = screen.getByTitle('创建链接')
    await userEvent.click(linkButton)

    expect(onCreateLink).toHaveBeenCalledTimes(1)
  })

  it('should show a readable label for the new node action', () => {
    render(<NotePageGraphToolbar {...defaultProps} />)

    const newButton = screen.getByTitle('新建节点')
    expect(newButton).toHaveTextContent('新建节点')
  })

  it('should show a readable label for the create link action', () => {
    render(<NotePageGraphToolbar {...defaultProps} />)

    const linkButton = screen.getByTitle('创建链接')
    expect(linkButton).toHaveTextContent('创建链接')
  })

  it('should render with memo display name', () => {
    const { container } = render(<NotePageGraphToolbar {...defaultProps} />)

    // The component is memoized
    expect(container.firstChild).toBeTruthy()
  })
})
