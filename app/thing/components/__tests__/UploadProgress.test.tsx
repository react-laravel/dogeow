import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UploadProgress, UploadProgressList } from '../UploadProgress'

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/lib/helpers', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

describe('UploadProgress', () => {
  const defaultProps = {
    fileName: 'test.jpg',
    percent: 50,
    isUploading: true,
    hasError: false,
    onCancel: vi.fn(),
  }

  it('renders file name', () => {
    render(<UploadProgress {...defaultProps} />)
    expect(screen.getByText('test.jpg')).toBeDefined()
  })

  it('renders percent', () => {
    render(<UploadProgress {...defaultProps} />)
    expect(screen.getByText('50%')).toBeDefined()
  })

  it('shows cancel button when uploading', () => {
    render(<UploadProgress {...defaultProps} />)
    expect(screen.getByLabelText('Cancel upload')).toBeDefined()
  })

  it('hides cancel button when not uploading', () => {
    render(<UploadProgress {...defaultProps} isUploading={false} />)
    expect(screen.queryByLabelText('Cancel upload')).toBeNull()
  })

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn()
    render(<UploadProgress {...defaultProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByLabelText('Cancel upload'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows error message when hasError', () => {
    render(<UploadProgress {...defaultProps} hasError />)
    expect(screen.getByText('Upload failed. Please try again.')).toBeDefined()
  })

  it('shows check icon when complete', () => {
    render(<UploadProgress {...defaultProps} isUploading={false} hasError={false} percent={100} />)
    expect(screen.getByLabelText('Upload complete')).toBeDefined()
  })
})

describe('UploadProgressList', () => {
  it('returns null when no items', () => {
    const { container } = render(<UploadProgressList items={[]} onCancel={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders multiple progress items', () => {
    const items = [
      { id: '1', fileName: 'a.jpg', percent: 50, isUploading: true, hasError: false },
      { id: '2', fileName: 'b.jpg', percent: 80, isUploading: true, hasError: false },
    ]
    render(<UploadProgressList items={items} onCancel={vi.fn()} />)
    expect(screen.getByText('a.jpg')).toBeDefined()
    expect(screen.getByText('b.jpg')).toBeDefined()
  })
})
