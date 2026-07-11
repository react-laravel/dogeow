import type { AIProvider, CodexReasoningEffort } from '../request-model'

const AI_PROVIDER_STORAGE_KEY = 'ai_provider'
const OLLAMA_MODEL_STORAGE_KEY = 'ollama_model'
const CODEX_MODEL_STORAGE_KEY = 'codex_model'
const CODEX_REASONING_EFFORT_STORAGE_KEY = 'codex_reasoning_effort'
const DEFAULT_OLLAMA_MODEL = ''
const DEFAULT_CODEX_MODEL = 'gpt-5.6-sol'
const DEFAULT_CODEX_REASONING_EFFORT: CodexReasoningEffort = 'medium'
const CODEX_REASONING_EFFORTS = new Set<CodexReasoningEffort>([
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
])

export const getStoredProvider = (): AIProvider => {
  if (typeof window === 'undefined') return 'ollama'

  const saved = localStorage.getItem(AI_PROVIDER_STORAGE_KEY)
  if (saved === 'ollama' || saved === 'codex') {
    return saved
  }

  return 'ollama'
}

export const getStoredOllamaModel = (): string => {
  if (typeof window === 'undefined') return DEFAULT_OLLAMA_MODEL
  return localStorage.getItem(OLLAMA_MODEL_STORAGE_KEY) || DEFAULT_OLLAMA_MODEL
}

export const getStoredCodexModel = (): string => {
  if (typeof window === 'undefined') return DEFAULT_CODEX_MODEL
  return localStorage.getItem(CODEX_MODEL_STORAGE_KEY) || DEFAULT_CODEX_MODEL
}

export const getStoredCodexReasoningEffort = (): CodexReasoningEffort => {
  if (typeof window === 'undefined') return DEFAULT_CODEX_REASONING_EFFORT
  const saved = localStorage.getItem(CODEX_REASONING_EFFORT_STORAGE_KEY)
  return CODEX_REASONING_EFFORTS.has(saved as CodexReasoningEffort)
    ? (saved as CodexReasoningEffort)
    : DEFAULT_CODEX_REASONING_EFFORT
}

export const setStoredProvider = (provider: AIProvider) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AI_PROVIDER_STORAGE_KEY, provider)
  }
}

export const setStoredOllamaModel = (model: string) => {
  if (typeof window !== 'undefined') {
    if (model) {
      localStorage.setItem(OLLAMA_MODEL_STORAGE_KEY, model)
      return
    }

    localStorage.removeItem(OLLAMA_MODEL_STORAGE_KEY)
  }
}

export const setStoredCodexModel = (model: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CODEX_MODEL_STORAGE_KEY, model)
  }
}

export const setStoredCodexReasoningEffort = (effort: CodexReasoningEffort) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CODEX_REASONING_EFFORT_STORAGE_KEY, effort)
  }
}

export const AI_PROVIDER_DEFAULTS = {
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_CODEX_MODEL,
  DEFAULT_CODEX_REASONING_EFFORT,
} as const

export function resolveOllamaModelSelection(
  currentModel: string,
  availableModels: Array<{ name: string }>
): string {
  if (availableModels.length === 0) {
    return ''
  }

  if (availableModels.some(model => model.name === currentModel)) {
    return currentModel
  }

  return availableModels[0].name
}
