import { spawn, type ChildProcessByStdio } from 'node:child_process'
import type { Readable } from 'node:stream'
import {
  CODEX_CLI_PATH,
  CODEX_MODEL,
  DEFAULT_MODEL,
  OLLAMA_CHAT_URL,
  OLLAMA_GENERATE_URL,
  isEmbeddingModel,
} from './config'
import type { ChatMessage, CodexReasoningEffort } from './types'

const CODEX_REASONING_EFFORTS = new Set<CodexReasoningEffort>([
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
])

const CODEX_RUNTIME_HOME = process.env.CODEX_HOME_DIR?.trim() || '/home/actions-runner'
const CODEX_NODE_BIN = '/home/actions-runner/.nvm/versions/node/v24.16.0/bin'

function buildCodexEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    HOME: process.env.CODEX_EXEC_HOME?.trim() || CODEX_RUNTIME_HOME,
    CODEX_HOME: process.env.CODEX_HOME?.trim() || `${CODEX_RUNTIME_HOME}/.codex`,
    PATH: ['/usr/local/bin', CODEX_NODE_BIN, process.env.PATH ?? '/usr/bin:/bin'].join(':'),
  }
}

function buildCodexChatPrompt(messages: ChatMessage[]): string {
  const systemMessage = messages.find(message => message.role === 'system')
  const recentMessages = messages
    .filter(message => {
      if (message.role === 'system') return false
      // Do not feed previous provider/runtime failures back into Codex; they are
      // noisy, make the prompt much larger, and can trigger slow retries/timeouts.
      if (message.role === 'assistant' && message.content.includes('Codex 调用失败')) return false
      return true
    })
    .slice(-6)

  const formattedMessages = [systemMessage, ...recentMessages]
    .filter((message): message is ChatMessage => Boolean(message))
    .map(message => {
      const roleLabel =
        message.role === 'system' ? '系统' : message.role === 'assistant' ? '助理' : '用户'
      const content =
        message.content.length > 2000 ? `${message.content.slice(-2000)}…` : message.content
      return `${roleLabel}：${content}`
    })
    .join('\n\n')

  return [
    '你现在作为 DogeOW 聊天面板中的 ChatGPT provider 回复。',
    '请只回答用户的问题，不要修改文件，不要执行命令，除非用户明确要求代码仓库操作。',
    '默认使用中文回答。',
    '',
    '对话历史：',
    formattedMessages,
  ].join('\n')
}

export function callCodexExecAPI(
  messages: ChatMessage[],
  model?: string,
  reasoningEffort?: CodexReasoningEffort
): ChildProcessByStdio<null, Readable, Readable> {
  const selectedModel = model?.trim() || CODEX_MODEL
  // Codex CLI 0.139 sends built-in tools such as web_search/image_gen.
  // The ChatGPT backend rejects those tools when reasoning.effort is "minimal",
  // so omit the override and let Codex use its default effort for minimal.
  const selectedReasoningEffort =
    reasoningEffort &&
    reasoningEffort !== 'minimal' &&
    CODEX_REASONING_EFFORTS.has(reasoningEffort as CodexReasoningEffort)
      ? reasoningEffort
      : undefined
  const args = ['exec', '--ephemeral', '--sandbox', 'read-only', '--skip-git-repo-check']

  if (selectedModel) {
    args.push('--model', selectedModel)
  }

  if (selectedReasoningEffort) {
    args.push('--config', `model_reasoning_effort="${selectedReasoningEffort}"`)
  }

  args.push(buildCodexChatPrompt(messages))

  return spawn(CODEX_CLI_PATH, args, {
    cwd: process.cwd(),
    env: buildCodexEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
  })
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
