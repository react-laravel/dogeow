/**
 * API 错误处理工具
 * 统一处理 API 错误和错误标准化
 */

import { toast } from 'sonner'
import type { ApiError } from '@/app'

// 自定义 API 错误类
export class ApiRequestError extends Error {
  status: number
  data?: ApiError

  constructor(message: string, status: number, data?: ApiError) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.data = data
  }
}

// 标准 API 响应格式
export interface StandardApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  errors?: ApiError['errors'] | Record<string, unknown> | unknown
}

/**
 * 判断是否是标准 API 响应
 */
export function isStandardApiResponse(value: unknown): value is StandardApiResponse<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return 'success' in value && typeof (value as { success?: unknown }).success === 'boolean'
}

/**
 * 解包 API 响应获取数据
 */
export function unwrapApiPayload<T>(value: unknown): T {
  if (!isStandardApiResponse(value)) {
    return value as T
  }

  if ('data' in value) {
    return value.data as T
  }

  return {} as T
}

/**
 * 统一处理 API 错误
 */
export function handleApiError(error: unknown): void {
  if (error instanceof ApiRequestError) {
    const { status, data, message } = error

    if (status >= 400 && status < 500) {
      // 处理验证错误
      if (status === 422 && data?.errors) {
        const firstErrorField = Object.keys(data.errors)[0]
        if (
          firstErrorField &&
          Array.isArray(data.errors[firstErrorField]) &&
          data.errors[firstErrorField].length > 0
        ) {
          toast.error(data.errors[firstErrorField][0])
          return
        }
      }

      toast.error(message || `请求失败 (${status})`)
    } else if (status >= 500) {
      toast.error('服务器错误，请稍后重试')
    }
  } else if (error instanceof Error) {
    toast.error(error.message || '请求失败，请重试')
  } else {
    toast.error('请求失败，请重试')
  }
}

/**
 * 验证和标准化错误对象
 */
export function validateAndNormalizeError(error: unknown): Error {
  // 如果已经是 Error 实例，直接返回
  if (error instanceof Error) {
    return error
  }

  // 处理 null 或 undefined
  if (error === null || error === undefined) {
    return new Error('未知错误：错误对象为空')
  }

  // 处理非对象类型
  if (typeof error !== 'object') {
    return new Error(`API请求失败: ${String(error)}`)
  }

  // 处理对象类型的错误
  const errorObj = error as Record<string, unknown>

  // 尝试提取错误消息
  let message = 'API请求失败'
  let status: number | undefined
  let code: string | number | undefined

  // 检查常见的错误属性
  if (typeof errorObj.message === 'string' && errorObj.message.trim()) {
    message = errorObj.message
  } else if (typeof errorObj.error === 'string' && errorObj.error.trim()) {
    message = errorObj.error
  } else if (typeof errorObj.detail === 'string' && errorObj.detail.trim()) {
    message = errorObj.detail
  } else if (typeof errorObj.reason === 'string' && errorObj.reason.trim()) {
    message = errorObj.reason
  } else if (errorObj.status && typeof errorObj.status === 'number') {
    status = errorObj.status
    message = `API请求失败 (状态码: ${status})`
  } else if (
    errorObj.code &&
    (typeof errorObj.code === 'string' || typeof errorObj.code === 'number')
  ) {
    code = errorObj.code
    message = `API请求失败 (错误代码: ${code})`
  } else if (errorObj.name && typeof errorObj.name === 'string') {
    // 处理类似 DOMException 的对象
    if (errorObj.name === 'AbortError') {
      message = '请求被取消'
    } else if (errorObj.name === 'NetworkError') {
      message = '网络连接失败'
    } else if (errorObj.name === 'TimeoutError') {
      message = '请求超时'
    } else {
      message = `API请求失败 (${errorObj.name})`
    }
  } else {
    // 尝试序列化对象获取更多信息
    try {
      const serialized = JSON.stringify(errorObj, null, 2)
      if (serialized !== '{}' && serialized.length < 500) {
        message = `API请求失败: ${serialized}`
      } else {
        message = `API请求失败: ${Object.prototype.toString.call(errorObj)}`
      }
    } catch {
      message = `API请求失败: ${Object.prototype.toString.call(errorObj)}`
    }
  }

  const normalizedError = new Error(message)

  // 保留原始错误信息作为额外属性
  if (status !== undefined) {
    ;(normalizedError as Error & { status?: number }).status = status
  } else if (errorObj.status && typeof errorObj.status === 'number') {
    ;(normalizedError as Error & { status?: number }).status = errorObj.status
  }

  if (code !== undefined) {
    ;(normalizedError as Error & { code?: string | number }).code = code
  } else if (
    errorObj.code &&
    (typeof errorObj.code === 'string' || typeof errorObj.code === 'number')
  ) {
    ;(normalizedError as Error & { code?: string | number }).code = errorObj.code
  }

  // 保留其他有用的属性
  if (errorObj.name && typeof errorObj.name === 'string') {
    ;(normalizedError as Error & { name?: string }).name = errorObj.name
  }

  return normalizedError
}
