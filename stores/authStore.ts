import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, AuthResponse } from '../app'
import { ApiRequestError, apiRequest, get as apiGet, post } from '@/lib/api'
import { redirectTo } from '@/lib/auth/redirect'

// 常量定义
const AUTH_TOKEN_KEY = 'auth-token'
const STORAGE_KEY = 'auth-storage'

interface AuthState {
  readonly user: User | null
  readonly token: string | null
  readonly loading: boolean
  readonly isAuthenticated: boolean

  // 操作方法
  setLoading: (loading: boolean) => void
  login: (email: string, password: string) => Promise<AuthResponse>
  loginWithGithub: () => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => Promise<AuthResponse>
  restoreSession: () => Promise<User | null>
  logout: () => Promise<void>
  clearAuthState: () => Promise<void>
  setUser: (user: User | null) => void
  setToken: (token: string | null) => Promise<void>
  getToken: () => string | null
}

type UserPayload = User | { user?: User }

// WebSocket 认证管理器同步
const syncWithWebSocketAuth = async (token: string | null): Promise<void> => {
  if (typeof window === 'undefined') return

  try {
    const { getAuthManager } = await import('@/lib/websocket/auth')
    const authManager = getAuthManager()

    if (token) {
      authManager.setToken(token)
    } else {
      authManager.removeToken()
    }
  } catch (error) {
    console.warn('与WebSocket认证管理器同步失败:', error)
  }
}

// 安全的本地存储封装（兼容无痕/隐私模式）
const createMemoryStorage = () => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
}

const memoryStorage = createMemoryStorage()

const normalizeToken = (token: string | null | undefined): string | null =>
  typeof token === 'string' && token.trim().length > 0 ? token : null

const persistLegacyToken = (token: string | null): void => {
  if (typeof window === 'undefined') return

  const storage = getSafeStorage()
  if (token) {
    storage.setItem(AUTH_TOKEN_KEY, token)
  } else {
    storage.removeItem(AUTH_TOKEN_KEY)
  }
}

const isWrappedUserPayload = (payload: UserPayload): payload is { user?: User } =>
  !('id' in payload && 'name' in payload && 'email' in payload)

const resolveUserPayload = (payload: UserPayload): User | null => {
  if (isWrappedUserPayload(payload)) {
    return payload.user ?? null
  }

  return payload
}

const getSafeStorage = () => {
  if (typeof window === 'undefined') return memoryStorage

  try {
    const storage = window.localStorage
    const testKey = '__storage_test__'
    storage.setItem(testKey, '1')
    storage.removeItem(testKey)
    return storage
  } catch (error) {
    console.warn('本地存储不可用，已降级到内存存储:', error)
    return memoryStorage
  }
}

// 创建持久化的认证存储
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: true, // 初始化时设置为true，等待从localStorage恢复状态
      isAuthenticated: false,

      setLoading: loading => set({ loading }),

      setUser: user =>
        set(state => ({
          user,
          isAuthenticated: Boolean(user || state.token),
        })),

      setToken: async (token: string | null) => {
        const normalizedToken = normalizeToken(token)
        set(state => ({
          token: normalizedToken,
          isAuthenticated: Boolean(state.user || normalizedToken),
        }))
        persistLegacyToken(normalizedToken)
        await syncWithWebSocketAuth(normalizedToken)
      },

      getToken: () => get().token,

      clearAuthState: async () => {
        set({
          user: null,
          token: null,
          loading: false,
          isAuthenticated: false,
        })
        persistLegacyToken(null)
        await syncWithWebSocketAuth(null)
      },

      login: async (email: string, password: string) => {
        set({ loading: true })

        try {
          const data = await apiRequest<AuthResponse>(
            '/login',
            'POST',
            { email, password },
            {
              handleError: false,
              suppressUnauthorizedRedirect: true,
              includeAuthToken: false,
            }
          )
          const normalizedToken = normalizeToken(data.token)

          // 更新状态
          set({
            user: data.user,
            token: normalizedToken,
            loading: false,
            isAuthenticated: Boolean(data.user || normalizedToken),
          })

          persistLegacyToken(normalizedToken)

          // 同步到 WebSocket
          await syncWithWebSocketAuth(normalizedToken)

          return data
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      loginWithGithub: async () => {
        set({ loading: true })

        try {
          // 获取 GitHub 授权 URL
          const data = await apiGet<{ url: string }>('/auth/github')
          if (!data?.url) {
            throw new Error('未获取到 GitHub 授权 URL')
          }
          redirectTo(data.url)
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      register: async (
        name: string,
        email: string,
        password: string,
        passwordConfirmation: string
      ) => {
        set({ loading: true })

        try {
          const data = await apiRequest<AuthResponse>(
            '/register',
            'POST',
            {
              name,
              email,
              password,
              password_confirmation: passwordConfirmation,
            },
            {
              handleError: false,
              suppressUnauthorizedRedirect: true,
              includeAuthToken: false,
            }
          )
          const normalizedToken = normalizeToken(data.token)

          // 更新状态
          set({
            user: data.user,
            token: normalizedToken,
            loading: false,
            isAuthenticated: Boolean(data.user || normalizedToken),
          })

          persistLegacyToken(normalizedToken)

          // 同步到 WebSocket
          await syncWithWebSocketAuth(normalizedToken)

          return data
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      restoreSession: async () => {
        set({ loading: true })

        const fetchCurrentUser = async (includeAuthToken: boolean) => {
          const payload = await apiRequest<UserPayload>('/user', 'GET', undefined, {
            handleError: false,
            suppressUnauthorizedRedirect: true,
            includeAuthToken,
          })

          return resolveUserPayload(payload)
        }

        try {
          let currentUser: User | null = null

          try {
            currentUser = await fetchCurrentUser(false)
          } catch (error) {
            if (!(error instanceof ApiRequestError) || error.status !== 401 || !get().token) {
              throw error
            }

            currentUser = await fetchCurrentUser(true)
          }

          if (!currentUser) {
            throw new Error('未获取到当前用户')
          }

          set(state => ({
            user: currentUser,
            loading: false,
            isAuthenticated: Boolean(currentUser || state.token),
          }))

          return currentUser
        } catch (error) {
          if (error instanceof ApiRequestError && error.status === 401) {
            await get().clearAuthState()
            return null
          }

          set({ loading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await apiRequest(
            '/logout',
            'POST',
            {},
            {
              handleError: false,
              suppressUnauthorizedRedirect: true,
              includeAuthToken: false,
            }
          )
        } catch (error) {
          if (!(error instanceof ApiRequestError) || error.status !== 401 || !get().token) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('登出请求失败，继续清理本地状态:', error)
            }
          } else {
            try {
              await apiRequest(
                '/logout',
                'POST',
                {},
                {
                  handleError: false,
                  suppressUnauthorizedRedirect: true,
                }
              )
            } catch (retryError) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('Bearer 登出重试失败，继续清理本地状态:', retryError)
              }
            }
          }
        } finally {
          await get().clearAuthState()
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => getSafeStorage()),
      partialize: state => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => state => {
        if (!state || typeof window === 'undefined') {
          return
        }

        const hasPersistedAuth = Boolean(state.user || state.token)
        const hasSessionCookie = document.cookie.includes('laravel_session=')

        if (!hasPersistedAuth && !hasSessionCookie) {
          useAuthStore.getState().setLoading(false)
          return
        }

        setTimeout(() => {
          void useAuthStore
            .getState()
            .restoreSession()
            .catch(error => {
              if (process.env.NODE_ENV === 'development') {
                console.warn('恢复登录态失败:', error)
              }
              useAuthStore.getState().setLoading(false)
            })
        }, 0)
      },
    }
  )
)

// 初始化认证状态
const initializeAuth = async (): Promise<void> => {
  if (typeof window === 'undefined') return

  const { setToken, setLoading } = useAuthStore.getState()

  try {
    const token = getSafeStorage().getItem(AUTH_TOKEN_KEY)
    if (token) {
      await setToken(token)
    }
  } catch (error) {
    console.warn('初始化认证状态失败:', error)
  } finally {
    setLoading(false)
  }
}

// 延迟初始化避免阻塞
if (typeof window !== 'undefined') {
  setTimeout(initializeAuth, 0)
}

export default useAuthStore
