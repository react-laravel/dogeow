import { act, renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { usePlayPauseEffect } from '../useAudioPlayback/usePlayPauseEffect'

// AudioContext.resume 在 iOS 上可能异步等待；旧请求不能覆盖后来的暂停选择。
it('does not restart playback when the user pauses while the audio context is resuming', async () => {
  let finishResume!: () => void
  const resume = vi.fn(
    () =>
      new Promise<void>(resolve => {
        finishResume = resolve
      })
  )
  const audio = document.createElement('audio')
  audio.src = '/song.mp3'
  audio.play = vi.fn(() => Promise.resolve())
  audio.pause = vi.fn()
  const refs = {
    audioRef: { current: audio },
    audioContextRef: { current: { state: 'suspended', resume } as unknown as AudioContext },
    analyserRef: { current: null },
    sourceRef: { current: null },
    gainNodeRef: { current: null },
  }
  const isPlayingRef = { current: true }
  const sourceRevisionRef = { current: 1 }
  const { rerender } = renderHook(
    ({ isPlaying }) =>
      usePlayPauseEffect({
        playback: {
          isPlaying,
          readyToPlay: true,
          userInteracted: true,
          isTrackChanging: false,
          playMode: 'all',
        },
        settings: { volume: 0.5, isMuted: false },
        refs,
        currentTrack: '/song.mp3',
        initAudioContext: vi.fn(),
        reportPlayError: vi.fn(),
        isPlayingRef,
        sourceRevisionRef,
        playbackResumeNonce: 0,
      }),
    { initialProps: { isPlaying: true } }
  )
  expect(resume).toHaveBeenCalledTimes(1)
  isPlayingRef.current = false
  rerender({ isPlaying: false })
  await act(async () => {
    finishResume()
  })
  expect(audio.pause).toHaveBeenCalled()
  expect(audio.play).not.toHaveBeenCalled()
})
