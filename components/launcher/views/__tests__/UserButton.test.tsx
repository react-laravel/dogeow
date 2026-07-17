import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UserButton } from '../UserButton'

const { authState } = vi.hoisted(() => ({
  authState: {
    user: { id: 1, name: 'Admin', email: 'admin@example.com' },
    logout: vi.fn(),
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/stores/authStore', () => ({
  default: (selector: (state: typeof authState) => unknown) => selector(authState),
}))

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: () => '登录' }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../ChangePasswordDialog', () => ({
  ChangePasswordDialog: () => null,
}))

describe('UserButton', () => {
  it('shows a clear expanded state and account context', async () => {
    const user = userEvent.setup()
    render(<UserButton isAuthenticated onToggleAuth={vi.fn()} />)

    const trigger = screen.getByRole('button', { name: '打开用户菜单' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)

    expect(screen.getByRole('button', { name: '关闭用户菜单' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(screen.getByRole('menu', { name: '账户操作' })).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
  })
})
