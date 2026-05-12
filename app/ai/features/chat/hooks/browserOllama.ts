import type { ChatMessage } from '../types'
import {
  buildOllamaModelList,
  type OllamaModelListItem,
  type OllamaTagsResponse,
} from '@/lib/utils/ollama-models'

const DEFAULT_BROWSER_LOCAL_OLLAMA_BASE_URL = 'http://localhost:11434'

function normalizeBrowserOllamaBaseUrl(value: string | undefined): string {
  const normalized = value?.trim().replace(/\/+$/, '')
  return normalized || DEFAULT_BROWSER_LOCAL_OLLAMA_BASE_URL
}

export const BROWSER_LOCAL_OLLAMA_BASE_URL = normalizeBrowserOllamaBaseUrl(
  process.env.NEXT_PUBLIC_BROWSER_OLLAMA_BASE_URL
)
export const BROWSER_LOCAL_OLLAMA_TAGS_URL = `${BROWSER_LOCAL_OLLAMA_BASE_URL}/api/tags`
export const BROWSER_LOCAL_OLLAMA_CHAT_URL = `${BROWSER_LOCAL_OLLAMA_BASE_URL}/api/chat`

export async function fetchBrowserLocalOllamaModels(): Promise<OllamaModelListItem[]> {
  const response = await fetch(BROWSER_LOCAL_OLLAMA_TAGS_URL)
  if (!response.ok) {
    throw new Error(`Browser Ollama API error: ${response.status}`)
  }

  const data = (await response.json()) as OllamaTagsResponse
  return buildOllamaModelList((data.models ?? []).map(model => ({ model })))
}

export async function callBrowserLocalOllamaChatAPI(
  messages: ChatMessage[],
  model: string,
  signal?: AbortSignal
): Promise<Response> {
  const response = await fetch(BROWSER_LOCAL_OLLAMA_CHAT_URL, {
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
