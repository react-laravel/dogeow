import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  NARRATION_ENGINE_STORAGE_KEY,
  parseNarrationEngine,
  useNarrationEngine,
} from '../narrationEngine'

describe('parseNarrationEngine', () => {
  it('accepts ai and defaults everything else to tts', () => {
    expect(parseNarrationEngine('ai')).toBe('ai')
    expect(parseNarrationEngine('tts')).toBe('tts')
    expect(parseNarrationEngine('system')).toBe('tts')
    expect(parseNarrationEngine(null)).toBe('tts')
  })
})

describe('useNarrationEngine', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists the chosen engine across hook instances', async () => {
    const first = renderHook(() => useNarrationEngine())
    await act(async () => {})
    act(() => {
      first.result.current.setEngine('ai')
    })
    expect(localStorage.getItem(NARRATION_ENGINE_STORAGE_KEY)).toBe('ai')
    first.unmount()

    const second = renderHook(() => useNarrationEngine())
    await act(async () => {})
    expect(second.result.current.engine).toBe('ai')
  })
})
