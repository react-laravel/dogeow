import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatModelStorage } from '../useChatModelStorage'

describe('useChatModelStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem('ai_provider')
    localStorage.removeItem('ollama_model')
    localStorage.removeItem('zhipuai_model')
    localStorage.removeItem('codex_model')
    localStorage.removeItem('codex_reasoning_effort')
  })

  describe('initializeProvider', () => {
    it('returns stored provider', () => {
      const { result } = renderHook(() =>
        useChatModelStorage({
          provider: 'ollama',
          model: '',
          setProvider: vi.fn(),
          setModel: vi.fn(),
        })
      )
      // Set after mount to avoid useEffect overwrite
      localStorage.setItem('ai_provider', 'minimax')
      expect(result.current.initializeProvider()).toBe('minimax')
    })

    it('returns ollama when nothing is stored', () => {
      const { result } = renderHook(() =>
        useChatModelStorage({
          provider: 'ollama',
          model: '',
          setProvider: vi.fn(),
          setModel: vi.fn(),
        })
      )
      expect(result.current.initializeProvider()).toBe('ollama')
    })
  })

  describe('initializeModel', () => {
    it('returns stored ollama model for ollama provider', () => {
      const { result } = renderHook(() =>
        useChatModelStorage({
          provider: 'ollama',
          model: '',
          setProvider: vi.fn(),
          setModel: vi.fn(),
        })
      )
      localStorage.setItem('ollama_model', 'gemma3:4b')
      expect(result.current.initializeModel('ollama')).toBe('gemma3:4b')
    })

    it('returns stored zhipuai model for zhipuai provider', () => {
      const { result } = renderHook(() =>
        useChatModelStorage({
          provider: 'zhipuai',
          model: '',
          setProvider: vi.fn(),
          setModel: vi.fn(),
        })
      )
      localStorage.setItem('zhipuai_model', 'glm-4.6v')
      expect(result.current.initializeModel('zhipuai')).toBe('glm-4.6v')
    })

    it('returns stored codex model for codex provider', () => {
      const { result } = renderHook(() =>
        useChatModelStorage({
          provider: 'codex',
          model: '',
          setProvider: vi.fn(),
          setModel: vi.fn(),
        })
      )
      localStorage.setItem('codex_model', 'gpt-5.4')
      expect(result.current.initializeModel('codex')).toBe('gpt-5.4')
    })

    it('returns ollama default for unknown provider', () => {
      const { result } = renderHook(() =>
        useChatModelStorage({
          provider: 'ollama',
          model: '',
          setProvider: vi.fn(),
          setModel: vi.fn(),
        })
      )
      expect(result.current.initializeModel('github')).toBe('')
    })
  })

  describe('provider persistence', () => {
    it('calls setProvider via effect when provider changes', () => {
      const setProvider = vi.fn()
      const { rerender } = renderHook(
        ({ provider, setProviderArg, setModelArg }) =>
          useChatModelStorage({
            provider,
            model: '',
            setProvider: setProviderArg,
            setModel: setModelArg,
          }),
        {
          initialProps: {
            provider: 'ollama' as const,
            setProviderArg: setProvider,
            setModelArg: vi.fn(),
          },
        }
      )

      // Change provider via props - the useEffect should call setStoredProvider
      rerender({
        provider: 'minimax',
        setProviderArg: setProvider,
        setModelArg: vi.fn(),
      })

      // setStoredProvider writes to localStorage
      expect(localStorage.getItem('ai_provider')).toBe('minimax')
    })
  })

  describe('model restoration on provider change', () => {
    it('calls setModel with stored ollama model when provider changes to ollama', () => {
      localStorage.setItem('ollama_model', 'gemma3:4b')
      const setModel = vi.fn()
      const { rerender } = renderHook(
        ({ provider, setProviderArg, setModelArg }) =>
          useChatModelStorage({
            provider,
            model: '',
            setProvider: setProviderArg,
            setModel: setModelArg,
          }),
        {
          initialProps: {
            provider: 'zhipuai' as const,
            setProviderArg: vi.fn(),
            setModelArg: setModel,
          },
        }
      )

      rerender({
        provider: 'ollama',
        setProviderArg: vi.fn(),
        setModelArg: setModel,
      })

      // The useEffect calls setModel(getStoredOllamaModel())
      expect(setModel).toHaveBeenCalledWith('gemma3:4b')
    })
  })
})
