import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getYoudaoPronunciationUrl, useWordPronunciation } from '../useWordPronunciation'

interface MockAudioInstance {
  currentTime: number
  onended: null | (() => void)
  onerror: null | (() => void)
  pause: ReturnType<typeof vi.fn>
  play: ReturnType<typeof vi.fn>
}

function createDeferred() {
  let resolve: () => void = () => undefined
  let reject: (reason?: unknown) => void = () => undefined

  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return {
    promise,
    resolve,
    reject,
  }
}

describe('useWordPronunciation', () => {
  const originalAudio = globalThis.Audio
  let audioConstructor: ReturnType<typeof vi.fn>
  let latestAudioInstance: MockAudioInstance | null
  let playImplementations: Array<() => Promise<void>>

  beforeEach(() => {
    latestAudioInstance = null
    playImplementations = []
    audioConstructor = vi.fn(
      class MockAudio {
        currentTime = 0
        onended: null | (() => void) = null
        onerror: null | (() => void) = null
        pause = vi.fn()
        play = vi.fn(() => {
          const playImplementation = playImplementations.shift()

          if (playImplementation) {
            return playImplementation()
          }

          return Promise.resolve()
        })

        constructor() {
          latestAudioInstance = this as unknown as MockAudioInstance
        }
      }
    )

    vi.stubGlobal('Audio', audioConstructor as unknown as typeof Audio)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    globalThis.Audio = originalAudio
  })

  it('builds the British pronunciation URL with Youdao type 1', () => {
    expect(getYoudaoPronunciationUrl('hello world', 'uk')).toBe(
      'https://dict.youdao.com/dictvoice?audio=hello%20world&type=1'
    )
  })

  it('builds the American pronunciation URL with Youdao type 2', () => {
    expect(getYoudaoPronunciationUrl('hello world', 'us')).toBe(
      'https://dict.youdao.com/dictvoice?audio=hello%20world&type=2'
    )
  })

  it('plays American pronunciation through the Audio API', async () => {
    const { result } = renderHook(() => useWordPronunciation())

    playImplementations.push(() => Promise.resolve())

    await act(async () => {
      await result.current.playAmericanPronunciation('example')
    })

    expect(audioConstructor).toHaveBeenCalledWith(
      'https://dict.youdao.com/dictvoice?audio=example&type=2'
    )
    expect(latestAudioInstance).not.toBeNull()
    expect(latestAudioInstance?.play).toHaveBeenCalledTimes(1)
  })

  it('cancels the current playback before starting a new one', async () => {
    const { result } = renderHook(() => useWordPronunciation())

    playImplementations.push(
      () => Promise.resolve(),
      () => Promise.resolve()
    )

    await act(async () => {
      await result.current.playBritishPronunciation('alpha')
    })

    const firstAudioInstance = latestAudioInstance

    await act(async () => {
      await result.current.playAmericanPronunciation('beta')
    })

    expect(firstAudioInstance).not.toBeNull()
    expect(firstAudioInstance?.pause).toHaveBeenCalledTimes(1)
    expect(firstAudioInstance?.currentTime).toBe(0)
    expect(audioConstructor).toHaveBeenLastCalledWith(
      'https://dict.youdao.com/dictvoice?audio=beta&type=2'
    )
  })

  it('keeps the latest audio reference when a canceled playback rejects later', async () => {
    const firstPlayback = createDeferred()

    playImplementations.push(
      () => firstPlayback.promise,
      () => Promise.resolve()
    )

    const { result } = renderHook(() => useWordPronunciation())

    act(() => {
      void result.current.playBritishPronunciation('alpha', { suppressErrors: true })
    })

    const firstAudioInstance = latestAudioInstance

    await act(async () => {
      await result.current.playAmericanPronunciation('beta')
    })

    const secondAudioInstance = latestAudioInstance

    firstPlayback.reject(new Error('playback canceled'))

    await act(async () => {
      await firstPlayback.promise.catch(() => undefined)
    })

    act(() => {
      result.current.cancel()
    })

    expect(firstAudioInstance).not.toBeNull()
    expect(secondAudioInstance).not.toBeNull()
    expect(firstAudioInstance?.pause).toHaveBeenCalledTimes(1)
    expect(secondAudioInstance?.pause).toHaveBeenCalledTimes(1)
    expect(secondAudioInstance?.currentTime).toBe(0)
  })
})
