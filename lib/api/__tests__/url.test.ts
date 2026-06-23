import { describe, it, expect, vi } from 'vitest'
import { isIpAddress, getApiBaseUrl } from '../url'

describe('isIpAddress', () => {
  it('should detect IPv4 addresses', () => {
    expect(isIpAddress('192.168.1.1')).toBe(true)
    expect(isIpAddress('10.0.0.1')).toBe(true)
    expect(isIpAddress('127.0.0.1')).toBe(true)
    expect(isIpAddress('0.0.0.0')).toBe(true)
    expect(isIpAddress('255.255.255.255')).toBe(true)
  })

  it('should detect IPv6 addresses', () => {
    expect(isIpAddress('::1')).toBe(true)
    expect(isIpAddress('2001:db8::1')).toBe(true)
    expect(isIpAddress('fe80::1')).toBe(true)
  })

  it('should return false for hostnames', () => {
    expect(isIpAddress('localhost')).toBe(false)
    expect(isIpAddress('example.com')).toBe(false)
    expect(isIpAddress('api.example.com')).toBe(false)
  })

  it('should handle edge cases', () => {
    expect(isIpAddress('')).toBe(false)
    expect(isIpAddress('1.2.3')).toBe(false) // incomplete IP
    expect(isIpAddress('1.2.3.4.5')).toBe(false) // too many segments
  })
})

describe('getApiBaseUrl', () => {
  it('should use env variable when available', () => {
    const original = process.env.NEXT_PUBLIC_API_URL
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    expect(getApiBaseUrl()).toBe('https://api.example.com')
    process.env.NEXT_PUBLIC_API_URL = original
  })

  it('should default to localhost:8000', () => {
    const original = process.env.NEXT_PUBLIC_API_URL
    delete process.env.NEXT_PUBLIC_API_URL
    expect(getApiBaseUrl()).toBe('http://localhost:8000')
    process.env.NEXT_PUBLIC_API_URL = original
  })

  it('should use current origin for IP addresses (browser)', () => {
    // In jsdom, mock window.location.hostname to simulate an IP address access
    const originalHostname = window.location.hostname
    const originalOrigin = window.location.origin
    Object.defineProperty(window, 'location', {
      value: {
        hostname: '192.168.1.100',
        origin: 'http://192.168.1.100:3000',
      },
      writable: true,
    })

    try {
      const result = getApiBaseUrl()
      // Should replace :3000 with :8000 for IP addresses
      expect(result).toBe('http://192.168.1.100:8000')
    } finally {
      Object.defineProperty(window, 'location', {
        value: { hostname: originalHostname, origin: originalOrigin },
        writable: true,
      })
    }
  })
})
