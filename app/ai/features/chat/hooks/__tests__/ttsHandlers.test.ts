import { describe, expect, it, vi } from 'vitest'
import { generateTtsForMessage, playTtsAudio } from '../ttsHandlers'

describe('ttsHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('playTtsAudio', () => {
    it('fetches TTS endpoint and plays audio on success', async () => {
      const audioUrl = 'https://example.com/tts.mp3'
      const mockPlay = vi.fn().mockResolvedValue(undefined)

      // Store original Audio for cleanup
      const OriginalAudio = globalThis.Audio

      class MockAudio {
        src = ''
        constructor(url: string) {
          this.src = url
        }
        play = mockPlay
      }

      vi.stubGlobal('Audio', MockAudio)

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, audioUrl }),
      })
      vi.stubGlobal('fetch', fetchMock)

      await playTtsAudio('你好世界')

      expect(fetchMock).toHaveBeenCalledWith('/api/minimax/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '你好世界' }),
      })
      expect(mockPlay).toHaveBeenCalled()

      // Restore
      vi.stubGlobal('Audio', OriginalAudio)
    })

    it('does not play audio when response is not ok', async () => {
      const mockPlay = vi.fn().mockResolvedValue(undefined)
      const OriginalAudio = globalThis.Audio

      class MockAudio {
        src = ''
        constructor(url: string) {
          this.src = url
        }
        play = mockPlay
      }
      vi.stubGlobal('Audio', MockAudio)

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      })
      vi.stubGlobal('fetch', fetchMock)

      await playTtsAudio('你好世界')

      expect(mockPlay).not.toHaveBeenCalled()
      vi.stubGlobal('Audio', OriginalAudio)
    })

    it('does not play audio when success is false', async () => {
      const mockPlay = vi.fn().mockResolvedValue(undefined)
      const OriginalAudio = globalThis.Audio

      class MockAudio {
        src = ''
        constructor(url: string) {
          this.src = url
        }
        play = mockPlay
      }
      vi.stubGlobal('Audio', MockAudio)

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false }),
      })
      vi.stubGlobal('fetch', fetchMock)

      await playTtsAudio('你好世界')

      expect(mockPlay).not.toHaveBeenCalled()
      vi.stubGlobal('Audio', OriginalAudio)
    })
  })

  describe('generateTtsForMessage', () => {
    it('updates the last message with audioUrl and plays audio', async () => {
      const audioUrl = 'https://example.com/tts.mp3'
      const mockPlay = vi.fn().mockResolvedValue(undefined)
      const OriginalAudio = globalThis.Audio

      class MockAudio {
        src = ''
        constructor(url: string) {
          this.src = url
        }
        play = mockPlay
      }
      vi.stubGlobal('Audio', MockAudio)

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, audioUrl }),
      })
      vi.stubGlobal('fetch', fetchMock)

      const setMessages = vi.fn(
        (
          updater: (
            prev: { id: string; audioUrl?: string }[]
          ) => { id: string; audioUrl?: string }[]
        ) => {
          const result = updater([{ id: 'msg-1' }])
          expect(result).toEqual([{ id: 'msg-1', audioUrl }])
        }
      )

      await generateTtsForMessage('你好世界', setMessages)

      expect(fetchMock).toHaveBeenCalledWith('/api/minimax/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '你好世界' }),
      })
      expect(mockPlay).toHaveBeenCalled()

      vi.stubGlobal('Audio', OriginalAudio)
    })

    it('does not update messages when response is not ok', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      })
      vi.stubGlobal('fetch', fetchMock)

      const setMessages = vi.fn()
      await generateTtsForMessage('你好世界', setMessages)

      expect(setMessages).not.toHaveBeenCalled()
    })

    it('swallows fetch errors gracefully', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      const setMessages = vi.fn()
      await expect(generateTtsForMessage('你好世界', setMessages)).resolves.toBeUndefined()
      expect(setMessages).not.toHaveBeenCalled()
    })
  })
})
