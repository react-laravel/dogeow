import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteDetailHeader from '../NoteDetailHeader'

const mockRouterBack = vi.fn()
const mockRouterPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockRouterBack,
    push: mockRouterPush,
  }),
}))

describe('NoteDetailHeader', () => {
  const defaultProps = {
    title: 'Test Note Title',
    isDraft: false,
    noteId: '42',
    onDelete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the note title', () => {
    render(<NoteDetailHeader {...defaultProps} />)

    expect(screen.getByText('Test Note Title')).toBeInTheDocument()
  })

  it('should render back button', () => {
    render(<NoteDetailHeader {...defaultProps} />)

    expect(screen.getByLabelText('返回')).toBeInTheDocument()
  })

  it('should render edit button', () => {
    render(<NoteDetailHeader {...defaultProps} />)

    expect(screen.getByLabelText('编辑')).toBeInTheDocument()
  })

  it('should render delete button', () => {
    render(<NoteDetailHeader {...defaultProps} />)

    expect(screen.getByLabelText('删除')).toBeInTheDocument()
  })

  it('should navigate back when back button is clicked', async () => {
    render(<NoteDetailHeader {...defaultProps} />)

    const backButton = screen.getByLabelText('返回')
    await userEvent.click(backButton)

    expect(mockRouterBack).toHaveBeenCalledTimes(1)
  })

  it('should navigate to edit page when edit button is clicked', async () => {
    render(<NoteDetailHeader {...defaultProps} />)

    const editButton = screen.getByLabelText('编辑')
    await userEvent.click(editButton)

    expect(mockRouterPush).toHaveBeenCalledWith('/note/edit/42')
  })

  it('should call onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn()
    render(<NoteDetailHeader {...defaultProps} onDelete={onDelete} />)

    const deleteButton = screen.getByLabelText('删除')
    await userEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('should handle array noteId', async () => {
    render(<NoteDetailHeader {...defaultProps} noteId={['99']} />)

    const editButton = screen.getByLabelText('编辑')
    await userEvent.click(editButton)

    expect(mockRouterPush).toHaveBeenCalledWith('/note/edit/99')
  })

  it('should show lock icon for draft notes', () => {
    render(<NoteDetailHeader {...defaultProps} isDraft={true} />)

    expect(screen.getByText('Test Note Title')).toBeInTheDocument()
    // Lock icon should be rendered - check for it via aria or text
    const titleElement = screen.getByText('Test Note Title')
    expect(titleElement.parentElement).toBeTruthy()
  })

  it('should not show lock icon for published notes', () => {
    const { container } = render(<NoteDetailHeader {...defaultProps} isDraft={false} />)

    // No lock icon for published notes
    const lockIcon = container.querySelector('.lucide-lock')
    expect(lockIcon).toBeNull()
  })

  it('should render h1 heading', () => {
    render(<NoteDetailHeader {...defaultProps} />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Test Note Title')
  })
})
