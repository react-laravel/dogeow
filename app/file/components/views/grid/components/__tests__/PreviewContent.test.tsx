import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PreviewContent } from '../PreviewContent'

const defaults = { previewUrl: null, previewContent: null, previewFile: null, onDownload: vi.fn() }

describe('PreviewContent', () => {
  it('shows JSON text literally instead of hiding the preview', () => {
    const content = '{"message":"hello","html":"<script>alert(1)</script>"}'
    const { container } = render(
      <PreviewContent {...defaults} previewType="text" previewContent={content} />
    )
    expect(container.querySelector('pre')).toHaveTextContent(content)
    expect(container.querySelector('script')).toBeNull()
  })

  it('shows an explicit empty text state', () => {
    render(<PreviewContent {...defaults} previewType="text" previewContent="" />)
    expect(screen.getByText('文件内容为空')).toBeInTheDocument()
  })

  it('recovers after switching from a failed image to a different image', () => {
    const { rerender, container } = render(
      <PreviewContent
        {...defaults}
        previewType="image"
        previewUrl="https://example.com/first.png"
      />
    )
    fireEvent.error(container.querySelector('img')!)
    expect(screen.getByText('图片无法加载')).toBeInTheDocument()
    rerender(
      <PreviewContent
        {...defaults}
        previewType="image"
        previewUrl="https://example.com/second.png"
      />
    )
    expect(screen.queryByText('图片无法加载')).not.toBeInTheDocument()
    expect(container.querySelector('img')!).toHaveAttribute('src', 'https://example.com/second.png')
  })
})
