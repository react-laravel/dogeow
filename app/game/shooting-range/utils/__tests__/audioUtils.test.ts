import { describe, expect, it, vi } from 'vitest'
import { playSound, playShotSound, playExplosionSound, playHitSound } from '../audioUtils'

describe('shooting-range audioUtils', () => {
  describe('playSound', () => {
    it('should not throw when Audio constructor is available', () => {
      expect(() => {
        playSound('/sounds/test.mp3', 0.5)
      }).not.toThrow()
    })

    it('should accept custom volume', () => {
      expect(() => {
        playSound('/sounds/test.mp3', 0.8)
      }).not.toThrow()
    })

    it('should accept custom playback rate', () => {
      expect(() => {
        playSound('/sounds/test.mp3', 0.5, 1.5)
      }).not.toThrow()
    })

    it('should accept maxDuration', () => {
      expect(() => {
        playSound('/sounds/test.mp3', 0.5, 1.0, 1000)
      }).not.toThrow()
    })

    it('should use default parameters', () => {
      expect(() => {
        playSound('/sounds/test.mp3')
      }).not.toThrow()
    })
  })

  describe('playShotSound', () => {
    it('should not throw', () => {
      expect(() => {
        playShotSound()
      }).not.toThrow()
    })
  })

  describe('playExplosionSound', () => {
    it('should not throw', () => {
      expect(() => {
        playExplosionSound()
      }).not.toThrow()
    })
  })

  describe('playHitSound', () => {
    it('should not throw', () => {
      expect(() => {
        playHitSound()
      }).not.toThrow()
    })
  })
})
