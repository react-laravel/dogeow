import { describe, it, expect } from 'vitest'
import { baseSWRConfig, apiFetcher } from '../swr'

describe('baseSWRConfig', () => {
  it('should have correct default config', () => {
    expect(baseSWRConfig.revalidateOnFocus).toBe(false)
    expect(baseSWRConfig.revalidateOnReconnect).toBe(true)
    expect(baseSWRConfig.dedupingInterval).toBe(5000)
    expect(baseSWRConfig.errorRetryCount).toBe(3)
  })
})

describe('apiFetcher', () => {
  it('should be a function', () => {
    expect(typeof apiFetcher).toBe('function')
  })
})
