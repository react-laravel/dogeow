import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted to create mock functions before module loading
const { mockReadPersistedAuthToken, mockRemoveLegacyAuthToken } = vi.hoisted(() => ({
  mockReadPersistedAuthToken: vi.fn(),
  mockRemoveLegacyAuthToken: vi.fn(),
}))

// Mock the authStorage module
vi.mock('../authStorage', () => ({
  readPersistedAuthToken: mockReadPersistedAuthToken,
  removeLegacyAuthToken: mockRemoveLegacyAuthToken,
  AUTH_STORAGE_KEY: 'auth-storage',
  LEGACY_AUTH_TOKEN_KEY: 'auth-token',
}))

import { getAuthTokenFromStorage } from '../storage'

describe('storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-expect-error - clearing for test
    global.window = undefined
  })

  describe('getAuthTokenFromStorage', () => {
    it('should return null in server environment (no window)', () => {
      global.window = undefined
      const result = getAuthTokenFromStorage()
      expect(result).toBeNull()
      expect(mockReadPersistedAuthToken).not.toHaveBeenCalled()
    })

    it('should return token from localStorage via readPersistedAuthToken', () => {
      const mockStorage = {} as Storage
      global.window = {
        localStorage: mockStorage,
      } as Window

      mockReadPersistedAuthToken.mockReturnValue('test-token')

      const result = getAuthTokenFromStorage()
      expect(result).toBe('test-token')
      expect(mockReadPersistedAuthToken).toHaveBeenCalledTimes(1)
      expect(mockReadPersistedAuthToken).toHaveBeenCalledWith(mockStorage)
    })

    it('should return null when readPersistedAuthToken returns null', () => {
      const mockStorage = {} as Storage
      global.window = {
        localStorage: mockStorage,
      } as Window

      mockReadPersistedAuthToken.mockReturnValue(null)

      const result = getAuthTokenFromStorage()
      expect(result).toBeNull()
      expect(mockReadPersistedAuthToken).toHaveBeenCalledTimes(1)
    })

    it('should catch errors from readPersistedAuthToken and return null', () => {
      global.window = {
        localStorage: {},
      } as Window

      mockReadPersistedAuthToken.mockImplementation(() => {
        throw new Error('localStorage access denied')
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = getAuthTokenFromStorage()
      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to read auth token from storage:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })
})
