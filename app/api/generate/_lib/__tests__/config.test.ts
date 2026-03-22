import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generatePrompt,
  getAIProvider,
  getProviderFallbackMessage,
  isEmbeddingModel,
  isLikelyZhipuModel,
  PROMPT_TEMPLATES,
} from '../config'

// Save original env
const originalEnv = process.env

describe('generate config', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('generatePrompt', () => {
    it('should generate prompt for improve option', () => {
      const result = generatePrompt('improve', '原始文本')
      expect(result).toBe('请改进以下文本的表达和流畅性，保持原意不变：\n\n原始文本')
    })

    it('should generate prompt for fix option', () => {
      const result = generatePrompt('fix', '有错误的文本')
      expect(result).toBe('请修正以下文本的语法和拼写错误：\n\n有错误的文本')
    })

    it('should generate prompt for shorter option', () => {
      const result = generatePrompt('shorter', '很长的文本')
      expect(result).toBe('请将以下文本简化，保留核心信息：\n\n很长的文本')
    })

    it('should generate prompt for longer option', () => {
      const result = generatePrompt('longer', '简短的文本')
      expect(result).toBe('请扩展以下文本，添加更多细节和信息：\n\n简短的文本')
    })

    it('should generate prompt for continue option', () => {
      const result = generatePrompt('continue', '继续写下去')
      expect(result).toBe('请继续写下去：\n\n继续写下去')
    })

    it('should generate prompt for zap option with command', () => {
      const result = generatePrompt('zap', '原文', '自定义命令')
      expect(result).toBe('自定义命令\n\n原文')
    })

    it('should fall back to default template for unknown option', () => {
      const result = generatePrompt('unknown' as any, '文本')
      expect(result).toBe('请处理以下文本：\n\n文本')
    })

    it('should handle empty command for zap option', () => {
      const result = generatePrompt('zap', '原文', '')
      expect(result).toBe('\n\n原文')
    })
  })

  describe('getAIProvider', () => {
    it('should return github when requested and configured', () => {
      process.env.GITHUB_PAT = 'test-token'
      const { getAIProvider } = require('../config')
      expect(getAIProvider('github')).toBe('github')
    })

    it('should return minimax when requested and configured', () => {
      process.env.MINIMAX_TOKEN_API_KEY = 'test-token'
      const { getAIProvider } = require('../config')
      expect(getAIProvider('minimax')).toBe('minimax')
    })

    it('should return zhipuai when requested and configured', () => {
      process.env.ZHIPUAI_API_KEY = 'test-key'
      const { getAIProvider } = require('../config')
      expect(getAIProvider('zhipuai')).toBe('zhipuai')
    })

    it('should return ollama when requested', () => {
      const { getAIProvider } = require('../config')
      expect(getAIProvider('ollama')).toBe('ollama')
    })

    it('should fall back to github when no provider requested but github configured', () => {
      process.env.GITHUB_PAT = 'test-token'
      const { getAIProvider } = require('../config')
      expect(getAIProvider()).toBe('github')
    })

    it('should fall back to minimax when no provider requested but minimax configured', () => {
      process.env.MINIMAX_TOKEN_API_KEY = 'test-token'
      const { getAIProvider } = require('../config')
      expect(getAIProvider()).toBe('minimax')
    })

    it('should fall back to ollama when no provider requested and no other configured', () => {
      const { getAIProvider } = require('../config')
      expect(getAIProvider()).toBe('ollama')
    })

    it('should not return github if requested but not configured', () => {
      process.env.GITHUB_PAT = ''
      process.env.MINIMAX_TOKEN_API_KEY = 'test-token'
      const { getAIProvider } = require('../config')
      expect(getAIProvider('github')).toBe('minimax')
    })
  })

  describe('getProviderFallbackMessage', () => {
    it('should return github fallback message', () => {
      const result = getProviderFallbackMessage('github')
      expect(result).toContain('GITHUB_PAT')
    })

    it('should return minimax fallback message', () => {
      const result = getProviderFallbackMessage('minimax')
      expect(result).toContain('MINIMAX_TOKEN_API_KEY')
    })

    it('should return zhipuai fallback message', () => {
      const result = getProviderFallbackMessage('zhipuai')
      expect(result).toContain('ZHIPUAI_API_KEY')
    })

    it('should return ollama fallback message', () => {
      const result = getProviderFallbackMessage('ollama')
      expect(result).toContain('Ollama')
    })
  })

  describe('isEmbeddingModel', () => {
    it('should return true for qwen3-embedding models', () => {
      expect(isEmbeddingModel('qwen3-embedding')).toBe(true)
      expect(isEmbeddingModel('qwen3-embedding:latest')).toBe(true)
    })

    it('should return true for embeddinggemma models', () => {
      expect(isEmbeddingModel('embeddinggemma')).toBe(true)
      expect(isEmbeddingModel('embeddinggemma:2b')).toBe(true)
    })

    it('should return true for nomic-embed-text models', () => {
      expect(isEmbeddingModel('nomic-embed-text')).toBe(true)
      expect(isEmbeddingModel('nomic-embed-text:latest')).toBe(true)
    })

    it('should return false for regular models', () => {
      expect(isEmbeddingModel('qwen3:0.6b')).toBe(false)
      expect(isEmbeddingModel('llama3:8b')).toBe(false)
      expect(isEmbeddingModel('llava:latest')).toBe(false)
    })
  })

  describe('isLikelyZhipuModel', () => {
    it('should return true for glm- prefixed models', () => {
      expect(isLikelyZhipuModel('glm-4')).toBe(true)
      expect(isLikelyZhipuModel('glm-4.6v')).toBe(true)
      expect(isLikelyZhipuModel('glm-5')).toBe(true)
    })

    it('should return false for non-glm models', () => {
      expect(isLikelyZhipuModel('qwen3:0.6b')).toBe(false)
      expect(isLikelyZhipuModel('llama3')).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isLikelyZhipuModel(undefined)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isLikelyZhipuModel('')).toBe(false)
    })
  })

  describe('PROMPT_TEMPLATES', () => {
    it('should have all required options defined', () => {
      expect(PROMPT_TEMPLATES.improve).toBeDefined()
      expect(PROMPT_TEMPLATES.fix).toBeDefined()
      expect(PROMPT_TEMPLATES.shorter).toBeDefined()
      expect(PROMPT_TEMPLATES.longer).toBeDefined()
      expect(PROMPT_TEMPLATES.continue).toBeDefined()
      expect(PROMPT_TEMPLATES.zap).toBeDefined()
    })
  })
})
