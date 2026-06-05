import { describe, expect, it, vi } from 'vitest'
import { isAbortPlayError, safePlay } from '../safePlay'

describe('safePlay', () => {
  it('ignores AbortError and retries once when audio is still paused', async () => {
    const play = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'))
      .mockResolvedValueOnce(undefined)

    const audio = {
      paused: true,
      play,
    } as unknown as HTMLAudioElement

    await safePlay(audio)

    expect(play).toHaveBeenCalledTimes(2)
  })

  it('does not call play when audio is already playing', async () => {
    const play = vi.fn()
    const audio = {
      paused: false,
      play,
    } as unknown as HTMLAudioElement

    await safePlay(audio)

    expect(play).not.toHaveBeenCalled()
  })

  it('rethrows non-abort errors', async () => {
    const play = vi.fn().mockRejectedValue(new Error('not allowed'))
    const audio = {
      paused: true,
      play,
    } as unknown as HTMLAudioElement

    await expect(safePlay(audio)).rejects.toThrow('not allowed')
  })
})

describe('isAbortPlayError', () => {
  it('detects DOMException AbortError', () => {
    expect(isAbortPlayError(new DOMException('aborted', 'AbortError'))).toBe(true)
    expect(isAbortPlayError(new Error('aborted'))).toBe(false)
  })
})
