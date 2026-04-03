const AUTH_STORAGE_KEY = 'auth-storage'
const AUTH_TOKEN_KEY = 'auth-token'

interface PersistedAuthState {
  state?: {
    token?: unknown
  }
}

export function getAuthTokenFromStorage(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const persistedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (persistedAuth) {
      const parsed = JSON.parse(persistedAuth) as PersistedAuthState
      if (typeof parsed.state?.token === 'string' && parsed.state.token.length > 0) {
        return parsed.state.token
      }
    }

    const legacyToken = window.localStorage.getItem(AUTH_TOKEN_KEY)
    if (typeof legacyToken === 'string' && legacyToken.length > 0) {
      return legacyToken
    }
  } catch (error) {
    logger.warn('Failed to read auth token from storage:', error)
  }

  return null
}
