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

export const CODEX_CLI_PATH = process.env.CODEX_CLI_PATH?.trim() || 'codex'
export const CODEX_MODEL = process.env.CODEX_MODEL?.trim() || ''

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
    return 'ChatGPT 暂时不可用，请确认服务器已安装 Codex CLI，并执行 codex login --device-auth 完成设备登录'
  }
  return 'AI 服务暂时不可用，请确保 Ollama 服务正在运行'
}
