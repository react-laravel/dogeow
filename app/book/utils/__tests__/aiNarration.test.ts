import { describe, expect, it } from 'vitest'
import {
  getAiNarrationPairUrl,
  getAiNarrationManifestUrl,
  buildAiNarrationPairUrl,
  hasAiNarrationAudio,
  padNarrationPairIndex,
  type AiNarrationCatalog,
} from '../aiNarration'

const catalog: AiNarrationCatalog = {
  defaultVoice: 'serena',
  audioReleases: { luxun: 'presets-1.7b-v1' },
  voices: ['serena', 'uncle_fu'],
  chapters: {
    'luxun:0-0': {
      title: '一件小事',
      voices: {
        serena: [0, 3, 21],
        uncle_fu: [0, 3, 21],
      },
    },
  },
}

describe('ai narration catalog', () => {
  it('pads pair indexes to three digits', () => {
    expect(padNarrationPairIndex(0)).toBe('000')
    expect(padNarrationPairIndex(21)).toBe('021')
  })

  it('builds CDN urls only for catalogued pairs', () => {
    expect(hasAiNarrationAudio('luxun', '0-0', 'serena', catalog)).toBe(true)
    expect(hasAiNarrationAudio('luxun', '0-1', 'serena', catalog)).toBe(false)
    expect(getAiNarrationPairUrl('luxun', '0-0', 3, 'serena', catalog)).toBe(
      'https://upyun.dogeow.com/books/luxun/audio/presets-1.7b-v1/serena/0-0/003.mp3'
    )
    expect(getAiNarrationPairUrl('luxun', '0-0', 3, 'uncle_fu', catalog)).toBe(
      'https://upyun.dogeow.com/books/luxun/audio/presets-1.7b-v1/uncle_fu/0-0/003.mp3'
    )
    expect(getAiNarrationPairUrl('luxun', '0-0', 1, 'serena', catalog)).toBe(
      'https://upyun.dogeow.com/books/luxun/audio/presets-1.7b-v1/serena/0-0/001.mp3'
    )
    expect(getAiNarrationPairUrl('luxun', '0-1', 0, 'serena', catalog)).toBeNull()
  })

  it('ignores the previous release catalog until the new cloud manifest is available', () => {
    expect(hasAiNarrationAudio('luxun', '0-0')).toBe(false)
    expect(getAiNarrationPairUrl('luxun', '0-0', 3)).toBeNull()
    expect(hasAiNarrationAudio('luxun', '0-0', 'serena', { ...catalog, audioReleases: {} })).toBe(
      false
    )
  })

  it.each(['vivian', 'serena', 'uncle_fu'])('uses the new recording release for %s', voice => {
    expect(getAiNarrationManifestUrl('luxun', '0-3', voice)).toBe(
      `https://upyun.dogeow.com/books/luxun/audio/presets-1.7b-v1/${voice}/0-3/manifest.json`
    )
    expect(buildAiNarrationPairUrl('luxun', '0-3', 5, voice)).toBe(
      `https://upyun.dogeow.com/books/luxun/audio/presets-1.7b-v1/${voice}/0-3/005.mp3`
    )
  })

  it('keeps other books on their existing audio paths', () => {
    expect(buildAiNarrationPairUrl('hongloumeng', '1', 5, 'serena')).toBe(
      'https://upyun.dogeow.com/books/hongloumeng/audio/serena/1/005.mp3'
    )
  })
})
