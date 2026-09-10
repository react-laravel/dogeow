import { describe, expect, it } from 'vitest'
import {
  getAiNarrationPairUrl,
  hasAiNarrationAudio,
  padNarrationPairIndex,
  type AiNarrationCatalog,
} from '../aiNarration'

const catalog: AiNarrationCatalog = {
  defaultVoice: 'serena',
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
      'https://upyun.dogeow.com/books/luxun/audio/serena/0-0/003.mp3'
    )
    expect(getAiNarrationPairUrl('luxun', '0-0', 3, 'uncle_fu', catalog)).toBe(
      'https://upyun.dogeow.com/books/luxun/audio/uncle_fu/0-0/003.mp3'
    )
    expect(getAiNarrationPairUrl('luxun', '0-0', 1, 'serena', catalog)).toBe(
      'https://upyun.dogeow.com/books/luxun/audio/serena/0-0/001.mp3'
    )
    expect(getAiNarrationPairUrl('luxun', '0-1', 0, 'serena', catalog)).toBeNull()
  })

  it('includes the first Lu Xun article in the committed catalog', () => {
    expect(hasAiNarrationAudio('luxun', '0-0')).toBe(true)
    expect(getAiNarrationPairUrl('luxun', '0-0', 3)).toBe(
      'https://upyun.dogeow.com/books/luxun/audio/serena/0-0/003.mp3'
    )
    expect(getAiNarrationPairUrl('luxun', '0-0', 1)).toBe(
      'https://upyun.dogeow.com/books/luxun/audio/serena/0-0/001.mp3'
    )
  })
})
