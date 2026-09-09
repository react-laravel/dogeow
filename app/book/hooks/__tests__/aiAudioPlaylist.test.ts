import { describe, expect, it, vi } from 'vitest'
import { bindAiPlaylistAudio } from '../aiAudioPlaylist'

function fakeAudio() {
  const listeners = new Map<string, Array<() => void>>()
  return {
    ended: false,
    paused: false,
    duration: 10,
    currentTime: 0,
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

describe('bindAiPlaylistAudio', () => {
  it('advances once when ended and pause both fire', () => {
    const audio = fakeAudio()
    const onEnded = vi.fn()
    const binding = bindAiPlaylistAudio(audio as unknown as HTMLAudioElement, {
      shouldIgnore: () => false,
      onEnded,
      onError: vi.fn(),
      onTimeUpdate: vi.fn(),
    })
    binding.arm()
    audio.ended = true
    audio.emit('ended')
    audio.emit('pause')
    expect(onEnded).toHaveBeenCalledOnce()
  })

  it('can advance again after arm()', () => {
    const audio = fakeAudio()
    const onEnded = vi.fn()
    const binding = bindAiPlaylistAudio(audio as unknown as HTMLAudioElement, {
      shouldIgnore: () => false,
      onEnded,
      onError: vi.fn(),
      onTimeUpdate: vi.fn(),
    })
    binding.arm()
    audio.ended = true
    audio.emit('ended')
    binding.arm()
    audio.emit('ended')
    expect(onEnded).toHaveBeenCalledTimes(2)
  })
})
