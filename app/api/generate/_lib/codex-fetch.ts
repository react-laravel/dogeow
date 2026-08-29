import type { Dispatcher, RequestInit as UndiciRequestInit } from 'undici'
import { ProxyAgent, fetch as undiciFetch } from 'undici'

/**
 * Outbound proxy for ChatGPT/Codex API calls.
 * Priority matches server ops conventions (Squid via WEBPUSH_HTTP_PROXY).
 */
export function resolveCodexProxyUrl(): string | undefined {
  const candidates = [
    process.env.CODEX_HTTP_PROXY,
    process.env.WEBPUSH_HTTP_PROXY,
    process.env.HTTPS_PROXY,
    process.env.https_proxy,
    process.env.HTTP_PROXY,
    process.env.http_proxy,
  ]

  for (const value of candidates) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }

  return undefined
}

/** Redact credentials in proxy URLs for error messages. */
export function redactProxyUrl(proxyUrl: string): string {
  try {
    const parsed = new URL(proxyUrl)
    if (parsed.username || parsed.password) {
      parsed.username = parsed.username ? '***' : ''
      parsed.password = parsed.password ? '***' : ''
    }
    return parsed.toString()
  } catch {
    return proxyUrl.replace(/\/\/([^/@]+)@/, '//***@')
  }
}

export function formatNetworkError(error: unknown): string {
  if (!(error instanceof Error)) return String(error)

  const parts: string[] = [error.message]
  let current: unknown = (error as Error & { cause?: unknown }).cause
  let depth = 0
  while (current instanceof Error && depth < 4) {
    if (current.message && !parts.includes(current.message)) {
      parts.push(current.message)
    }
    current = (current as Error & { cause?: unknown }).cause
    depth += 1
  }

  return parts.join(' | ')
}

let cachedProxyUrl: string | undefined
let cachedDispatcher: Dispatcher | undefined

function getProxyDispatcher(proxyUrl: string): Dispatcher {
  if (cachedDispatcher && cachedProxyUrl === proxyUrl) {
    return cachedDispatcher
  }

  cachedProxyUrl = proxyUrl
  cachedDispatcher = new ProxyAgent(proxyUrl)
  return cachedDispatcher
}

/** Reset cached proxy agent (tests). */
export function resetCodexProxyAgentForTests(): void {
  cachedProxyUrl = undefined
  cachedDispatcher = undefined
}

/**
 * fetch() for Codex/ChatGPT endpoints.
 * Uses undici ProxyAgent when a proxy env is set; otherwise global fetch.
 *
 * Note: this is server-side only. Browser "设备登录" UI does not perform ChatGPT OAuth;
 * credentials live in the server's ~/.codex/auth.json (from `codex login --device-auth`).
 */
export async function codexFetch(url: string, init?: RequestInit): Promise<Response> {
  const proxyUrl = resolveCodexProxyUrl()

  try {
    if (!proxyUrl) {
      return await fetch(url, init)
    }

    const dispatcher = getProxyDispatcher(proxyUrl)
    const undiciInit: UndiciRequestInit = {
      method: init?.method,
      headers: init?.headers as UndiciRequestInit['headers'],
      body: init?.body as UndiciRequestInit['body'],
      signal: init?.signal ?? undefined,
      dispatcher,
    }

    // undici Response is API-compatible with the Fetch Response used by route handlers.
    return (await undiciFetch(url, undiciInit)) as unknown as Response
  } catch (error) {
    const detail = formatNetworkError(error)
    const proxyHint = proxyUrl
      ? `当前出站代理：${redactProxyUrl(proxyUrl)}`
      : '当前未配置出站代理（CODEX_HTTP_PROXY / WEBPUSH_HTTP_PROXY）。服务器若无法直连 chatgpt.com，请在 Next 进程环境变量中配置 Squid。'
    throw new Error(`ChatGPT 网络请求失败：${detail}。${proxyHint}`)
  }
}
