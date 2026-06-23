import { describe, it, expect, vi } from 'vitest'
import {
  AUTH_STORAGE_KEY,
  LEGACY_AUTH_TOKEN_KEY,
  readPersistedAuthToken,
  removeLegacyAuthToken,
} from '../authStorage'

describe('authStorage', () => {
  describe('AUTH_STORAGE_KEY and LEGACY_AUTH_TOKEN_KEY', () => {
    it('should export the correct storage key constants', () => {
      expect(AUTH_STORAGE_KEY).toBe('auth-storage')
      expect(LEGACY_AUTH_TOKEN_KEY).toBe('auth-token')
    })
  })

  describe('readPersistedAuthToken', () => {
    it('should return token from new format storage', () => {
      const storage = {
        getItem: vi.fn((key: string) => {
          if (key === AUTH_STORAGE_KEY) {
            return JSON.stringify({ state: { token: 'new-token-123' } })
          }
          return null
        }),
        removeItem: vi.fn(),
      }

      const result = readPersistedAuthToken(storage)
      expect(result).toBe('new-token-123')
    })

    it('should return null when new format has no token', () => {
      const storage = {
        getItem: vi.fn((key: string) => {
          if (key === AUTH_STORAGE_KEY) {
            return JSON.stringify({ state: {} })
          }
          return null
        }),
        removeItem: vi.fn(),
      }

      const result = readPersistedAuthToken(storage)
      expect(result).toBeNull()
    })

    it('should return null when new format has non-string token', () => {
      const storage = {
        getItem: vi.fn((key: string) => {
          if (key === AUTH_STORAGE_KEY) {
            return JSON.stringify({ state: { token: 123 } })
          }
          return null
        }),
        removeItem: vi.fn(),
      }

      const result = readPersistedAuthToken(storage)
      expect(result).toBeNull()
    })

    it('should fall back to legacy token when new format is absent', () => {
      const storage = {
        getItem: vi.fn((key: string) => {
          if (key === AUTH_STORAGE_KEY) return null
          if (key === LEGACY_AUTH_TOKEN_KEY) return 'legacy-token-456'
          return null
        }),
        removeItem: vi.fn(),
      }

      const result = readPersistedAuthToken(storage)
      expect(result).toBe('legacy-token-456')
    })

    it('should return null when both formats are absent', () => {
      const storage = {
        getItem: vi.fn(() => null),
        removeItem: vi.fn(),
      }

      const result = readPersistedAuthToken(storage)
      expect(result).toBeNull()
    })

    it('should ignore malformed new format JSON', () => {
      const storage = {
        getItem: vi.fn((key: string) => {
          if (key === AUTH_STORAGE_KEY) return 'not-valid-json'
          if (key === LEGACY_AUTH_TOKEN_KEY) return 'legacy-token'
          return null
        }),
        removeItem: vi.fn(),
      }

      const result = readPersistedAuthToken(storage)
      // Should fall through to legacy token
      expect(result).toBe('legacy-token')
    })

    it('should ignore empty string token from new format', () => {
      const storage = {
        getItem: vi.fn((key: string) => {
          if (key === AUTH_STORAGE_KEY) {
            return JSON.stringify({ state: { token: '' } })
          }
          if (key === LEGACY_AUTH_TOKEN_KEY) return 'legacy-token'
          return null
        }),
        removeItem: vi.fn(),
      }

      const result = readPersistedAuthToken(storage)
      expect(result).toBe('legacy-token')
    })

    it('should not fall back to legacy when new format has valid token', () => {
      const storage = {
        getItem: vi.fn((key: string) => {
          if (key === AUTH_STORAGE_KEY) {
            return JSON.stringify({ state: { token: 'new-token' } })
          }
          if (key === LEGACY_AUTH_TOKEN_KEY) return 'legacy-token'
          return null
        }),
        removeItem: vi.fn(),
      }

      const result = readPersistedAuthToken(storage)
      expect(result).toBe('new-token')
    })
  })

  describe('removeLegacyAuthToken', () => {
    it('should call removeItem on storage with legacy key', () => {
      const removeItem = vi.fn()
      const storage = {
        getItem: vi.fn(() => null),
        removeItem,
      }

      removeLegacyAuthToken(storage)
      expect(removeItem).toHaveBeenCalledWith(LEGACY_AUTH_TOKEN_KEY)
    })

    it('should call removeItem exactly once', () => {
      const removeItem = vi.fn()
      const storage = {
        getItem: vi.fn(() => null),
        removeItem,
      }

      removeLegacyAuthToken(storage)
      expect(removeItem).toHaveBeenCalledTimes(1)
    })
  })
})
