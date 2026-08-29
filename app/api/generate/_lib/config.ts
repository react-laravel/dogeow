import { join } from 'node:path'
import type { AIProvider, GenerateOption } from './types'

export const PROMPT_TEMPLATES: Record<GenerateOption, (text: string, command?: string) => string> =
  {
    improve: text => `请改进以下文本的表达和流畅性，保持原意不变：\n\n${text}`,
    fix: text => `请修正以下文本的语法和拼写错误：\n\n${text}`,
    shorter: text => `请将以下文本简化，保留核心信息：\n\n${text}`,
    longer: text => `请扩展以下文本，添加更多细节和信息：\n\n${text}`,
    continue: text => `请继续写下去：\n\n${text}`,
    zap: (text, command) => `${command}\n\n原文：${text}`,
  }

export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
export const OLLAMA_GENERATE_URL = `${OLLAMA_BASE_URL}/api/generate`
export const OLLAMA_CHAT_URL = `${OLLAMA_BASE_URL}/api/chat`
export const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? 'qwen3:0.6b'

const CODEX_RUNTIME_HOME = process.env.CODEX_HOME_DIR?.trim() || '/home/actions-runner'
export const CODEX_HOME = process.env.CODEX_HOME?.trim() || join(CODEX_RUNTIME_HOME, '.codex')
export const CODEX_MODEL = process.env.CODEX_MODEL?.trim() || ''
export const CODEX_BACKEND_BASE_URL =
  process.env.CODEX_BACKEND_BASE_URL?.trim() || 'https://chatgpt.com/backend-api/codex'
export const CODEX_RESPONSES_URL = `${CODEX_BACKEND_BASE_URL.replace(/\/$/, '')}/responses`
export const CODEX_AUTH_URL =
  process.env.CODEX_AUTH_URL?.trim() || 'https://auth.openai.com/oauth/token'
/** Public OAuth client id used by Codex CLI ChatGPT device login. */
export const CODEX_OAUTH_CLIENT_ID =
  process.env.CODEX_OAUTH_CLIENT_ID?.trim() || 'app_EMoamEEZ73f0CkXaXp7hrann'
export const DEFAULT_CODEX_INSTRUCTIONS =
  '你现在作为 DogeOW 聊天面板中的 ChatGPT provider 回复。请只回答用户的问题，不要修改文件，不要执行命令，除非用户明确要求代码仓库操作。默认使用中文回答。'

const EMBEDDING_MODEL_PREFIXES = ['qwen3-embedding', 'embeddinggemma', 'nomic-embed-text']
export const isEmbeddingModel = (model: string) =>
  EMBEDDING_MODEL_PREFIXES.some(prefix => model.startsWith(prefix))

export const generatePrompt = (option: GenerateOption, text: string, command?: string): string =>
  PROMPT_TEMPLATES[option]?.(text, command) ?? `请处理以下文本：\n\n${text}`

export const getAIProvider = (requestedProvider?: AIProvider): AIProvider => {
  if (requestedProvider === 'codex') return 'codex'
  if (requestedProvider === 'ollama') return 'ollama'
  return 'ollama'
}

export const getProviderFallbackMessage = (provider: AIProvider): string => {
  if (provider === 'codex') {
    return [
      'ChatGPT 暂时不可用（服务端调用失败）。',
      '说明：前端「设备登录」不是网页点登录，而是服务器上的 Codex 订阅凭据。',
      '请在运行 Next 的机器上：1) codex login --device-auth 写入 auth.json；',
      '2) 配置出站代理 CODEX_HTTP_PROXY 或 WEBPUSH_HTTP_PROXY（如 Squid）并重启 Next。',
    ].join('')
  }
  return 'AI 服务暂时不可用，请确保 Ollama 服务正在运行'
}
