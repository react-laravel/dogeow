import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AI_PROVIDER_DEFAULTS,
  getStoredCodexModel,
  getStoredCodexReasoningEffort,
  getStoredOllamaModel,
  getStoredProvider,
  getStoredZhipuaiModel,
  resolveOllamaModelSelection,
  setStoredCodexModel,
  setStoredCodexReasoningEffort,
  setStoredOllamaModel,
  setStoredProvider,
  setStoredZhipuaiModel,
} from '../modelStorage'

describe('modelStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem('ai_provider')
    localStorage.removeItem('ollama_model')
    localStorage.removeItem('zhipuai_model')
    localStorage.removeItem('codex_model')
    localStorage.removeItem('codex_reasoning_effort')
  })

  describe('getStoredProvider', () => {
    it('returns ollama when nothing is stored', () => {
      expect(getStoredProvider()).toBe('ollama')
    })

    it('returns stored valid provider', () => {
      localStorage.setItem('ai_provider', 'github')
      expect(getStoredProvider()).toBe('github')
    })

    it('returns ollama for invalid stored value', () => {
      localStorage.setItem('ai_provider', 'invalid')
      expect(getStoredProvider()).toBe('ollama')
    })
  })

  describe('getStoredOllamaModel', () => {
    it('returns empty string when nothing is stored', () => {
      expect(getStoredOllamaModel()).toBe('')
    })

    it('returns stored model', () => {
      localStorage.setItem('ollama_model', 'qwen3:0.6b')
      expect(getStoredOllamaModel()).toBe('qwen3:0.6b')
    })
  })

  describe('getStoredZhipuaiModel', () => {
    it('returns default model when nothing is stored', () => {
      expect(getStoredZhipuaiModel()).toBe('glm-4.7')
    })

    it('returns stored model', () => {
      localStorage.setItem('zhipuai_model', 'glm-4.6v')
      expect(getStoredZhipuaiModel()).toBe('glm-4.6v')
    })
  })

  describe('getStoredCodexModel', () => {
    it('returns default model when nothing is stored', () => {
      expect(getStoredCodexModel()).toBe('gpt-5.5')
    })

    it('returns stored model', () => {
      localStorage.setItem('codex_model', 'gpt-5.4')
      expect(getStoredCodexModel()).toBe('gpt-5.4')
    })
  })

  describe('getStoredCodexReasoningEffort', () => {
    it('returns medium when nothing is stored', () => {
      expect(getStoredCodexReasoningEffort()).toBe('medium')
    })

    it('returns stored valid effort', () => {
      localStorage.setItem('codex_reasoning_effort', 'high')
      expect(getStoredCodexReasoningEffort()).toBe('high')
    })

    it('returns default for invalid stored effort', () => {
      localStorage.setItem('codex_reasoning_effort', 'invalid')
      expect(getStoredCodexReasoningEffort()).toBe('medium')
    })
  })

  describe('setStoredProvider', () => {
    it('stores the provider', () => {
      setStoredProvider('minimax')
      expect(localStorage.getItem('ai_provider')).toBe('minimax')
    })
  })

  describe('setStoredOllamaModel', () => {
    it('stores the model', () => {
      setStoredOllamaModel('qwen3:0.6b')
      expect(localStorage.getItem('ollama_model')).toBe('qwen3:0.6b')
    })

    it('removes the key when model is empty', () => {
      localStorage.setItem('ollama_model', 'qwen3:0.6b')
      setStoredOllamaModel('')
      expect(localStorage.getItem('ollama_model')).toBeNull()
    })
  })

  describe('setStoredZhipuaiModel', () => {
    it('stores the model', () => {
      setStoredZhipuaiModel('glm-4.7')
      expect(localStorage.getItem('zhipuai_model')).toBe('glm-4.7')
    })
  })

  describe('setStoredCodexModel', () => {
    it('stores the model', () => {
      setStoredCodexModel('gpt-5.5')
      expect(localStorage.getItem('codex_model')).toBe('gpt-5.5')
    })
  })

  describe('setStoredCodexReasoningEffort', () => {
    it('stores the effort', () => {
      setStoredCodexReasoningEffort('high')
      expect(localStorage.getItem('codex_reasoning_effort')).toBe('high')
    })
  })

  describe('AI_PROVIDER_DEFAULTS', () => {
    it('exports the default constants', () => {
      expect(AI_PROVIDER_DEFAULTS.DEFAULT_OLLAMA_MODEL).toBe('')
      expect(AI_PROVIDER_DEFAULTS.DEFAULT_ZHIPUAI_MODEL).toBe('glm-4.7')
      expect(AI_PROVIDER_DEFAULTS.DEFAULT_CODEX_MODEL).toBe('gpt-5.5')
      expect(AI_PROVIDER_DEFAULTS.DEFAULT_CODEX_REASONING_EFFORT).toBe('medium')
    })
  })

  describe('resolveOllamaModelSelection', () => {
    it('returns empty string when no models available', () => {
      expect(resolveOllamaModelSelection('qwen3:0.6b', [])).toBe('')
    })

    it('returns current model when it exists in available models', () => {
      const models = [{ name: 'qwen3:0.6b' }, { name: 'gemma3:4b' }]
      expect(resolveOllamaModelSelection('qwen3:0.6b', models)).toBe('qwen3:0.6b')
    })

    it('returns first model when current model is not available', () => {
      const models = [{ name: 'gemma3:4b' }, { name: 'llama3.2:3b' }]
      expect(resolveOllamaModelSelection('qwen3:0.6b', models)).toBe('gemma3:4b')
    })
  })
})
