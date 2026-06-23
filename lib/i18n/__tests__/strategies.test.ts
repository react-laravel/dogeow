import { describe, it, expect } from 'vitest'
import {
  BrowserLanguageStrategy,
  GeolocationStrategy,
  StoredPreferenceStrategy,
} from '../strategies'
import type { DetectionResult } from '../strategies'

describe('strategies/index', () => {
  describe('exports', () => {
    it('should export BrowserLanguageStrategy class', () => {
      expect(BrowserLanguageStrategy).toBeDefined()
      expect(typeof BrowserLanguageStrategy).toBe('function')
    })

    it('should export GeolocationStrategy class', () => {
      expect(GeolocationStrategy).toBeDefined()
      expect(typeof GeolocationStrategy).toBe('function')
    })

    it('should export StoredPreferenceStrategy class', () => {
      expect(StoredPreferenceStrategy).toBeDefined()
      expect(typeof StoredPreferenceStrategy).toBe('function')
    })

    it('should export DetectionResult type', () => {
      // Type check - if this compiles, the type is exported correctly
      const result: DetectionResult = {
        language: 'en',
        confidence: 0.9,
      }
      expect(result.language).toBe('en')
      expect(result.confidence).toBe(0.9)
    })
  })

  describe('BrowserLanguageStrategy instantiation', () => {
    it('should create an instance', () => {
      const strategy = new BrowserLanguageStrategy()
      expect(strategy).toBeInstanceOf(BrowserLanguageStrategy)
    })
  })

  describe('GeolocationStrategy instantiation', () => {
    it('should create an instance', () => {
      const strategy = new GeolocationStrategy()
      expect(strategy).toBeInstanceOf(GeolocationStrategy)
    })
  })

  describe('StoredPreferenceStrategy instantiation', () => {
    it('should create an instance', () => {
      const strategy = new StoredPreferenceStrategy()
      expect(strategy).toBeInstanceOf(StoredPreferenceStrategy)
    })
  })
})
