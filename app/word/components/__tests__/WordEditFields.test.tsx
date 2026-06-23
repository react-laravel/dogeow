import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WordEditFields } from '../WordEditFields'

describe('WordEditFields', () => {
  const defaultProps = {
    explanation: '测试释义',
    examples: 'Example sentence.\n测试例句。',
    isGenerating: false,
    isSaving: false,
    onExplanationChange: vi.fn(),
    onExamplesChange: vi.fn(),
    onGenerate: vi.fn(),
    onSave: vi.fn(),
  }

  it('renders explanation and examples textareas', () => {
    render(<WordEditFields {...defaultProps} />)

    expect(screen.getByText('中文释义')).toBeTruthy()
    expect(screen.getByText('例句（英文换行+中文，空行分隔多组）')).toBeTruthy()
  })

  it('displays initial values in textareas', () => {
    render(<WordEditFields {...defaultProps} />)

    const textareas = screen.getAllByRole('textbox')
    expect(textareas[0]).toHaveValue('测试释义')
    expect(textareas[1]).toHaveValue('Example sentence.\n测试例句。')
  })

  it('calls onExplanationChange when typing in explanation textarea', () => {
    const onExplanationChange = vi.fn()
    render(<WordEditFields {...defaultProps} onExplanationChange={onExplanationChange} />)

    const textareas = screen.getAllByRole('textbox')
    fireEvent.change(textareas[0], { target: { value: '新释义' } })

    expect(onExplanationChange).toHaveBeenCalledWith('新释义')
  })

  it('calls onExamplesChange when typing in examples textarea', () => {
    const onExamplesChange = vi.fn()
    render(<WordEditFields {...defaultProps} onExamplesChange={onExamplesChange} />)

    const textareas = screen.getAllByRole('textbox')
    fireEvent.change(textareas[1], { target: { value: 'New example' } })

    expect(onExamplesChange).toHaveBeenCalledWith('New example')
  })

  it('calls onGenerate when clicking the generate button', () => {
    const onGenerate = vi.fn()
    render(<WordEditFields {...defaultProps} onGenerate={onGenerate} />)

    fireEvent.click(screen.getByText('AI 生成数据'))

    expect(onGenerate).toHaveBeenCalledTimes(1)
  })

  it('calls onSave when clicking the save button', () => {
    const onSave = vi.fn()
    render(<WordEditFields {...defaultProps} onSave={onSave} />)

    fireEvent.click(screen.getByText('保存修改'))

    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('disables generate button when isGenerating is true', () => {
    render(<WordEditFields {...defaultProps} isGenerating={true} />)

    const generateBtn = screen.getByRole('button', { name: /生成中/ })
    expect(generateBtn).toBeDisabled()
  })

  it('disables save button when isSaving is true', () => {
    render(<WordEditFields {...defaultProps} isSaving={true} />)

    const saveBtn = screen.getByRole('button', { name: /保存中/ })
    expect(saveBtn).toBeDisabled()
  })

  it('enables generate button when isGenerating is false', () => {
    render(<WordEditFields {...defaultProps} isGenerating={false} />)

    const generateBtn = screen.getByRole('button', { name: /AI 生成数据/ })
    expect(generateBtn).not.toBeDisabled()
  })

  it('enables save button when isSaving is false', () => {
    render(<WordEditFields {...defaultProps} isSaving={false} />)

    const saveBtn = screen.getByRole('button', { name: /保存修改/ })
    expect(saveBtn).not.toBeDisabled()
  })

  it('shows loading spinner when generating', () => {
    const { container } = render(<WordEditFields {...defaultProps} isGenerating={true} />)

    // Loader2 icon has animate-spin class when generating
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
  })

  it('shows loading spinner when saving', () => {
    const { container } = render(<WordEditFields {...defaultProps} isSaving={true} />)

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
  })

  it('does not show spinner when not generating or saving', () => {
    const { container } = render(
      <WordEditFields {...defaultProps} isGenerating={false} isSaving={false} />
    )

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeFalsy()
  })

  it('shows generate button with RefreshCw icon when not generating', () => {
    render(<WordEditFields {...defaultProps} isGenerating={false} />)

    // The "AI 生成数据" button should be present (not "生成中...")
    expect(screen.getByText('AI 生成数据')).toBeTruthy()
  })

  it('shows save button with Save icon when not saving', () => {
    render(<WordEditFields {...defaultProps} isSaving={false} />)

    expect(screen.getByText('保存修改')).toBeTruthy()
  })
})
