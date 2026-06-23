import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatInputImagePreview } from '../ChatInputImagePreview'

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

describe('ChatInputImagePreview', () => {
  it('returns null when no images', () => {
    const { container } = render(<ChatInputImagePreview images={[]} onRemoveImage={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders image previews', () => {
    render(
      <ChatInputImagePreview
        images={[
          { id: 'img-1', preview: 'blob:abc123' },
          { id: 'img-2', preview: 'blob:def456' },
        ]}
        onRemoveImage={vi.fn()}
      />
    )
    expect(screen.getByAltText('上传图片 1')).toBeInTheDocument()
    expect(screen.getByAltText('上传图片 2')).toBeInTheDocument()
  })

  it('shows loading spinner when uploading', () => {
    render(
      <ChatInputImagePreview
        images={[{ id: 'img-1', preview: 'blob:abc123', uploading: true }]}
        onRemoveImage={vi.fn()}
      />
    )
    expect(screen.getByAltText('上传图片 1')).toBeInTheDocument()
    // Loading overlay should be present - check for animate-spin class
    const container = screen.getByAltText('上传图片 1').closest('div')?.parentElement
    expect(container?.querySelector('.animate-spin')).toBeTruthy()
  })

  it('calls onRemoveImage when remove button is clicked', () => {
    const onRemoveImage = vi.fn()
    render(
      <ChatInputImagePreview
        images={[{ id: 'img-1', preview: 'blob:abc123' }]}
        onRemoveImage={onRemoveImage}
      />
    )

    const removeButton = screen.getByRole('button', { name: '移除图片' })
    removeButton.click()
    expect(onRemoveImage).toHaveBeenCalledWith(0)
  })

  it('does not crash when onRemoveImage is not provided', () => {
    render(<ChatInputImagePreview images={[{ id: 'img-1', preview: 'blob:abc123' }]} />)
    expect(screen.getByAltText('上传图片 1')).toBeInTheDocument()
  })
})
