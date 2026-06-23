import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteEditorToolbar } from '../NoteEditorToolbar'

describe('NoteEditorToolbar', () => {
  const defaultProps = {
    title: '测试笔记',
    isPrivate: false,
    isSaving: false,
    onTitleChange: vi.fn(),
    onSave: vi.fn(),
    onTogglePrivacy: vi.fn(),
  }

  it('should render the title input with value', () => {
    render(<NoteEditorToolbar {...defaultProps} />)
    expect(screen.getByDisplayValue('测试笔记')).toBeInTheDocument()
  })

  it('should show placeholder when title is empty', () => {
    render(<NoteEditorToolbar {...defaultProps} title="" />)
    expect(screen.getByPlaceholderText('笔记标题')).toBeInTheDocument()
  })

  it('should call onTitleChange when input value changes', async () => {
    const user = userEvent.setup()
    render(<NoteEditorToolbar {...defaultProps} />)

    const input = screen.getByPlaceholderText('笔记标题')
    await user.clear(input)
    await user.type(input, '新标题')

    expect(defaultProps.onTitleChange).toHaveBeenCalled()
  })

  it('should render save button', () => {
    render(<NoteEditorToolbar {...defaultProps} />)
    expect(screen.getByLabelText('保存笔记')).toBeInTheDocument()
  })

  it('should call onSave when save button is clicked', async () => {
    const user = userEvent.setup()
    render(<NoteEditorToolbar {...defaultProps} />)

    await user.click(screen.getByLabelText('保存笔记'))
    expect(defaultProps.onSave).toHaveBeenCalled()
  })

  it('should render privacy toggle button', () => {
    render(<NoteEditorToolbar {...defaultProps} />)
    expect(screen.getByLabelText('切换为私密')).toBeInTheDocument()
  })

  it('should show unlock icon when not private', () => {
    render(<NoteEditorToolbar {...defaultProps} isPrivate={false} />)
    expect(screen.getByLabelText('切换为私密')).toBeInTheDocument()
  })

  it('should show lock icon when private', () => {
    render(<NoteEditorToolbar {...defaultProps} isPrivate={true} />)
    expect(screen.getByLabelText('切换为公开')).toBeInTheDocument()
  })

  it('should call onTogglePrivacy when privacy button is clicked', async () => {
    const user = userEvent.setup()
    render(<NoteEditorToolbar {...defaultProps} />)

    await user.click(screen.getByLabelText('切换为私密'))
    expect(defaultProps.onTogglePrivacy).toHaveBeenCalled()
  })

  it('should disable buttons when title is empty', () => {
    render(<NoteEditorToolbar {...defaultProps} title="" />)
    expect(screen.getByLabelText('切换为私密')).toBeDisabled()
    expect(screen.getByLabelText('保存笔记')).toBeDisabled()
  })

  it('should disable buttons when title is whitespace only', () => {
    render(<NoteEditorToolbar {...defaultProps} title="   " />)
    expect(screen.getByLabelText('切换为私密')).toBeDisabled()
    expect(screen.getByLabelText('保存笔记')).toBeDisabled()
  })

  it('should disable buttons when saving', () => {
    render(<NoteEditorToolbar {...defaultProps} isSaving={true} />)
    expect(screen.getByLabelText('切换为私密')).toBeDisabled()
    expect(screen.getByLabelText('保存笔记')).toBeDisabled()
  })

  it('should disable input when saving', () => {
    render(<NoteEditorToolbar {...defaultProps} isSaving={true} />)
    expect(screen.getByPlaceholderText('笔记标题')).toBeDisabled()
  })

  it('should show loading spinner when saving', () => {
    render(<NoteEditorToolbar {...defaultProps} isSaving={true} />)
    // Loader2 has animate-spin class
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should enable buttons when title is non-empty and not saving', () => {
    render(<NoteEditorToolbar {...defaultProps} title="有内容的标题" isSaving={false} />)
    expect(screen.getByLabelText('切换为私密')).not.toBeDisabled()
    expect(screen.getByLabelText('保存笔记')).not.toBeDisabled()
  })

  it('should render with custom className', () => {
    const { container } = render(<NoteEditorToolbar {...defaultProps} className="custom-class" />)
    const toolbar = container.firstChild as HTMLElement
    expect(toolbar).toHaveClass('custom-class')
  })
})
