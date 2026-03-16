import { describe, expect, it } from 'vitest'
import { shouldUpdatePlayingStateOnPause } from '../playbackStateUtils'

describe('shouldUpdatePlayingStateOnPause', () => {
  it('returns true when not ended and page is visible', () => {
    expect(
      shouldUpdatePlayingStateOnPause({
        isEnded: false,
        isDocumentHidden: false,
      })
    ).toBe(true)
  })

  it('returns false when audio has ended', () => {
    expect(
      shouldUpdatePlayingStateOnPause({
        isEnded: true,
        isDocumentHidden: false,
      })
    ).toBe(false)
  })

  it('returns false when document is hidden', () => {
    expect(
      shouldUpdatePlayingStateOnPause({
        isEnded: false,
        isDocumentHidden: true,
      })
    ).toBe(false)
  })
})
