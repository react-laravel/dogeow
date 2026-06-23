import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteTitleInput from '../NoteTitleInput'

const defaultProps = {
  title: 'Test Note Title',
  onTitleChange: vi.fn(),
  isSaving: false,
  isVoiceListening: false,
  isVoiceSupported: true,
  onVoiceToggle: vi.fn(),
}

describe('NoteTitleInput', () => {
  it('should render with title value', () => {
    render(<NoteTitleInput {...defaultProps} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('Test Note Title')
  })

  it('should call onTitleChange when input value changes', async () => {
    const onTitleChange = vi.fn()
    render(<NoteTitleInput {...defaultProps} onTitleChange={onTitleChange} />)

    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'New Title')

    expect(onTitleChange).toHaveBeenCalled()
  })

  it('should disable input when isSaving is true', () => {
    render(<NoteTitleInput {...defaultProps} isSaving={true} />)

    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('should enable input when isSaving is false', () => {
    render(<NoteTitleInput {...defaultProps} isSaving={false} />)

    const input = screen.getByRole('textbox')
    expect(input).not.toBeDisabled()
  })

  it('should render placeholder text', () => {
    render(<NoteTitleInput {...defaultProps} title="" />)

    const input = screen.getByPlaceholderText('请输入笔记标题')
    expect(input).toBeInTheDocument()
  })

  it('should have correct input id', () => {
    render(<NoteTitleInput {...defaultProps} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('id', 'title')
  })

  it('should render with empty title', () => {
    render(<NoteTitleInput {...defaultProps} title="" />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('')
  })

  it('should update input value when title prop changes', () => {
    const { rerender } = render(<NoteTitleInput {...defaultProps} title="Initial" />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('Initial')

    rerender(<NoteTitleInput {...defaultProps} title="Updated" />)

    expect(input).toHaveValue('Updated')
  })
})
