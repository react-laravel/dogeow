import { useCallback, useEffect, useState } from 'react'
import type { ChatMessage } from '../types'
import {
  buildOllamaModelList,
  getOllamaModelExclusionReason,
  type OllamaTagModel,
  type OllamaModelListItem,
  type OllamaTagsResponse,
} from '@/lib/utils/ollama-models'

export const DEFAULT_BROWSER_OLLAMA_ADDRESS = 'localhost:11434'

const BROWSER_OLLAMA_ADDRESS_STORAGE_KEY = 'browser_ollama_address'
const BROWSER_OLLAMA_ADDRESS_CHANGE_EVENT = 'browser-ollama-address-change'

export interface BrowserOllamaDebugInfo {
  baseUrl: string
  tagsUrl: string
  pageOrigin?: string
  rawModels: OllamaTagModel[]
  chatModels: OllamaModelListItem[]
  excludedModels: Array<{
    name: string
    reason: string
  }>
}

export function normalizeBrowserOllamaAddress(value: string | null | undefined): string {
  const normalized = value?.trim().replace(/\/+$/, '')
  return normalized || DEFAULT_BROWSER_OLLAMA_ADDRESS
}

function toBrowserOllamaBaseUrl(address: string): string {
  if (/^https?:\/\//i.test(address)) {
    return address
  }

  return `http://${address}`
}

export function getStoredBrowserOllamaAddress(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_BROWSER_OLLAMA_ADDRESS
  }

  return normalizeBrowserOllamaAddress(localStorage.getItem(BROWSER_OLLAMA_ADDRESS_STORAGE_KEY))
}

export function getBrowserOllamaBaseUrl(): string {
  return toBrowserOllamaBaseUrl(getStoredBrowserOllamaAddress())
}

export function setStoredBrowserOllamaAddress(value: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const normalized = normalizeBrowserOllamaAddress(value)

  if (normalized === DEFAULT_BROWSER_OLLAMA_ADDRESS) {
    localStorage.removeItem(BROWSER_OLLAMA_ADDRESS_STORAGE_KEY)
  } else {
    localStorage.setItem(BROWSER_OLLAMA_ADDRESS_STORAGE_KEY, normalized)
  }

  window.dispatchEvent(new Event(BROWSER_OLLAMA_ADDRESS_CHANGE_EVENT))
}

export function resetStoredBrowserOllamaAddress(): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(BROWSER_OLLAMA_ADDRESS_STORAGE_KEY)
  window.dispatchEvent(new Event(BROWSER_OLLAMA_ADDRESS_CHANGE_EVENT))
}

export function useBrowserOllamaAddress() {
  const [browserOllamaAddress, setBrowserOllamaAddressState] = useState(() =>
    getStoredBrowserOllamaAddress()
  )

  const syncBrowserOllamaAddress = useCallback(() => {
    setBrowserOllamaAddressState(getStoredBrowserOllamaAddress())
  }, [])

  const setBrowserOllamaAddress = useCallback(
    (value: string) => {
      setStoredBrowserOllamaAddress(value)
      syncBrowserOllamaAddress()
    },
    [syncBrowserOllamaAddress]
  )

  const resetBrowserOllamaAddress = useCallback(() => {
    resetStoredBrowserOllamaAddress()
    syncBrowserOllamaAddress()
  }, [syncBrowserOllamaAddress])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('storage', syncBrowserOllamaAddress)
    window.addEventListener(BROWSER_OLLAMA_ADDRESS_CHANGE_EVENT, syncBrowserOllamaAddress)

    return () => {
      window.removeEventListener('storage', syncBrowserOllamaAddress)
      window.removeEventListener(BROWSER_OLLAMA_ADDRESS_CHANGE_EVENT, syncBrowserOllamaAddress)
    }
  }, [syncBrowserOllamaAddress])

  return {
    browserOllamaAddress,
    browserOllamaBaseUrl: toBrowserOllamaBaseUrl(browserOllamaAddress),
    setBrowserOllamaAddress,
    resetBrowserOllamaAddress,
  }
}

function getBrowserOllamaTagsUrl(): string {
  return `${getBrowserOllamaBaseUrl()}/api/tags`
}

function getBrowserOllamaChatUrl(): string {
  return `${getBrowserOllamaBaseUrl()}/api/chat`
}

function getPageOrigin(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.location.origin
}

function createBrowserOllamaNetworkError(tagsUrl: string, error: unknown): Error {
  const detail = error instanceof Error ? error.message : String(error)
  const hints: string[] = []

  if (typeof window !== 'undefined') {
    const pageOrigin = window.location.origin
    const pageProtocol = window.location.protocol
    const targetProtocol = new URL(tagsUrl).protocol

    hints.push(`页面来源：${pageOrigin}`)
    hints.push(`请求地址：${tagsUrl}`)

    if (pageProtocol === 'https:' && targetProtocol === 'http:') {
      hints.push(
        '当前页面是 HTTPS，但 Ollama 地址是 HTTP。iOS/Safari/PWA 会拦截混合内容；直接在地址栏打开 HTTP 地址能看到 “Ollama is running” 不代表页面 fetch 可以访问。请改用 Tailscale Serve 的 HTTPS 地址，或改走服务器代理。'
      )
    }

    hints.push(`请确认 OLLAMA_ORIGINS 包含 ${pageOrigin}，否则浏览器会因为 CORS 拦截 /api/tags。`)
  } else {
    hints.push(`请求地址：${tagsUrl}`)
  }

  return new Error(`请求 Ollama 失败：${detail}\n${hints.join('\n')}`)
}

async function fetchBrowserOllamaTags(): Promise<{
  baseUrl: string
  tagsUrl: string
  pageOrigin?: string
  data: OllamaTagsResponse
}> {
  const baseUrl = getBrowserOllamaBaseUrl()
  const tagsUrl = `${baseUrl}/api/tags`
  let response: Response

  try {
    response = await fetch(tagsUrl, { cache: 'no-store' })
  } catch (error) {
    throw createBrowserOllamaNetworkError(tagsUrl, error)
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `请求 Ollama 失败：HTTP ${response.status}${detail ? ` ${detail.slice(0, 300)}` : ''}\n请求地址：${tagsUrl}`
    )
  }

  const data = (await response.json()) as OllamaTagsResponse
  return { baseUrl, tagsUrl, pageOrigin: getPageOrigin(), data }
}

export async function fetchBrowserLocalOllamaModels(): Promise<OllamaModelListItem[]> {
  const { data } = await fetchBrowserOllamaTags()
  return buildOllamaModelList((data.models ?? []).map(model => ({ model })))
}

export async function fetchBrowserLocalOllamaDebugInfo(): Promise<BrowserOllamaDebugInfo> {
  const { baseUrl, tagsUrl, pageOrigin, data } = await fetchBrowserOllamaTags()
  const rawModels = data.models ?? []

  return {
    baseUrl,
    tagsUrl,
    pageOrigin,
    rawModels,
    chatModels: buildOllamaModelList(rawModels.map(model => ({ model }))),
    excludedModels: rawModels
      .map(model => ({
        name: model.name,
        reason: getOllamaModelExclusionReason(model) ?? '',
      }))
      .filter(model => model.reason),
  }
}

export async function callBrowserLocalOllamaChatAPI(
  messages: ChatMessage[],
  model: string,
  signal?: AbortSignal
): Promise<Response> {
  const response = await fetch(getBrowserOllamaChatUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Browser Ollama API error: ${response.status}`)
  }

  return response
}
