import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GenerationModal } from '../GenerationModal'

describe('GenerationModal', () => {
  const defaultProps = {
    open: true,
    type: 'image' as const,
    prompt: '',
    onPromptChange: vi.fn(),
    lyrics: '',
    onLyricsChange: vi.fn(),
    onSubmit: vi.fn(),
    onClose: vi.fn(),
    isLoading: false,
  }

  it('returns null when type is null', () => {
    const { container } = render(<GenerationModal {...defaultProps} type={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders image generation modal', () => {
    render(<GenerationModal {...defaultProps} type="image" />)
    expect(screen.getByText('生成图片')).toBeInTheDocument()
    expect(screen.getByLabelText('图片描述')).toBeInTheDocument()
  })

  it('renders video generation modal', () => {
    render(<GenerationModal {...defaultProps} type="video" />)
    expect(screen.getByText('生成视频')).toBeInTheDocument()
    expect(screen.getByLabelText('视频描述')).toBeInTheDocument()
  })

  it('renders music generation modal with lyrics field', () => {
    render(<GenerationModal {...defaultProps} type="music" />)
    expect(screen.getByText('生成音乐')).toBeInTheDocument()
    expect(screen.getByLabelText('音乐描述')).toBeInTheDocument()
    expect(screen.getByLabelText('歌词')).toBeInTheDocument()
  })

  it('calls onPromptChange when typing', () => {
    const onPromptChange = vi.fn()
    render(<GenerationModal {...defaultProps} onPromptChange={onPromptChange} />)

    const textarea = screen.getByLabelText('图片描述')
    fireEvent.change(textarea, { target: { value: 'a cat' } })
    expect(onPromptChange).toHaveBeenCalledWith('a cat')
  })

  it('calls onSubmit when generate button is clicked', () => {
    const onSubmit = vi.fn()
    render(<GenerationModal {...defaultProps} prompt="a cat" onSubmit={onSubmit} />)

    const generateButton = screen.getByRole('button', { name: '生成' })
    fireEvent.click(generateButton)
    expect(onSubmit).toHaveBeenCalled()
  })

  it('does not call onSubmit when prompt is empty', () => {
    const onSubmit = vi.fn()
    render(<GenerationModal {...defaultProps} prompt="" onSubmit={onSubmit} />)

    const generateButton = screen.getByRole('button', { name: '生成' })
    expect(generateButton).toBeDisabled()
  })

  it('allows music submission without lyrics', () => {
    const onSubmit = vi.fn()
    render(<GenerationModal {...defaultProps} type="music" prompt="jazz" onSubmit={onSubmit} />)

    const generateButton = screen.getByRole('button', { name: '生成' })
    expect(generateButton).not.toBeDisabled()
  })

  it('allows music submission with lyrics', () => {
    const onSubmit = vi.fn()
    render(
      <GenerationModal
        {...defaultProps}
        type="music"
        prompt="jazz"
        lyrics="la la la"
        onSubmit={onSubmit}
      />
    )

    const generateButton = screen.getByRole('button', { name: '生成' })
    expect(generateButton).not.toBeDisabled()
  })

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn()
    render(<GenerationModal {...defaultProps} onClose={onClose} />)

    const cancelButton = screen.getByRole('button', { name: '取消' })
    fireEvent.click(cancelButton)
    expect(onClose).toHaveBeenCalled()
  })

  it('shows error message when provided', () => {
    render(<GenerationModal {...defaultProps} error="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('shows loading message when generating video', () => {
    render(<GenerationModal {...defaultProps} type="video" isLoading={true} />)
    expect(screen.getByText(/视频生成中/)).toBeInTheDocument()
  })

  it('shows generic loading message for other types', () => {
    render(<GenerationModal {...defaultProps} type="image" isLoading={true} />)
    expect(screen.getByText('生成中...')).toBeInTheDocument()
  })

  it('disables textarea when loading', () => {
    render(<GenerationModal {...defaultProps} isLoading={true} />)
    expect(screen.getByLabelText('图片描述')).toBeDisabled()
  })
})
