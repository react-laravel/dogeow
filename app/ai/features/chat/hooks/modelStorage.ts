import type { AIProvider } from '../request-model'

const AI_PROVIDER_STORAGE_KEY = 'ai_provider'
const OLLAMA_MODEL_STORAGE_KEY = 'ollama_model'
const ZHIPUAI_MODEL_STORAGE_KEY = 'zhipuai_model'
const DEFAULT_OLLAMA_MODEL = 'qwen3:0.6b'
const DEFAULT_ZHIPUAI_MODEL = 'glm-4.7'

export const getStoredProvider = (): AIProvider => {
  if (typeof window === 'undefined') return 'ollama'

  const saved = localStorage.getItem(AI_PROVIDER_STORAGE_KEY)
  if (saved === 'github' || saved === 'minimax' || saved === 'ollama' || saved === 'zhipuai') {
    return saved
  }

  return 'ollama'
}

export const getStoredOllamaModel = (): string => {
  if (typeof window === 'undefined') return DEFAULT_OLLAMA_MODEL
  return localStorage.getItem(OLLAMA_MODEL_STORAGE_KEY) || DEFAULT_OLLAMA_MODEL
}

export const getStoredZhipuaiModel = (): string => {
  if (typeof window === 'undefined') return DEFAULT_ZHIPUAI_MODEL
  return localStorage.getItem(ZHIPUAI_MODEL_STORAGE_KEY) || DEFAULT_ZHIPUAI_MODEL
}

export const setStoredProvider = (provider: AIProvider) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AI_PROVIDER_STORAGE_KEY, provider)
  }
}

export const setStoredOllamaModel = (model: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(OLLAMA_MODEL_STORAGE_KEY, model)
  }
}

export const setStoredZhipuaiModel = (model: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ZHIPUAI_MODEL_STORAGE_KEY, model)
  }
}

export const AI_PROVIDER_DEFAULTS = {
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_ZHIPUAI_MODEL,
} as const