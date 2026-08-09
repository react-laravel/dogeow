import {
  CODEX_MODEL,
  CODEX_RESPONSES_URL,
  DEFAULT_CODEX_INSTRUCTIONS,
  DEFAULT_MODEL,
  OLLAMA_CHAT_URL,
  OLLAMA_GENERATE_URL,
  isEmbeddingModel,
} from './config'
import { getCodexCredentials } from './codex-auth'
import { codexFetch } from './codex-fetch'
import type { ChatMessage, CodexReasoningEffort } from './types'

const CODEX_REASONING_EFFORTS = new Set<CodexReasoningEffort>([
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
  'ultra',
])

type CodexApiReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'

type CodexInputContent =
  | { type: 'input_text'; text: string }
  | { type: 'output_text'; text: string }

interface CodexInputMessage {
  role: 'user' | 'assistant' | 'developer'
  content: CodexInputContent[]
}

function mapReasoningEffort(
  reasoningEffort?: CodexReasoningEffort
): CodexApiReasoningEffort | undefined {
  if (!reasoningEffort || !CODEX_REASONING_EFFORTS.has(reasoningEffort)) {
    return undefined
  }

  // UI "minimal" maps to API "none" (broader model support than "minimal").
  if (reasoningEffort === 'minimal') return 'none'
  // UI "ultra" is the auto-delegation tier; API uses "max".
  if (reasoningEffort === 'ultra') return 'max'
  return reasoningEffort
}

function truncateText(text: string, maxLength = 2000): string {
  if (text.length <= maxLength) return text
  return `${text.slice(-maxLength)}…`
}

export function buildCodexRequestPayload(
  messages: ChatMessage[],
  model?: string,
  reasoningEffort?: CodexReasoningEffort
): {
  model: string
  instructions: string
  store: false
  stream: true
  input: CodexInputMessage[]
  reasoning?: { effort: CodexApiReasoningEffort }
} {
  const systemParts = messages
    .filter(message => message.role === 'system')
    .map(message => message.content.trim())
    .filter(Boolean)

  const conversation = messages
    .filter(message => {
      if (message.role === 'system') return false
      // Drop prior provider/runtime failures so they do not bloat the prompt.
      if (message.role === 'assistant' && message.content.includes('ChatGPT 调用失败')) return false
      if (message.role === 'assistant' && message.content.includes('Codex 调用失败')) return false
      return true
    })
    .slice(-6)

  const input: CodexInputMessage[] = conversation.map(message => {
    if (message.role === 'assistant') {
      return {
        role: 'assistant',
        content: [{ type: 'output_text', text: truncateText(message.content) }],
      }
    }

    return {
      role: 'user',
      content: [{ type: 'input_text', text: truncateText(message.content) }],
    }
  })

  const selectedModel = model?.trim() || CODEX_MODEL || 'gpt-5.6-luna'
  const instructions =
    systemParts.length > 0 ? systemParts.join('\n\n') : DEFAULT_CODEX_INSTRUCTIONS
  const selectedReasoningEffort = mapReasoningEffort(reasoningEffort)

  return {
    model: selectedModel,
    instructions,
    store: false,
    stream: true,
    input,
    ...(selectedReasoningEffort ? { reasoning: { effort: selectedReasoningEffort } } : {}),
  }
}

export async function callCodexChatAPI(
  messages: ChatMessage[],
  model?: string,
  reasoningEffort?: CodexReasoningEffort
): Promise<Response> {
  const credentials = await getCodexCredentials()
  const payload = buildCodexRequestPayload(messages, model, reasoningEffort)

  const headers: Record<string, string> = {
    Authorization: `Bearer ${credentials.accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    originator: 'dogeow',
  }

  if (credentials.accountId) {
    headers['chatgpt-account-id'] = credentials.accountId
  }

  const response = await codexFetch(CODEX_RESPONSES_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `ChatGPT 调用失败（${response.status}）${detail ? `：${detail.slice(0, 500)}` : ''}\n\n请确认已执行 codex login --device-auth，并配置 CODEX_HTTP_PROXY / WEBPUSH_HTTP_PROXY 出站代理。`
    )
  }

  return response
}

export const callOllamaGenerateAPI = async (prompt: string, model?: string): Promise<Response> => {
  const requested = model ?? DEFAULT_MODEL
  const selectedModel = isEmbeddingModel(requested) ? DEFAULT_MODEL : requested
  const res = await fetch(OLLAMA_GENERATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: selectedModel,
      prompt,
      stream: true,
    }),
  })
  if (!res.ok) throw new Error(`Ollama API error: ${res.status}`)
  return res
}

export const callOllamaChatAPI = async (
  messages: ChatMessage[],
  model?: string
): Promise<Response> => {
  const requested = model ?? DEFAULT_MODEL
  const selectedModel = isEmbeddingModel(requested) ? DEFAULT_MODEL : requested
  const res = await fetch(OLLAMA_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: selectedModel,
      messages,
      stream: true,
    }),
  })
  if (!res.ok) throw new Error(`Ollama API error: ${res.status}`)
  return res
}
