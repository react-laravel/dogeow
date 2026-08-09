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
 */
export async function codexFetch(url: string, init?: RequestInit): Promise<Response> {
  const proxyUrl = resolveCodexProxyUrl()

  if (!proxyUrl) {
    return fetch(url, init)
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
}
