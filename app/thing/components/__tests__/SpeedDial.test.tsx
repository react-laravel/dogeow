import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ThingSpeedDial, { SpeedDial } from '../SpeedDial'

const { mockUseRouter } = vi.hoisted(() => ({
  mockUseRouter: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: mockUseRouter,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

describe('SpeedDial', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({ push: vi.fn() })
  })

  it('renders plus icon by default', () => {
    render(<SpeedDial />)
    expect(screen.getByRole('button')).toBeDefined()
  })

  it('calls router.push with default href', () => {
    const push = vi.fn()
    mockUseRouter.mockReturnValueOnce({ push })
    render(<SpeedDial />)
    fireEvent.click(screen.getByRole('button'))
    expect(push).toHaveBeenCalledWith('/thing/add')
  })

  it('calls onClick when provided', () => {
    const onClick = vi.fn()
    render(<SpeedDial onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })

  it('does not call router.push when onClick provided', () => {
    const push = vi.fn()
    const onClick = vi.fn()
    mockUseRouter.mockReturnValueOnce({ push })
    render(<SpeedDial onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(push).not.toHaveBeenCalled()
    expect(onClick).toHaveBeenCalled()
  })

  it('uses custom href', () => {
    const push = vi.fn()
    mockUseRouter.mockReturnValueOnce({ push })
    render(<SpeedDial href="/custom/path" />)
    fireEvent.click(screen.getByRole('button'))
    expect(push).toHaveBeenCalledWith('/custom/path')
  })
})

describe('ThingSpeedDial', () => {
  it('renders default speed dial', () => {
    render(<ThingSpeedDial />)
    expect(screen.getByRole('button')).toBeDefined()
  })
})
