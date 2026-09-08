import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserButton } from '../UserButton'

const { authState } = vi.hoisted(() => ({
  authState: {
    user: { id: 1, name: 'Admin', email: 'admin@example.com' },
    logout: vi.fn(),
  },
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onClick,
    prefetch: _prefetch,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean }) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  ),
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
  ChangePasswordDialog: ({
    open,
    onOpenChange,
  }: {
    open: boolean
    onOpenChange: (open: boolean) => void
  }) =>
    open ? (
      <div role="dialog" aria-label="修改密码">
        <button onClick={() => onOpenChange(false)}>取消修改</button>
      </div>
    ) : null,
}))

describe('UserButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.logout.mockReset().mockResolvedValue(undefined)
  })
  it('shows a clear expanded state and account context', async () => {
    const user = userEvent.setup()
    render(<UserButton isAuthenticated onToggleAuth={vi.fn()} />)

    const trigger = screen.getByRole('button', { name: '打开用户菜单' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu', { name: '账户操作' })).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
  })

  it('links 进入仪表盘 to /dashboard', async () => {
    const user = userEvent.setup()
    render(<UserButton isAuthenticated onToggleAuth={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '打开用户菜单' }))

    const dashboardLink = screen.getByRole('menuitem', { name: /进入仪表盘/ })
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
  })
  it('closes on Escape and returns keyboard focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<UserButton isAuthenticated onToggleAuth={vi.fn()} />)
    const trigger = screen.getByRole('button', { name: '打开用户菜单' })
    trigger.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('menu', { name: '账户操作' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
  it('opens password settings from the menu', async () => {
    const user = userEvent.setup()
    render(<UserButton isAuthenticated onToggleAuth={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '打开用户菜单' }))
    await user.click(screen.getByRole('menuitem', { name: '修改密码' }))
    expect(screen.getByRole('dialog', { name: '修改密码' })).toBeInTheDocument()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(authState.logout).not.toHaveBeenCalled()
  })
  it('keeps logout behind a confirmation and cancellation does not log out', async () => {
    const user = userEvent.setup()
    render(<UserButton isAuthenticated onToggleAuth={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '打开用户菜单' }))
    await user.click(screen.getByRole('menuitem', { name: '退出登录' }))
    expect(screen.getByRole('alertdialog', { name: '退出登录？' })).toBeInTheDocument()
    expect(authState.logout).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(authState.logout).not.toHaveBeenCalled()
  })
  it('keeps a failed logout retryable and prevents duplicate submissions', async () => {
    const user = userEvent.setup()
    authState.logout.mockRejectedValueOnce(new Error('offline'))
    render(<UserButton isAuthenticated onToggleAuth={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '打开用户菜单' }))
    await user.click(screen.getByRole('menuitem', { name: '退出登录' }))
    await user.click(screen.getByRole('button', { name: '确认退出' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(authState.logout).toHaveBeenCalledTimes(1)
    let finish!: () => void
    authState.logout.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          finish = resolve
        })
    )
    await user.click(screen.getByRole('button', { name: '确认退出' }))
    fireEvent.click(screen.getByRole('button', { name: '退出中…' }))
    expect(authState.logout).toHaveBeenCalledTimes(2)
    finish()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })
  it('uses the existing login action when signed out', async () => {
    const user = userEvent.setup()
    const onToggleAuth = vi.fn()
    render(<UserButton isAuthenticated={false} onToggleAuth={onToggleAuth} />)
    await user.click(screen.getByRole('button', { name: '登录' }))
    expect(onToggleAuth).toHaveBeenCalledTimes(1)
  })
})
