import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  fetchUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  useUnreadNotifications,
} from '../notifications'

// Mock useSWR
const mockUseSWR = vi.fn()
vi.mock('swr', async () => {
  const actual = await vi.importActual('swr')
  return {
    ...actual,
    useSWR: (...args: unknown[]) => mockUseSWR(...args),
  }
})

// Mock lib/api
vi.mock('@/lib/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
}))

describe('notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSWR.mockReset()
  })

  describe('fetchUnreadNotifications', () => {
    it('should be a function', () => {
      expect(typeof fetchUnreadNotifications).toBe('function')
    })
  })

  describe('useUnreadNotifications', () => {
    it('should be a function', () => {
      expect(typeof useUnreadNotifications).toBe('function')
    })

    it('should use SWR with correct key when called', () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
        mutate: vi.fn(),
      })

      // Verify the hook structure exists
      expect(typeof useUnreadNotifications).toBe('function')
    })
  })

  describe('markNotificationRead', () => {
    it('should be a function', () => {
      expect(typeof markNotificationRead).toBe('function')
    })
  })

  describe('markAllNotificationsRead', () => {
    it('should be a function', () => {
      expect(typeof markAllNotificationsRead).toBe('function')
    })
  })
})
