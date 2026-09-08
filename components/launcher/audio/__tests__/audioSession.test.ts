import { afterEach, describe, expect, it, vi } from 'vitest'
import { hasPlaybackAudioSession, prepareMusicAudioSession } from '../audioSession'

describe('music audio session', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('requests playback before Web Audio is used', () => {
    const audioSession = { type: 'auto' }
    vi.stubGlobal('navigator', { audioSession })
    prepareMusicAudioSession()
    expect(audioSession.type).toBe('playback')
    expect(hasPlaybackAudioSession()).toBe(true)
  })

  it('preserves an existing recording and playback session', () => {
    const audioSession = { type: 'play-and-record' }
    vi.stubGlobal('navigator', { audioSession })
    prepareMusicAudioSession()
    expect(audioSession.type).toBe('play-and-record')
    expect(hasPlaybackAudioSession()).toBe(true)
  })

  it('does not treat unsupported or rejected session requests as background support', () => {
    vi.stubGlobal('navigator', {})
    expect(prepareMusicAudioSession).not.toThrow()
    expect(hasPlaybackAudioSession()).toBe(false)

    vi.stubGlobal('navigator', {
      audioSession: {
        get type() {
          return 'ambient'
        },
        set type(_value: string) {
          throw new Error('Unavailable')
        },
      },
    })
    expect(prepareMusicAudioSession).not.toThrow()
    expect(hasPlaybackAudioSession()).toBe(false)
  })
})
