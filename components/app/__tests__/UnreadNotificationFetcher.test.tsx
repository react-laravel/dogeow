import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import useAuthStore from '@/stores/authStore'
import { UnreadNotificationFetcher } from '../UnreadNotificationFetcher'

const mocks = vi.hoisted(() => ({
  message: vi.fn(),
  info: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    message: mocks.message,
    info: mocks.info,
  },
}))

vi.mock('@/lib/api', () => ({
  useUnreadNotifications: () => ({
    data: {
      count: 6,
      items: [{ data: { url: '/notifications' } }],
    },
  }),
}))

describe('UnreadNotificationFetcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    useAuthStore.setState({ isAuthenticated: true })
  })

  it('uses the neutral surface and project primary color instead of the blue info palette', async () => {
    render(<UnreadNotificationFetcher />)

    await waitFor(() => expect(mocks.message).toHaveBeenCalledTimes(1))

    const [title, options] = mocks.message.mock.calls[0]
    expect(title).toBe('你有 6 条未读消息')
    expect(options.style).toMatchObject({
      background: 'var(--popover)',
      borderColor: 'var(--border)',
      color: 'var(--popover-foreground)',
    })
    expect(options.actionButtonStyle).toMatchObject({
      background: 'var(--primary)',
      color: 'var(--primary-foreground)',
    })
    expect(options.icon.props.style.color).toBe('var(--primary)')
    expect(mocks.info).not.toHaveBeenCalled()
  })
})
