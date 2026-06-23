import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteBottomActionBar from '../NoteBottomActionBar'

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

describe('NoteBottomActionBar', () => {
  const defaultProps = {
    isAdmin: true,
    themeColors: createThemeColors(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  it('should render nothing when user is not admin', () => {
    const { container } = render(<NoteBottomActionBar {...defaultProps} isAdmin={false} />)

    expect(container.firstChild).toBeNull()
  })

  it('should render action buttons when user is admin', () => {
    render(<NoteBottomActionBar {...defaultProps} />)

    expect(screen.getByText('编辑节点')).toBeInTheDocument()
    expect(screen.getByText('删除节点')).toBeInTheDocument()
  })

  it('should call onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn()
    render(<NoteBottomActionBar {...defaultProps} onEdit={onEdit} />)

    const editButton = screen.getByText('编辑节点')
    await userEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('should call onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn()
    render(<NoteBottomActionBar {...defaultProps} onDelete={onDelete} />)

    const deleteButton = screen.getByText('删除节点')
    await userEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('should have correct positioning styles', () => {
    const { container } = render(<NoteBottomActionBar {...defaultProps} />)

    const bar = container.firstChild as HTMLElement
    expect(bar.style.position).toBe('absolute')
    expect(bar.style.bottom).toBe('12px')
    expect(bar.style.left).toBe('12px')
    expect(bar.style.zIndex).toBe('10')
  })

  it('should apply themeColors border to buttons', () => {
    const themeColors = createThemeColors()
    render(<NoteBottomActionBar {...defaultProps} themeColors={themeColors} />)

    const editButton = screen.getByText('编辑节点').closest('button')
    expect(editButton).toHaveStyle({
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: themeColors.border,
    })
  })
})
