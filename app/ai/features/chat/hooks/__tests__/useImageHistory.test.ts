import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useImageHistory } from '../useImageHistory'

describe('useImageHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem('minimax_image_history')
    localStorage.removeItem('minimax_video_history')
  })

  describe('initial state', () => {
    it('starts with empty histories', () => {
      const { result } = renderHook(() => useImageHistory())
      expect(result.current.imageHistory).toEqual([])
      expect(result.current.videoHistory).toEqual([])
    })

    it('loads existing history from localStorage', () => {
      const imageItems = [
        { id: 'img-1', url: 'https://example.com/1.png', prompt: 'cat', createdAt: 1000 },
      ]
      localStorage.setItem('minimax_image_history', JSON.stringify(imageItems))

      const { result } = renderHook(() => useImageHistory())
      expect(result.current.imageHistory).toHaveLength(1)
      expect(result.current.imageHistory[0].url).toBe('https://example.com/1.png')
    })
  })

  describe('addImage', () => {
    it('adds a new image to history', async () => {
      const { result } = renderHook(() => useImageHistory())

      act(() => {
        result.current.addImage('https://example.com/new.png', 'a cat')
      })

      expect(result.current.imageHistory).toHaveLength(1)
      expect(result.current.imageHistory[0].url).toBe('https://example.com/new.png')
      expect(result.current.imageHistory[0].prompt).toBe('a cat')
      expect(result.current.imageHistory[0].id).toBeTruthy()
    })

    it('prepends new images to the front', async () => {
      const { result } = renderHook(() => useImageHistory())

      act(() => {
        result.current.addImage('https://example.com/first.png', 'first')
      })
      act(() => {
        result.current.addImage('https://example.com/second.png', 'second')
      })

      expect(result.current.imageHistory[0].url).toBe('https://example.com/second.png')
      expect(result.current.imageHistory[1].url).toBe('https://example.com/first.png')
    })

    it('respects MAX_ITEMS limit', async () => {
      const { result } = renderHook(() => useImageHistory())

      for (let i = 0; i < 55; i++) {
        act(() => {
          result.current.addImage(`https://example.com/${i}.png`, `prompt ${i}`)
        })
      }

      expect(result.current.imageHistory.length).toBeLessThanOrEqual(50)
    })

    it('persists to localStorage', async () => {
      const { result } = renderHook(() => useImageHistory())

      act(() => {
        result.current.addImage('https://example.com/persist.png', 'persist')
      })

      const stored = JSON.parse(localStorage.getItem('minimax_image_history') || '[]')
      expect(stored).toHaveLength(1)
      expect(stored[0].url).toBe('https://example.com/persist.png')
    })
  })

  describe('removeImage', () => {
    it('removes an image by id', async () => {
      localStorage.setItem(
        'minimax_image_history',
        JSON.stringify([
          { id: 'a', url: 'https://a.png', prompt: 'a', createdAt: 1000 },
          { id: 'b', url: 'https://b.png', prompt: 'b', createdAt: 2000 },
        ])
      )

      const { result } = renderHook(() => useImageHistory())
      expect(result.current.imageHistory).toHaveLength(2)

      act(() => {
        result.current.removeImage('a')
      })

      expect(result.current.imageHistory).toHaveLength(1)
      expect(result.current.imageHistory[0].id).toBe('b')
    })

    it('does nothing when id does not exist', async () => {
      localStorage.setItem(
        'minimax_image_history',
        JSON.stringify([{ id: 'a', url: 'https://a.png', prompt: 'a', createdAt: 1000 }])
      )

      const { result } = renderHook(() => useImageHistory())

      act(() => {
        result.current.removeImage('nonexistent')
      })

      expect(result.current.imageHistory).toHaveLength(1)
    })
  })

  describe('clearImages', () => {
    it('clears all images and removes from localStorage', async () => {
      localStorage.setItem(
        'minimax_image_history',
        JSON.stringify([{ id: 'a', url: 'https://a.png', prompt: 'a', createdAt: 1000 }])
      )

      const { result } = renderHook(() => useImageHistory())
      expect(result.current.imageHistory).toHaveLength(1)

      act(() => {
        result.current.clearImages()
      })

      expect(result.current.imageHistory).toHaveLength(0)
      expect(localStorage.getItem('minimax_image_history')).toBeNull()
    })
  })

  describe('video history', () => {
    it('adds a new video to history', async () => {
      const { result } = renderHook(() => useImageHistory())

      act(() => {
        result.current.addVideo('task-1', 'https://example.com/v.mp4', 'a video')
      })

      expect(result.current.videoHistory).toHaveLength(1)
      expect(result.current.videoHistory[0].fileId).toBe('task-1')
      expect(result.current.videoHistory[0].url).toBe('https://example.com/v.mp4')
      expect(result.current.videoHistory[0].prompt).toBe('a video')
    })

    it('clears all videos and removes from localStorage', async () => {
      localStorage.setItem(
        'minimax_video_history',
        JSON.stringify([
          { id: 'v1', fileId: 'task-1', url: 'https://v.mp4', prompt: 'v', createdAt: 1000 },
        ])
      )

      const { result } = renderHook(() => useImageHistory())

      act(() => {
        result.current.clearVideos()
      })

      expect(result.current.videoHistory).toHaveLength(0)
      expect(localStorage.getItem('minimax_video_history')).toBeNull()
    })
  })

  describe('corrupt localStorage', () => {
    it('handles corrupt image history gracefully', () => {
      localStorage.setItem('minimax_image_history', 'not-json')
      const { result } = renderHook(() => useImageHistory())
      expect(result.current.imageHistory).toEqual([])
    })

    it('handles corrupt video history gracefully', () => {
      localStorage.setItem('minimax_video_history', 'not-json')
      const { result } = renderHook(() => useImageHistory())
      expect(result.current.videoHistory).toEqual([])
    })
  })
})
