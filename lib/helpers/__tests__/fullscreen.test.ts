import { describe, expect, it, vi, beforeEach } from 'vitest'
import { exitFullscreen, fullscreen, isFullscreen } from '../fullscreen'

describe('fullscreen', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('fullscreen', () => {
    it('should throw when browser does not support fullscreen', () => {
      const docElm = document.documentElement
      // Remove all fullscreen methods
      const originalRequest = docElm.requestFullscreen
      const originalWebkit = docElm.webkitRequestFullscreen
      const originalMoz = docElm.mozRequestFullScreen
      const originalMs = docElm.msRequestFullscreen

      ;(docElm as unknown as Record<string, unknown>).requestFullscreen = undefined
      ;(docElm as unknown as Record<string, unknown>).webkitRequestFullscreen = undefined
      ;(docElm as unknown as Record<string, unknown>).mozRequestFullScreen = undefined
      ;(docElm as unknown as Record<string, unknown>).msRequestFullscreen = undefined

      expect(() => fullscreen()).toThrow('您所使用的浏览器不支持全屏')

      // Restore
      ;(docElm as unknown as Record<string, unknown>).requestFullscreen = originalRequest
      ;(docElm as unknown as Record<string, unknown>).webkitRequestFullscreen = originalWebkit
      ;(docElm as unknown as Record<string, unknown>).mozRequestFullScreen = originalMoz
      ;(docElm as unknown as Record<string, unknown>).msRequestFullscreen = originalMs
    })

    it('should call requestFullscreen when supported', () => {
      const mockRequestFullscreen = vi.fn()
      const docElm = document.documentElement as unknown as Record<string, unknown>
      const original = docElm.requestFullscreen

      docElm.requestFullscreen = mockRequestFullscreen

      fullscreen()

      expect(mockRequestFullscreen).toHaveBeenCalled()

      docElm.requestFullscreen = original
    })

    it('should fallback to webkitRequestFullscreen', () => {
      const mockWebkit = vi.fn()
      const docElm = document.documentElement as unknown as Record<string, unknown>
      const originalRequest = docElm.requestFullscreen
      const originalWebkit = docElm.webkitRequestFullscreen

      docElm.requestFullscreen = undefined
      docElm.webkitRequestFullscreen = mockWebkit

      fullscreen()

      expect(mockWebkit).toHaveBeenCalled()

      docElm.requestFullscreen = originalRequest
      docElm.webkitRequestFullscreen = originalWebkit
    })
  })

  describe('exitFullscreen', () => {
    it('should throw when browser does not support exit fullscreen', () => {
      const doc = document as unknown as Record<string, unknown>
      const originalExit = doc.exitFullscreen
      const originalWebkit = doc.webkitExitFullscreen
      const originalMoz = doc.mozCancelFullScreen
      const originalMs = doc.msExitFullscreen

      doc.exitFullscreen = undefined
      doc.webkitExitFullscreen = undefined
      doc.mozCancelFullScreen = undefined
      doc.msExitFullscreen = undefined

      expect(() => exitFullscreen()).toThrow('您所使用的浏览器不支持退出全屏，请按 ESC')

      doc.exitFullscreen = originalExit
      doc.webkitExitFullscreen = originalWebkit
      doc.mozCancelFullScreen = originalMoz
      doc.msExitFullscreen = originalMs
    })

    it('should call exitFullscreen when supported', () => {
      const mockExit = vi.fn()
      const doc = document as unknown as Record<string, unknown>
      const original = doc.exitFullscreen

      doc.exitFullscreen = mockExit

      exitFullscreen()

      expect(mockExit).toHaveBeenCalled()

      doc.exitFullscreen = original
    })
  })

  describe('isFullscreen', () => {
    it('should return true when fullscreenElement exists', () => {
      const doc = document as unknown as Record<string, unknown>
      const original = doc.fullscreenElement

      doc.fullscreenElement = document.body

      expect(isFullscreen()).toBe(true)

      doc.fullscreenElement = original
    })

    it('should return true when webkitFullscreenElement exists', () => {
      const doc = document as unknown as Record<string, unknown>
      const original = doc.fullscreenElement

      doc.fullscreenElement = undefined
      doc.webkitFullscreenElement = document.body

      expect(isFullscreen()).toBe(true)

      doc.fullscreenElement = original
      delete doc.webkitFullscreenElement
    })

    it('should return false when no fullscreenElement', () => {
      const doc = document as unknown as Record<string, unknown>
      const original = doc.fullscreenElement

      doc.fullscreenElement = null
      ;(doc as Record<string, unknown>).webkitFullscreenElement = null
      ;(doc as Record<string, unknown>).mozFullScreenElement = null
      ;(doc as Record<string, unknown>).msFullscreenElement = null

      expect(isFullscreen()).toBe(false)

      doc.fullscreenElement = original
    })
  })
})
