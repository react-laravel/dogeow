import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  getDefaultOllamaAccessMode,
  getEffectiveOllamaAccessMode,
  getOllamaAccessModeLabel,
  getStoredOllamaAccessModeSelection,
  normalizeOllamaAccessMode,
  setStoredOllamaAccessModeSelection,
  useOllamaAccessMode,
  type OllamaAccessMode,
  type OllamaAccessModeSelection,
} from '../ollamaAccessMode'

describe('ollamaAccessMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem('ollama_access_mode_override')
  })

  describe('normalizeOllamaAccessMode', () => {
    it('returns valid modes', () => {
      expect(normalizeOllamaAccessMode('auto')).toBe('auto')
      expect(normalizeOllamaAccessMode('browser')).toBe('browser')
      expect(normalizeOllamaAccessMode('server')).toBe('server')
    })

    it('returns null for invalid values', () => {
      expect(normalizeOllamaAccessMode('invalid')).toBeNull()
      expect(normalizeOllamaAccessMode('')).toBeNull()
      expect(normalizeOllamaAccessMode(null)).toBeNull()
      expect(normalizeOllamaAccessMode(undefined)).toBeNull()
    })
  })

  describe('getDefaultOllamaAccessMode', () => {
    it('returns a valid default mode', () => {
      const mode = getDefaultOllamaAccessMode()
      expect(['auto', 'browser', 'server']).toContain(mode)
    })

    it('returns auto as fallback default', () => {
      // DEFAULT_OLLAMA_ACCESS_MODE falls back to 'auto' when env is not set
      expect(getDefaultOllamaAccessMode()).toBe('auto')
    })
  })

  describe('getStoredOllamaAccessModeSelection', () => {
    it('returns default when nothing is stored', () => {
      expect(getStoredOllamaAccessModeSelection()).toBe('default')
    })

    it('returns stored valid mode', () => {
      localStorage.setItem('ollama_access_mode_override', 'browser')
      expect(getStoredOllamaAccessModeSelection()).toBe('browser')
    })

    it('returns default for invalid stored mode', () => {
      localStorage.setItem('ollama_access_mode_override', 'invalid')
      expect(getStoredOllamaAccessModeSelection()).toBe('default')
    })

    it('returns default when stored value is default', () => {
      localStorage.setItem('ollama_access_mode_override', 'default')
      expect(getStoredOllamaAccessModeSelection()).toBe('default')
    })
  })

  describe('getEffectiveOllamaAccessMode', () => {
    it('returns auto when selection is default', () => {
      localStorage.removeItem('ollama_access_mode_override')
      expect(getEffectiveOllamaAccessMode()).toBe('auto')
    })

    it('returns selected mode when not default', () => {
      localStorage.setItem('ollama_access_mode_override', 'browser')
      expect(getEffectiveOllamaAccessMode()).toBe('browser')
    })
  })

  describe('getOllamaAccessModeLabel', () => {
    it('returns correct labels', () => {
      expect(getOllamaAccessModeLabel('default')).toBe('跟随站点默认')
      expect(getOllamaAccessModeLabel('auto')).toBe('自动')
      expect(getOllamaAccessModeLabel('browser')).toBe('浏览器直连')
      expect(getOllamaAccessModeLabel('server')).toBe('仅服务器')
    })
  })

  describe('setStoredOllamaAccessModeSelection', () => {
    it('stores the selection', () => {
      setStoredOllamaAccessModeSelection('browser')
      expect(localStorage.getItem('ollama_access_mode_override')).toBe('browser')
    })

    it('removes key when selection is default', () => {
      localStorage.setItem('ollama_access_mode_override', 'browser')
      setStoredOllamaAccessModeSelection('default')
      expect(localStorage.getItem('ollama_access_mode_override')).toBeNull()
    })

    it('dispatches a storage event', () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
      setStoredOllamaAccessModeSelection('browser')
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event))
      dispatchSpy.mockRestore()
    })
  })

  describe('useOllamaAccessMode', () => {
    it('returns default selection on first render', () => {
      const { result } = renderHook(() => useOllamaAccessMode())
      expect(result.current.ollamaAccessModeSelection).toBe('default')
      expect(result.current.defaultOllamaAccessMode).toBe('auto')
    })

    it('computes effective mode as auto when selection is default', () => {
      const { result } = renderHook(() => useOllamaAccessMode())
      expect(result.current.effectiveOllamaAccessMode).toBe('auto')
    })

    it('updates selection via setter', () => {
      const { result } = renderHook(() => useOllamaAccessMode())
      act(() => {
        result.current.setOllamaAccessModeSelection('server')
      })
      expect(result.current.ollamaAccessModeSelection).toBe('server')
      expect(result.current.effectiveOllamaAccessMode).toBe('server')
    })
  })
})
