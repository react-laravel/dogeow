import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CreateTagDialog from '../../CreateTagDialog'

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) =>
    open ? <div data-open={String(open)}>{children}</div> : null,
  DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

vi.mock('@/lib/helpers/colorUtils', () => ({
  generateRandomColor: () => '#3b82f6',
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('CreateTagDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onTagCreated: vi.fn(),
  }

  it('renders dialog title when open', () => {
    render(<CreateTagDialog {...defaultProps} />)
    expect(screen.getByText('创建新标签')).toBeDefined()
  })

  it('does not render when closed', () => {
    render(<CreateTagDialog {...defaultProps} open={false} />)
    expect(screen.queryByText('创建新标签')).toBeNull()
  })

  it('renders name input', () => {
    render(<CreateTagDialog {...defaultProps} />)
    expect(screen.getByPlaceholderText('输入标签名称')).toBeDefined()
  })

  it('calls onOpenChange(false) when cancel clicked', () => {
    const onOpenChange = vi.fn()
    render(<CreateTagDialog {...defaultProps} onOpenChange={onOpenChange} />)
    fireEvent.click(screen.getByText('取消'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
