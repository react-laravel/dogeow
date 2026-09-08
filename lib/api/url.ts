/**
 * API URL 工具函数
 * 处理 API 基础 URL 和 IP 地址检测
 */

// 判断是否是 IP 地址（支持 IPv4 和 IPv6，用于 Tailscale 等场景）
export function isIpAddress(host: string): boolean {
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    return host.split('.').every(part => Number(part) <= 255)
  }
  if (!host.includes(':')) return false
  try {
    return new URL(`http://${host.startsWith('[') ? host : `[${host}]`}`).hostname.startsWith('[')
  } catch {
    return false
  }
}

/**
 * 获取 API 基础 URL
 * 在客户端如果是 IP 访问则使用当前 origin（支持 Tailscale 等外部访问），否则使用环境变量
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
  }

  if (!window.location) {
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
  }

  const hostname = window.location.hostname
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL
  if (configuredUrl && ['127.0.0.1', '::1', '[::1]'].includes(hostname)) {
    // 本地多项目开发可能使用自定义端口，不能把 API 请求发回前端服务。
    return configuredUrl
  }
  if (isIpAddress(hostname)) {
    return window.location.origin.replace(':3000', ':8000')
  }

  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

// 预计算的 API URL
export const API_URL = getApiBaseUrl()
