import { describe, it, expect, vi, beforeEach } from 'vitest'

// The log-control module exports a singleton and convenience functions, not the class
import {
  logControl,
  shouldLogDetection,
  shouldLogStore,
  shouldLogPrompt,
  shouldLogVerbose,
} from '../log-control'

const createLocalStorageMock = () => {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
  }
}

describe('log-control (singleton)', () => {
  let mockLocalStorage: ReturnType<typeof createLocalStorageMock>

  beforeEach(() => {
    mockLocalStorage = createLocalStorageMock()
    vi.clearAllMocks()

    // Reset logControl to default state
    logControl.updateOptions({
      verbose: true,
      showDetection: true,
      showStore: true,
      showPrompt: true,
    })
  })

  describe('shouldLogDetection', () => {
    it('should return true by default', () => {
      expect(shouldLogDetection()).toBe(true)
    })

    it('should return false when verbose is false', () => {
      logControl.updateOptions({ verbose: false })
      expect(shouldLogDetection()).toBe(false)
    })

    it('should return false when showDetection is false', () => {
      logControl.updateOptions({ showDetection: false })
      expect(shouldLogDetection()).toBe(false)
    })
  })

  describe('shouldLogStore', () => {
    it('should return true by default', () => {
      expect(shouldLogStore()).toBe(true)
    })

    it('should return false when verbose is false', () => {
      logControl.updateOptions({ verbose: false })
      expect(shouldLogStore()).toBe(false)
    })

    it('should return false when showStore is false', () => {
      logControl.updateOptions({ showStore: false })
      expect(shouldLogStore()).toBe(false)
    })
  })

  describe('shouldLogPrompt', () => {
    it('should return true by default', () => {
      expect(shouldLogPrompt()).toBe(true)
    })

    it('should return false when verbose is false', () => {
      logControl.updateOptions({ verbose: false })
      expect(shouldLogPrompt()).toBe(false)
    })

    it('should return false when showPrompt is false', () => {
      logControl.updateOptions({ showPrompt: false })
      expect(shouldLogPrompt()).toBe(false)
    })
  })

  describe('shouldLogVerbose', () => {
    it('should return true by default', () => {
      expect(shouldLogVerbose()).toBe(true)
    })

    it('should return false when verbose is false', () => {
      logControl.updateOptions({ verbose: false })
      expect(shouldLogVerbose()).toBe(false)
    })
  })

  describe('getOptions', () => {
    it('should return a copy of current options', () => {
      const options = logControl.getOptions()
      expect(options).toEqual({
        verbose: true,
        showDetection: true,
        showStore: true,
        showPrompt: true,
      })
    })

    it('should return updated options', () => {
      logControl.updateOptions({ verbose: false, showDetection: false })
      const options = logControl.getOptions()
      expect(options.verbose).toBe(false)
      expect(options.showDetection).toBe(false)
      expect(options.showStore).toBe(true) // unchanged
      expect(options.showPrompt).toBe(true) // unchanged
    })
  })

  describe('updateOptions', () => {
    it('should update specific options', () => {
      logControl.updateOptions({ verbose: false })
      expect(logControl.getOptions().verbose).toBe(false)
      expect(logControl.getOptions().showDetection).toBe(true) // unchanged
    })

    it('should update multiple options', () => {
      logControl.updateOptions({
        verbose: false,
        showDetection: false,
        showStore: false,
        showPrompt: false,
      })
      const options = logControl.getOptions()
      expect(options).toEqual({
        verbose: false,
        showDetection: false,
        showStore: false,
        showPrompt: false,
      })
    })

    it('should save options to localStorage when window is available', () => {
      global.window = {
        localStorage: mockLocalStorage,
      } as unknown as Window & { localStorage: Storage }

      logControl.updateOptions({ verbose: false })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'dogeow-log-control',
        expect.stringContaining('"verbose":false')
      )
    })
  })
})
