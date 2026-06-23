import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadOptionalNodeModule } from '../optional-node-module'

const originalWindow = global.window
const originalGetBuiltinModule = process.getBuiltinModule
const originalCwd = process.cwd

describe('optional-node-module', () => {
  beforeEach(() => {
    // Simulate Node.js environment
    // @ts-expect-error - clearing for test
    global.window = undefined
  })

  afterEach(() => {
    global.window = originalWindow
    // Restore process.getBuiltinModule
    Object.defineProperty(process, 'getBuiltinModule', {
      value: originalGetBuiltinModule,
      writable: true,
      configurable: true,
    })
    ;(process as NodeJS.Process).cwd = originalCwd
  })

  describe('loadOptionalNodeModule', () => {
    it('should return null in browser environment', () => {
      global.window = {} as Window
      const result = loadOptionalNodeModule('fs')
      expect(result).toBeNull()
    })

    it('should return null when getBuiltinModule is not available', () => {
      global.window = undefined
      Object.defineProperty(process, 'getBuiltinModule', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const result = loadOptionalNodeModule('fs')
      expect(result).toBeNull()
    })

    it('should return null when createRequire is not available', () => {
      global.window = undefined
      Object.defineProperty(process, 'getBuiltinModule', {
        value: () => ({}),
        writable: true,
        configurable: true,
      })

      const result = loadOptionalNodeModule('fs')
      expect(result).toBeNull()
    })

    it('should return module when successfully loaded', () => {
      global.window = undefined
      const mockModule = { hello: 'world', version: '1.0.0' }
      // createRequire returns a require function, which returns the module
      const mockRequire = vi.fn(() => mockModule)
      const mockModuleLoader = { createRequire: vi.fn(() => mockRequire) }

      Object.defineProperty(process, 'getBuiltinModule', {
        value: () => mockModuleLoader,
        writable: true,
        configurable: true,
      })
      ;(process as NodeJS.Process).cwd = () => '/test'

      const result = loadOptionalNodeModule('some-module')
      expect(result).toEqual(mockModule)
      // createRequire is called with cwd/package.json, the returned require is called with the specifier
      expect(mockRequire).toHaveBeenCalledWith('some-module')
    })

    it('should return null when require throws', () => {
      global.window = undefined
      const mockRequire = vi.fn(() => {
        throw new Error('Module not found')
      })
      const mockModuleLoader = { createRequire: mockRequire }

      Object.defineProperty(process, 'getBuiltinModule', {
        value: () => mockModuleLoader,
        writable: true,
        configurable: true,
      })
      ;(process as NodeJS.Process).cwd = () => '/test'

      const result = loadOptionalNodeModule('nonexistent-module')
      expect(result).toBeNull()
    })

    it('should type-cast the result', () => {
      global.window = undefined
      interface TestModule {
        version: string
      }
      const mockModule: TestModule = { version: '1.0.0' }
      const mockRequire = vi.fn(() => mockModule)
      const mockModuleLoader = { createRequire: vi.fn(() => mockRequire) }

      Object.defineProperty(process, 'getBuiltinModule', {
        value: () => mockModuleLoader,
        writable: true,
        configurable: true,
      })
      ;(process as NodeJS.Process).cwd = () => '/test'

      const result = loadOptionalNodeModule<TestModule>('some-module')
      expect(result?.version).toBe('1.0.0')
    })
  })
})
