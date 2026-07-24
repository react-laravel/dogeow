import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotificationDropdown } from '../NotificationDropdown'

const mocks = vi.hoisted(() => ({
  getNotificationPreferences: vi.fn(() => ({
    soundEnabled: true,
    quietHoursStart: 22,
    quietHoursEnd: 9,
  })),
  saveNotificationPreferences: vi.fn(() => true),
  syncPushNotificationPreferences: vi.fn(async () => undefined),
  mutate: vi.fn(),
  pushState: {
    permission: 'granted' as const,
    hasSubscription: true,
  },
  register: vi.fn(async () => true),
  unregister: vi.fn(async () => true),
  refreshState: vi.fn(async () => undefined),
}))

vi.mock('@/lib/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  useUnreadNotifications: () => ({
    data: { count: 0, items: [] },
    mutate: mocks.mutate,
  }),
}))

vi.mock('swr', () => ({
  default: () => ({
    data: { count: 0, items: [] },
    mutate: mocks.mutate,
  }),
}))

vi.mock('@/stores/authStore', () => ({
  default: (selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: true }),
}))

vi.mock('@/stores/pushSubscriptionStore', () => {
  const store = (selector: (state: typeof mocks.pushState) => unknown) => selector(mocks.pushState)

  return {
    default: Object.assign(store, {
      getState: () => mocks.pushState,
      setState: vi.fn(),
    }),
  }
})

vi.mock('@/hooks/usePushSubscription', () => ({
  isPushSupported: () => true,
  usePushSubscription: () => ({
    register: mocks.register,
    unregister: mocks.unregister,
    refreshState: mocks.refreshState,
    isSupported: true,
    status: 'idle',
    errorMessage: null,
  }),
}))

vi.mock('@/lib/push/notificationPreferences', () => ({
  getNotificationPreferences: mocks.getNotificationPreferences,
  saveNotificationPreferences: mocks.saveNotificationPreferences,
}))

vi.mock('@/lib/push/serviceWorker', () => ({
  syncPushNotificationPreferences: mocks.syncPushNotificationPreferences,
}))

describe('NotificationDropdown sound controls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.saveNotificationPreferences.mockReturnValue(true)
    mocks.syncPushNotificationPreferences.mockReset()
    mocks.syncPushNotificationPreferences.mockResolvedValue(undefined)
    mocks.getNotificationPreferences.mockReturnValue({
      soundEnabled: true,
      quietHoursStart: 22,
      quietHoursEnd: 9,
    })
    mocks.pushState.hasSubscription = true
  })

  it('keeps sound controls collapsed until requested', () => {
    render(<NotificationDropdown />)

    fireEvent.click(screen.getByRole('button', { name: '通知' }))

    expect(screen.getByText('声音开启 · 22:00–09:00 静音')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: '通知声音开关' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '展开声音与静音设置' }))

    expect(screen.getByText('通知声音')).toBeInTheDocument()
    expect(screen.getByText('按本设备设置')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '通知静音开始时间' })).toHaveTextContent('22:00')
    expect(screen.getByRole('button', { name: '通知静音结束时间' })).toHaveTextContent('09:00')
    expect(screen.getByRole('checkbox', { name: '通知声音开关' })).toBeChecked()
  })

  it('persists and synchronizes sound changes without disabling push', () => {
    render(<NotificationDropdown />)

    fireEvent.click(screen.getByRole('button', { name: '通知' }))
    fireEvent.click(screen.getByRole('button', { name: '展开声音与静音设置' }))
    fireEvent.click(screen.getByRole('checkbox', { name: '通知声音开关' }))

    const expectedPreferences = {
      soundEnabled: false,
      quietHoursStart: 22,
      quietHoursEnd: 9,
    }
    expect(mocks.saveNotificationPreferences).toHaveBeenCalledWith(expectedPreferences)
    expect(mocks.syncPushNotificationPreferences).toHaveBeenCalledWith(expectedPreferences)
    expect(mocks.unregister).not.toHaveBeenCalled()
  })

  it('allows a cross-midnight quiet period such as 23:00 to 08:00', () => {
    render(<NotificationDropdown />)

    fireEvent.click(screen.getByRole('button', { name: '通知' }))
    fireEvent.click(screen.getByRole('button', { name: '展开声音与静音设置' }))
    fireEvent.click(screen.getByRole('button', { name: '通知静音开始时间' }))
    fireEvent.click(screen.getByRole('button', { name: '23:00' }))
    fireEvent.click(screen.getByRole('button', { name: '通知静音结束时间' }))
    fireEvent.click(screen.getByRole('button', { name: '08:00' }))

    const expectedPreferences = {
      soundEnabled: true,
      quietHoursStart: 23,
      quietHoursEnd: 8,
    }
    expect(mocks.saveNotificationPreferences).toHaveBeenLastCalledWith(expectedPreferences)
    expect(mocks.syncPushNotificationPreferences).toHaveBeenLastCalledWith(expectedPreferences)
    expect(screen.getByRole('button', { name: '通知静音开始时间' })).toHaveTextContent('23:00')
  })

  it('keeps the notification panel open while selecting from the bottom sheet', () => {
    render(<NotificationDropdown />)
    fireEvent.click(screen.getByRole('button', { name: '通知' }))
    fireEvent.click(screen.getByRole('button', { name: '展开声音与静音设置' }))

    const sheetContent = document.createElement('div')
    const hourOption = document.createElement('button')
    sheetContent.dataset.slot = 'sheet-content'
    sheetContent.appendChild(hourOption)
    document.body.appendChild(sheetContent)

    fireEvent.mouseDown(hourOption)

    expect(screen.getByText('通知声音')).toBeInTheDocument()
    sheetContent.remove()
  })

  it('rolls back the displayed preference when service worker persistence fails', async () => {
    mocks.syncPushNotificationPreferences.mockRejectedValueOnce(new Error('cache failed'))
    render(<NotificationDropdown />)

    fireEvent.click(screen.getByRole('button', { name: '通知' }))
    fireEvent.click(screen.getByRole('button', { name: '展开声音与静音设置' }))
    fireEvent.click(screen.getByRole('checkbox', { name: '通知声音开关' }))

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: '通知声音开关' })).toBeChecked()
    })
    expect(mocks.saveNotificationPreferences).toHaveBeenLastCalledWith({
      soundEnabled: true,
      quietHoursStart: 22,
      quietHoursEnd: 9,
    })
  })

  it('does not apply a preference that browser storage cannot persist', () => {
    mocks.saveNotificationPreferences.mockReturnValue(false)
    render(<NotificationDropdown />)

    fireEvent.click(screen.getByRole('button', { name: '通知' }))
    fireEvent.click(screen.getByRole('button', { name: '展开声音与静音设置' }))
    fireEvent.click(screen.getByRole('checkbox', { name: '通知声音开关' }))

    expect(screen.getByRole('checkbox', { name: '通知声音开关' })).toBeChecked()
    expect(mocks.syncPushNotificationPreferences).not.toHaveBeenCalled()
  })

  it('rolls consecutive failures back to the last confirmed preferences', async () => {
    let rejectStartUpdate!: (error: Error) => void
    let rejectEndUpdate!: (error: Error) => void
    const startUpdate = new Promise<undefined>((_, reject) => {
      rejectStartUpdate = reject
    })
    const endUpdate = new Promise<undefined>((_, reject) => {
      rejectEndUpdate = reject
    })
    mocks.syncPushNotificationPreferences
      .mockReturnValueOnce(startUpdate)
      .mockReturnValueOnce(endUpdate)

    render(<NotificationDropdown />)
    fireEvent.click(screen.getByRole('button', { name: '通知' }))
    fireEvent.click(screen.getByRole('button', { name: '展开声音与静音设置' }))
    fireEvent.click(screen.getByRole('button', { name: '通知静音开始时间' }))
    fireEvent.click(screen.getByRole('button', { name: '23:00' }))
    fireEvent.click(screen.getByRole('button', { name: '通知静音结束时间' }))
    fireEvent.click(screen.getByRole('button', { name: '07:00' }))

    rejectStartUpdate(new Error('start failed'))
    rejectEndUpdate(new Error('end failed'))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '通知静音开始时间' })).toHaveTextContent('22:00')
      expect(screen.getByRole('button', { name: '通知静音结束时间' })).toHaveTextContent('09:00')
    })
    expect(mocks.saveNotificationPreferences).toHaveBeenLastCalledWith({
      soundEnabled: true,
      quietHoursStart: 22,
      quietHoursEnd: 9,
    })
  })
})
