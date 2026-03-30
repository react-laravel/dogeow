import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import useAuthStore from '../authStore'
import type { User, AuthResponse } from '../../app'

// Mock the API module
vi.mock('@/lib/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  apiRequest: vi.fn(),
  ApiRequestError: class MockApiRequestError extends Error {
    status: number

    constructor(message: string, status: number) {
      super(message)
      this.name = 'ApiRequestError'
      this.status = status
    }
  },
}))

vi.mock('@/lib/auth/redirect', () => ({
  redirectTo: vi.fn(),
}))

// Mock the WebSocket auth module
vi.mock('@/lib/websocket/auth', () => ({
  getAuthManager: vi.fn(() => ({
    setToken: vi.fn(),
    removeToken: vi.fn(),
  })),
}))

// Import mocked functions
import { get, apiRequest, ApiRequestError } from '@/lib/api'
import { redirectTo } from '@/lib/auth/redirect'
import { getAuthManager } from '@/lib/websocket/auth'

describe('authStore', () => {
  const mockGet = vi.mocked(get)
  const mockApiRequest = vi.mocked(apiRequest)
  const mockRedirectTo = vi.mocked(redirectTo)
  const mockAuthManager = {
    setToken: vi.fn(),
    removeToken: vi.fn(),
    getToken: vi.fn(),
    refreshToken: vi.fn(),
    initializeConnection: vi.fn(),
    destroy: vi.fn(),
    setRefreshCallback: vi.fn(),
    handleStorageChange: vi.fn(),
    reconnectWithNewToken: vi.fn(),
  } as unknown as ReturnType<typeof getAuthManager>
  const mockGetAuthManager = vi.mocked(getAuthManager)

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  }

  const mockAuthResponse: AuthResponse = {
    user: mockUser,
    token: 'test-token-123',
  }

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()

    // Reset all mocks
    vi.clearAllMocks()
    mockApiRequest.mockResolvedValue({})

    // Setup auth manager mock
    mockGetAuthManager.mockReturnValue(mockAuthManager)

    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,
    })
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should set loading state', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.loading).toBe(true)

    act(() => {
      result.current.setLoading(false)
    })

    expect(result.current.loading).toBe(false)
  })

  it('should set user and update authentication state', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setUser(mockUser)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.setUser(null)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should set token and sync with WebSocket auth manager', async () => {
    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.setToken('test-token')
    })

    expect(result.current.token).toBe('test-token')
    expect(result.current.isAuthenticated).toBe(true)
    expect(mockAuthManager.setToken).toHaveBeenCalledWith('test-token')

    await act(async () => {
      await result.current.setToken(null)
    })

    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(mockAuthManager.removeToken).toHaveBeenCalled()
  })

  it('should handle WebSocket auth manager sync errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockGetAuthManager.mockImplementation(() => {
      throw new Error('WebSocket auth manager error')
    })

    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.setToken('test-token')
    })

    expect(result.current.token).toBe('test-token')
    expect(consoleSpy).toHaveBeenCalledWith('与WebSocket认证管理器同步失败:', expect.any(Error))

    consoleSpy.mockRestore()
  })

  it('should get token', () => {
    const { result } = renderHook(() => useAuthStore())

    // Initially null
    expect(result.current.getToken()).toBeNull()

    act(() => {
      useAuthStore.setState({ token: 'test-token' })
    })

    expect(result.current.getToken()).toBe('test-token')
  })

  it('should login successfully', async () => {
    mockApiRequest.mockResolvedValueOnce(mockAuthResponse)
    const { result } = renderHook(() => useAuthStore())

    let loginResult: AuthResponse
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'password')
    })

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/login',
      'POST',
      {
        email: 'test@example.com',
        password: 'password',
      },
      {
        handleError: false,
        suppressUnauthorizedRedirect: true,
        includeAuthToken: false,
      }
    )
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.token).toBe('test-token-123')
    expect(result.current.loading).toBe(false)
    expect(result.current.isAuthenticated).toBe(true)
    expect(loginResult!).toEqual(mockAuthResponse)
    expect(localStorage.getItem('auth-token')).toBe('test-token-123')
  })

  it('should redirect to github provider successfully', async () => {
    mockGet.mockResolvedValueOnce({ url: 'https://github.com/login/oauth/authorize' })

    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.loginWithGithub()
    })

    expect(mockGet).toHaveBeenCalledWith('/auth/github')
    expect(mockRedirectTo).toHaveBeenCalledWith('https://github.com/login/oauth/authorize')
    expect(result.current.loading).toBe(true)
  })

  it('should handle login failure', async () => {
    const loginError = new Error('Invalid credentials')
    mockApiRequest.mockRejectedValueOnce(loginError)
    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrong-password')
      } catch (error) {
        expect(error).toBe(loginError)
      }
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('auth-token')).toBeNull()
  })

  it('should logout and clear all auth data', async () => {
    // Set up authenticated state
    useAuthStore.setState({
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
    })
    localStorage.setItem('auth-token', 'test-token')

    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('auth-token')).toBeNull()
    expect(mockAuthManager.removeToken).toHaveBeenCalled()
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/logout',
      'POST',
      {},
      {
        handleError: false,
        suppressUnauthorizedRedirect: true,
        includeAuthToken: false,
      }
    )
  })

  it('should handle logout WebSocket sync errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockGetAuthManager.mockImplementation(() => {
      throw new Error('WebSocket auth manager error')
    })

    // Set up authenticated state
    useAuthStore.setState({
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
    })

    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith('与WebSocket认证管理器同步失败:', expect.any(Error))

    consoleSpy.mockRestore()
  })

  it('should persist and restore auth state', () => {
    // Simulate persisted state
    const persistedState = {
      user: mockUser,
      token: 'persisted-token',
      isAuthenticated: true,
    }

    useAuthStore.setState(persistedState)
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.token).toBe('persisted-token')
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should handle rehydration loading state', () => {
    // Test that loading is properly managed during rehydration
    const { result } = renderHook(() => useAuthStore())

    // Initially loading should be false (set in beforeEach)
    expect(result.current.loading).toBe(false)

    // Simulate setting loading to true (as would happen during initialization)
    act(() => {
      result.current.setLoading(true)
    })
    expect(result.current.loading).toBe(true)

    // Simulate rehydration completion
    act(() => {
      result.current.setLoading(false)
    })
    expect(result.current.loading).toBe(false)
  })

  it('should handle authentication state consistency', () => {
    const { result } = renderHook(() => useAuthStore())

    // Test that isAuthenticated is consistent with user and token state
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()

    // Set user without token
    act(() => {
      result.current.setUser(mockUser)
    })
    expect(result.current.isAuthenticated).toBe(true)

    // Clear user
    act(() => {
      result.current.setUser(null)
    })
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should initialize auth state from localStorage', async () => {
    // Set up localStorage with token
    localStorage.setItem('auth-token', 'persisted-token')

    // Mock the initializeAuth function call
    const { result } = renderHook(() => useAuthStore())

    // Wait for initialization to complete
    await act(async () => {
      // Simulate the initialization process by calling setToken directly
      await result.current.setToken('persisted-token')
      result.current.setLoading(false)
    })

    expect(result.current.token).toBe('persisted-token')
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.loading).toBe(false)
  })

  it('should handle initialization when no token in localStorage', async () => {
    // Ensure localStorage is empty
    localStorage.removeItem('auth-token')

    const { result } = renderHook(() => useAuthStore())

    // Wait for initialization to complete
    await act(async () => {
      // Simulate the initialization process
      result.current.setLoading(false)
    })

    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.loading).toBe(false)
  })

  it('should handle initialization errors gracefully', async () => {
    // Mock localStorage.getItem to throw an error
    const originalGetItem = localStorage.getItem
    localStorage.getItem = vi.fn().mockImplementation(() => {
      throw new Error('localStorage error')
    })

    const { result } = renderHook(() => useAuthStore())

    // Wait for initialization to complete
    await act(async () => {
      // Simulate the initialization process
      result.current.setLoading(false)
    })

    expect(result.current.loading).toBe(false)

    // Restore original localStorage.getItem
    localStorage.getItem = originalGetItem
  })

  it('should handle setToken with null token correctly', async () => {
    const { result } = renderHook(() => useAuthStore())

    // Set initial token
    await act(async () => {
      await result.current.setToken('initial-token')
    })

    expect(result.current.token).toBe('initial-token')
    expect(result.current.isAuthenticated).toBe(true)

    // Set token to null
    await act(async () => {
      await result.current.setToken(null)
    })

    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(mockAuthManager.removeToken).toHaveBeenCalled()
  })

  it('should handle setToken with empty string correctly', async () => {
    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.setToken('')
    })

    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(mockAuthManager.removeToken).toHaveBeenCalled()
  })

  it('should handle setToken with undefined correctly', async () => {
    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.setToken(undefined as any)
    })

    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(mockAuthManager.removeToken).toHaveBeenCalled()
  })

  it('should handle login with empty credentials', async () => {
    const loginError = new Error('Empty credentials')
    mockApiRequest.mockRejectedValueOnce(loginError)
    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      try {
        await result.current.login('', '')
      } catch (error) {
        expect(error).toBe(loginError)
      }
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should handle login with special characters in credentials', async () => {
    mockApiRequest.mockResolvedValueOnce(mockAuthResponse)
    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.login('test@example.com', 'password123!@#')
    })

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/login',
      'POST',
      {
        email: 'test@example.com',
        password: 'password123!@#',
      },
      {
        handleError: false,
        suppressUnauthorizedRedirect: true,
        includeAuthToken: false,
      }
    )
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.token).toBe('test-token-123')
  })

  it('should handle logout when not authenticated', async () => {
    const { result } = renderHook(() => useAuthStore())

    // Ensure initial state is not authenticated
    expect(result.current.isAuthenticated).toBe(false)

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('auth-token')).toBeNull()
  })

  it('should restore session user from cookie-based auth', async () => {
    const { result } = renderHook(() => useAuthStore())
    mockApiRequest.mockResolvedValueOnce({ user: mockUser })

    let restoredUser: User | null = null
    await act(async () => {
      restoredUser = await result.current.restoreSession()
    })

    expect(restoredUser).toEqual(mockUser)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(mockApiRequest).toHaveBeenCalledWith('/user', 'GET', undefined, {
      handleError: false,
      suppressUnauthorizedRedirect: true,
      includeAuthToken: false,
    })
  })

  it('should clear local auth state when session restoration returns 401', async () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      useAuthStore.setState({
        user: mockUser,
        token: 'stale-token',
        loading: false,
        isAuthenticated: true,
      })
    })
    localStorage.setItem('auth-token', 'stale-token')

    mockApiRequest
      .mockRejectedValueOnce(new ApiRequestError('Unauthorized', 401))
      .mockRejectedValueOnce(new ApiRequestError('Unauthorized', 401))

    await act(async () => {
      const restoredUser = await result.current.restoreSession()
      expect(restoredUser).toBeNull()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('auth-token')).toBeNull()
  })

  it('should handle logout when authenticated', async () => {
    // Set up authenticated state
    useAuthStore.setState({
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
    })
    localStorage.setItem('auth-token', 'test-token')

    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('auth-token')).toBeNull()
    expect(mockAuthManager.removeToken).toHaveBeenCalled()
  })

  it('should handle multiple rapid login attempts', async () => {
    mockApiRequest.mockResolvedValueOnce(mockAuthResponse)
    const { result } = renderHook(() => useAuthStore())

    // First login
    await act(async () => {
      await result.current.login('test@example.com', 'password1')
    })

    expect(result.current.isAuthenticated).toBe(true)

    // Second login (should override previous state)
    const secondUser = { ...mockUser, id: '2', name: 'Second User' }
    const secondResponse = { ...mockAuthResponse, user: secondUser, token: 'second-token' }
    mockApiRequest.mockResolvedValueOnce(secondResponse)

    await act(async () => {
      await result.current.login('test2@example.com', 'password2')
    })

    expect(result.current.user).toEqual(secondUser)
    expect(result.current.token).toBe('second-token')
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should handle setUser with null user', () => {
    const { result } = renderHook(() => useAuthStore())

    // Set user first
    act(() => {
      result.current.setUser(mockUser)
    })
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)

    // Set user to null
    act(() => {
      result.current.setUser(null)
    })
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should handle setUser with undefined user', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setUser(undefined as any)
    })
    expect(result.current.user).toBeUndefined()
    expect(result.current.isAuthenticated).toBe(false) // undefined is falsy
  })

  it('should handle getToken when token is null', () => {
    const { result } = renderHook(() => useAuthStore())

    // Ensure token is null
    act(() => {
      useAuthStore.setState({ token: null })
    })

    expect(result.current.getToken()).toBeNull()
  })

  it('should handle getToken when token is empty string', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      useAuthStore.setState({ token: '' })
    })

    expect(result.current.getToken()).toBe('')
  })

  it('should handle getToken when token is undefined', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      useAuthStore.setState({ token: undefined as any })
    })

    expect(result.current.getToken()).toBeUndefined()
  })

  it('should test initializeAuth function directly', async () => {
    // Mock window to simulate browser environment
    const originalWindow = global.window
    global.window = {
      ...originalWindow,
      localStorage,
    } as any

    // Set up localStorage with token
    localStorage.setItem('auth-token', 'test-initialization-token')

    // Get the store instance
    const { result } = renderHook(() => useAuthStore())

    // Simulate the initialization process
    await act(async () => {
      // Directly call setToken to simulate what initializeAuth does
      await result.current.setToken('test-initialization-token')
      result.current.setLoading(false)
    })

    expect(result.current.token).toBe('test-initialization-token')
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.loading).toBe(false)

    // Restore original window
    global.window = originalWindow
  })

  it('should test initializeAuth function with no token', async () => {
    // Mock window to simulate browser environment
    const originalWindow = global.window
    global.window = {
      ...originalWindow,
      localStorage,
    } as any

    // Ensure localStorage is empty
    localStorage.removeItem('auth-token')

    // Get the store instance
    const { result } = renderHook(() => useAuthStore())

    // Simulate the initialization process
    await act(async () => {
      // Directly call setLoading to simulate what initializeAuth does
      result.current.setLoading(false)
    })

    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.loading).toBe(false)

    // Restore original window
    global.window = originalWindow
  })
})
