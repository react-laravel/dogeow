import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { parseAiNarrationVoice } from '../aiNarration'
import { NARRATION_VOICE_STORAGE_KEY, useNarrationVoice } from '../narrationVoice'

describe('parseAiNarrationVoice', () => {
  it('accepts uncle_fu and defaults everything else to serena', () => {
    expect(parseAiNarrationVoice('uncle_fu')).toBe('uncle_fu')
    expect(parseAiNarrationVoice('serena')).toBe('serena')
    expect(parseAiNarrationVoice('Serena')).toBe('serena')
    expect(parseAiNarrationVoice(null)).toBe('serena')
  })
})

describe('useNarrationVoice', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists the chosen voice across hook instances', async () => {
    const first = renderHook(() => useNarrationVoice())
    await act(async () => {})
    act(() => {
      first.result.current.setVoice('uncle_fu')
    })
    expect(localStorage.getItem(NARRATION_VOICE_STORAGE_KEY)).toBe('uncle_fu')
    first.unmount()

    const second = renderHook(() => useNarrationVoice())
    await act(async () => {})
    expect(second.result.current.voice).toBe('uncle_fu')
  })
})
