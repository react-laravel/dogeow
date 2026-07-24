'use client'

import { mutate } from 'swr'
import useAuthStore from '../../stores/authStore'
import { getEchoInstance } from '@/lib/websocket'

import { API_URL } from './url'
import {
  createBrowserRequestHeaders,
  ensureCsrfCookie,
  executeBrowserRequestWithCsrf,
  getXsrfTokenFromCookie,
} from './browser-request'
import {
  ApiRequestError,
  type StandardApiResponse,
  unwrapApiPayload,
  handleApiError,
  validateAndNormalizeError,
} from './errors'
import type { ApiError } from '@/app'

export { ensureCsrfCookie }

/**
 * 处理响应
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
  // 处理401未授权
  if (response.status === 401) {
    void useAuthStore.getState().clearAuthState()
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
    throw new Error('登录已过期，请重新登录')
  }

  if (!response.ok) {
    let errorMessage = '请求失败'
    let errorData: ApiError | undefined

    try {
      errorData = (await response.json()) as ApiError
      errorMessage = errorData?.message || `请求失败 (${response.status})`

      // 记录错误详情
      if (errorData?.errors && Object.keys(errorData.errors).length > 0) {
        if (process.env.NODE_ENV !== 'production') {
          if (response.status === 422) {
            console.warn('验证失败:', errorData.errors)
          } else {
            console.error('API错误详情:', errorData.errors)
          }
        }
      }
    } catch {
      errorMessage = `请求失败: ${response.statusText || response.status}`
    }

    throw new ApiRequestError(errorMessage, response.status, errorData)
  }

  // 处理空响应
  const contentType = response.headers.get('content-type')
  if (response.status === 204 || !contentType?.includes('application/json')) {
    if (response.status === 204) {
      return {} as T
    }

    const text = await response.text()
    if (text) {
      return text as unknown as T
    }

    return {} as T
  }

  try {
    const payload = (await response.json()) as unknown
    return unwrapApiPayload<T>(payload)
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('解析JSON响应失败:', error)
    }
    throw new Error('解析响应失败')
  }
}

/**
 * 创建超时控制器
 */
const createTimeoutController = (isFormData: boolean) => {
  const controller = new AbortController()
  const timeoutDuration = isFormData ? 60000 : 30000

  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutDuration)

  return { controller, timeoutId, timeoutDuration }
}

/**
 * 通用API请求函数
 */
export async function apiRequest<T>(
  endpoint: string,
  method: string = 'GET',
  data?: unknown,
  options?: {
    handleError?: boolean
    suppressUnauthorizedRedirect?: boolean
    includeAuthToken?: boolean
  }
): Promise<T> {
  const {
    handleError = true,
    suppressUnauthorizedRedirect = false,
    includeAuthToken = true,
  } = options || {}
  const normalizedMethod = method.toUpperCase()

  // 构建URL
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
  const url = `${API_URL}/api/${normalizedEndpoint}`

  const isFormData = data instanceof FormData
  const token = includeAuthToken ? useAuthStore.getState().token : null

  const requestOptions: RequestInit = {
    method: normalizedMethod,
    credentials: 'include',
  }

  // 处理请求体
  if (
    data !== undefined &&
    data !== null &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(normalizedMethod)
  ) {
    requestOptions.body = isFormData ? data : JSON.stringify(data)
  }

  const executeRequest = async (): Promise<Response> => {
    const { controller, timeoutId, timeoutDuration } = createTimeoutController(isFormData)
    const echo = typeof window !== 'undefined' ? getEchoInstance() : null
    const socketId = typeof echo?.socketId === 'function' ? echo.socketId() : null

    requestOptions.signal = controller.signal
    requestOptions.headers = createBrowserRequestHeaders({
      method: normalizedMethod,
      token,
      isFormData,
      xsrfToken: getXsrfTokenFromCookie(),
      socketId,
    })

    // 创建超时Promise
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`请求超时 (${timeoutDuration / 1000}秒)`))
      }, timeoutDuration)
    })

    // 竞争获取响应
    const response = (await Promise.race([fetch(url, requestOptions), timeoutPromise])) as Response

    clearTimeout(timeoutId)

    return response
  }

  try {
    const response = await executeBrowserRequestWithCsrf(normalizedMethod, executeRequest)

    if (response.status === 401 && suppressUnauthorizedRedirect) {
      throw new ApiRequestError('登录已过期，请重新登录', 401)
    }

    return await handleResponse<T>(response)
  } catch (error) {
    // 标准化错误对象
    const normalizedError = validateAndNormalizeError(error)

    // 添加错误调试信息（仅在开发环境且错误不是标准Error实例时）
    if (process.env.NODE_ENV === 'development' && !(error instanceof Error)) {
      console.group('API Request Error Debug - Non-standard Error')
      console.error('Endpoint:', endpoint)
      console.error('Method:', method)
      console.error('Original error type:', typeof error)
      console.error('Original error value:', error)
      console.error('Normalized error:', normalizedError)
      console.error('Error instanceof Error:', error instanceof Error)
      console.error('Error instanceof ApiRequestError:', error instanceof ApiRequestError)
      console.error('Error instanceof DOMException:', error instanceof DOMException)
      console.groupEnd()
    }

    // 处理各种错误类型
    if (error instanceof DOMException && error.name === 'AbortError') {
      const timeoutError = new Error('请求超时，请重试')
      if (handleError) handleApiError(timeoutError)
      throw timeoutError
    }

    if (error instanceof Error && error.message === 'Failed to fetch') {
      const networkError = new Error('网络连接失败，请检查网络')
      if (handleError) handleApiError(networkError)
      throw networkError
    }

    if (error instanceof ApiRequestError) {
      if (handleError) handleApiError(error)
      throw error
    }

    // 处理标准化的错误，检查是否有特定的错误类型
    if (normalizedError.name === 'AbortError' || normalizedError.message.includes('请求被取消')) {
      const timeoutError = new Error('请求超时，请重试')
      if (handleError) handleApiError(timeoutError)
      throw timeoutError
    }

    if (
      normalizedError.message.includes('网络连接失败') ||
      normalizedError.message.includes('NetworkError')
    ) {
      const networkError = new Error('网络连接失败，请检查网络')
      if (handleError) handleApiError(networkError)
      throw networkError
    }

    // 使用标准化的错误
    if (handleError) {
      handleApiError(normalizedError)
    }

    throw normalizedError
  }
}

type ApiRequestOptions = {
  handleError?: boolean
  suppressUnauthorizedRedirect?: boolean
  includeAuthToken?: boolean
}

// HTTP方法包装器
export const apiGet = <T>(endpoint: string, options?: ApiRequestOptions): Promise<T> =>
  apiRequest<T>(endpoint, 'GET', undefined, options)

export const get = <T>(endpoint: string, options?: ApiRequestOptions): Promise<T> =>
  apiGet<T>(endpoint, options)

export const post = <T>(endpoint: string, data: unknown, options?: ApiRequestOptions): Promise<T> =>
  apiRequest<T>(endpoint, 'POST', data, options)

export const put = <T>(endpoint: string, data: unknown, options?: ApiRequestOptions): Promise<T> =>
  apiRequest<T>(endpoint, 'PUT', data, options)

export const del = <T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> =>
  apiRequest<T>(endpoint, 'DELETE', data, options)

export const patch = <T>(
  endpoint: string,
  data: unknown,
  options?: ApiRequestOptions
): Promise<T> => apiRequest<T>(endpoint, 'PATCH', data, options)

/** DELETE 请求并携带 body（用于 endpoint 等较长参数） */
export const delWithBody = <T>(
  endpoint: string,
  data: unknown,
  options?: ApiRequestOptions
): Promise<T> => apiRequest<T>(endpoint, 'DELETE', data, options)

export const uploadFile = <T>(
  endpoint: string,
  formData: FormData,
  options?: ApiRequestOptions
): Promise<T> => apiRequest<T>(endpoint, 'POST', formData, options)

// 创建变更函数
export const createMutation = <T>(
  endpoint: string,
  method: string = 'POST',
  options?: ApiRequestOptions
) => {
  const baseSegment = endpoint.split('/').filter(Boolean)[0]

  return async (data: unknown): Promise<T> => {
    const result = await apiRequest<T>(endpoint, method, data, options)

    await mutate(key => {
      if (typeof key !== 'string') return false
      return key === endpoint || (baseSegment ? key.startsWith(`/${baseSegment}`) : false)
    })

    return result
  }
}
