import { describe, expect, it, vi } from 'vitest'
import { attachAiClip } from '../aiAudioPlaylist'

function fakeAudio(errorCode?: number) {
  const listeners = new Map<string, Array<() => void>>()
  return {
    ended: false,
    paused: false,
    duration: 10,
    currentTime: 0,
    error: errorCode == null ? null : { code: errorCode },
    addEventListener(type: string, fn: () => void) {
      listeners.set(type, [...(listeners.get(type) ?? []), fn])
    },
    removeEventListener(type: string, fn: () => void) {
      listeners.set(
        type,
        (listeners.get(type) ?? []).filter(listener => listener !== fn)
      )
    },
    emit(type: string) {
      for (const listener of listeners.get(type) ?? []) listener()
    },
  }
}

describe('attachAiClip', () => {
  it('advances once when ended and pause both fire', () => {
    const audio = fakeAudio()
    const onEnded = vi.fn()
    attachAiClip(audio as unknown as HTMLAudioElement, {
      onEnded,
      onError: vi.fn(),
      onTimeUpdate: vi.fn(),
    })
    audio.ended = true
    audio.emit('ended')
    audio.emit('pause')
    expect(onEnded).toHaveBeenCalledOnce()
  })

  it('ignores abort errors from changing src', () => {
    const audio = fakeAudio(1)
    const onError = vi.fn()
    attachAiClip(audio as unknown as HTMLAudioElement, {
      onEnded: vi.fn(),
      onError,
      onTimeUpdate: vi.fn(),
    })
    audio.emit('error')
    expect(onError).not.toHaveBeenCalled()
  })

  it('does not finish a new clip with a stale ended listener', () => {
    const audio = fakeAudio()
    const firstEnded = vi.fn()
    const secondEnded = vi.fn()
    const detach = attachAiClip(audio as unknown as HTMLAudioElement, {
      onEnded: firstEnded,
      onError: vi.fn(),
      onTimeUpdate: vi.fn(),
    })
    detach()
    attachAiClip(audio as unknown as HTMLAudioElement, {
      onEnded: secondEnded,
      onError: vi.fn(),
      onTimeUpdate: vi.fn(),
    })
    audio.ended = true
    audio.emit('ended')
    expect(firstEnded).not.toHaveBeenCalled()
    expect(secondEnded).toHaveBeenCalledOnce()
  })
})
