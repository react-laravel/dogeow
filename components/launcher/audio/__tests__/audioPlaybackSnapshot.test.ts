import { describe, expect, it, vi } from 'vitest'
import {
  applyPlaybackSnapshotSync,
  capturePlaybackSnapshot,
  resumePlaybackFromSnapshot,
} from '../audioPlaybackSnapshot'

describe('audioPlaybackSnapshot', () => {
  it('captures and applies src synchronously', () => {
    const audio = document.createElement('audio')
    audio.src = 'https://example.com/a.mp3'
    audio.dataset.trackSrc = 'https://example.com/a.mp3'
    audio.currentTime = 12.5
    audio.volume = 0.6
    audio.muted = true

    const snapshot = capturePlaybackSnapshot(audio, true)
    const next = document.createElement('audio')

    const needsSrcUpdate = applyPlaybackSnapshotSync(next, snapshot)

    expect(needsSrcUpdate).toBe(true)
    expect(next.src).toBe(snapshot.src)
    expect(next.dataset.trackSrc).toBe(snapshot.trackSrc)
    expect(next.volume).toBe(0.6)
    expect(next.muted).toBe(true)
  })

  it('resumes playback after metadata when needed', async () => {
    const audio = document.createElement('audio')
    const play = vi.spyOn(audio, 'play').mockResolvedValue(undefined)

    Object.defineProperty(audio, 'readyState', {
      configurable: true,
      get: () => HTMLMediaElement.HAVE_METADATA,
    })

    await resumePlaybackFromSnapshot(
      audio,
      {
        src: 'https://example.com/b.mp3',
        trackSrc: null,
        currentTime: 3,
        volume: 1,
        muted: false,
        wasPlaying: true,
      },
      false
    )

    expect(play).toHaveBeenCalled()
    expect(audio.currentTime).toBe(3)
  })
})
