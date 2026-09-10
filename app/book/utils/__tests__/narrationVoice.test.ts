import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { parseAiNarrationVoice } from '../aiNarration'
import { NARRATION_VOICE_STORAGE_KEY, useNarrationVoice } from '../narrationVoice'

describe('parseAiNarrationVoice', () => {
  it('accepts each installed voice and defaults unknown values to serena', () => {
    expect(parseAiNarrationVoice('uncle_fu')).toBe('uncle_fu')
    expect(parseAiNarrationVoice('serena')).toBe('serena')
    expect(parseAiNarrationVoice('vivian')).toBe('vivian')
    expect(parseAiNarrationVoice('young_male')).toBe('uncle_fu')
    expect(parseAiNarrationVoice('young_female')).toBe('vivian')
    expect(parseAiNarrationVoice('Serena')).toBe('serena')
    expect(parseAiNarrationVoice(null)).toBe('serena')
  })
})

describe('useNarrationVoice', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it.each(['uncle_fu', 'vivian', 'serena'] as const)(
    'persists %s across hook instances',
    async voice => {
      const first = renderHook(() => useNarrationVoice())
      await act(async () => {})
      act(() => {
        first.result.current.setVoice(voice)
      })
      expect(localStorage.getItem(NARRATION_VOICE_STORAGE_KEY)).toBe(voice)
      first.unmount()

      const second = renderHook(() => useNarrationVoice())
      await act(async () => {})
      expect(second.result.current.voice).toBe(voice)
    }
  )
})
