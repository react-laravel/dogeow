import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoadingState from '../item-detail/LoadingState'

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/layout', () => ({
  PageContainer: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

describe('LoadingState', () => {
  it('renders loading text', () => {
    render(<LoadingState onBack={vi.fn()} />)
    expect(screen.getByText('加载中...')).toBeDefined()
  })

  it('renders back button', () => {
    render(<LoadingState onBack={vi.fn()} />)
    expect(screen.getByRole('button')).toBeDefined()
  })

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn()
    render(<LoadingState onBack={onBack} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onBack).toHaveBeenCalled()
  })
})
