/**
 * API URL 工具函数
 * 处理 API 基础 URL 和 IP 地址检测
 */

// 判断是否是 IP 地址（支持 IPv4 和 IPv6，用于 Tailscale 等场景）
export function isIpAddress(host: string): boolean {
  // IPv4 正则
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  // IPv6 正则（简化版本）
  const ipv6Regex = /^(\[?[a-fA-F0-9:]+:?)+\]?$/

  return ipv4Regex.test(host) || ipv6Regex.test(host)
}

/**
 * 获取 API 基础 URL
 * 在客户端如果是 IP 访问则使用当前 origin（支持 Tailscale 等外部访问），否则使用环境变量
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
  }

  const hostname = window.location.hostname
  if (isIpAddress(hostname)) {
    return window.location.origin.replace(':3000', ':8000')
  }

  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

// 预计算的 API URL
export const API_URL = getApiBaseUrl()
