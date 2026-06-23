import { describe, it, expect } from 'vitest'
import { base64UrlToUint8Array, subscriptionToPayload } from '../push'

describe('base64UrlToUint8Array', () => {
  it('should decode base64url string', () => {
    // Encode "AB" as base64url
    const encoded = 'QUI='
    const result = base64UrlToUint8Array(encoded)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(2)
    expect(result[0]).toBe(65) // 'A'
    expect(result[1]).toBe(66) // 'B'
  })

  it('should handle base64url without padding', () => {
    // "AB" without padding
    const result = base64UrlToUint8Array('QUI')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(2)
  })

  it('should handle URL-safe characters', () => {
    // Base64 with + and / should be converted
    const result = base64UrlToUint8Array('-_')
    expect(result).toBeInstanceOf(Uint8Array)
  })

  it('should handle empty string', () => {
    const result = base64UrlToUint8Array('')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(0)
  })
})

describe('subscriptionToPayload', () => {
  it('should convert PushSubscription to payload', () => {
    const mockKeyP256dh = new Uint8Array([1, 2, 3])
    const mockKeyAuth = new Uint8Array([4, 5, 6])

    const subscription = {
      endpoint: 'https://push.example.com/endpoint',
      getKey: (name: string) => {
        if (name === 'p256dh') return mockKeyP256dh
        if (name === 'auth') return mockKeyAuth
        return null
      },
      toJSON: () => ({
        endpoint: 'https://push.example.com/endpoint',
        keys: {
          p256dh: btoa(String.fromCharCode(...mockKeyP256dh)),
          auth: btoa(String.fromCharCode(...mockKeyAuth)),
        },
      }),
      unsubscribe: vi.fn(),
    } as unknown as PushSubscription

    const payload = subscriptionToPayload(subscription)
    expect(payload.endpoint).toBe('https://push.example.com/endpoint')
    expect(payload.keys.p256dh).toBeTruthy()
    expect(payload.keys.auth).toBeTruthy()
  })

  it('should throw when p256dh key is missing', () => {
    const subscription = {
      endpoint: 'https://push.example.com/endpoint',
      getKey: () => null,
    } as unknown as PushSubscription

    expect(() => subscriptionToPayload(subscription)).toThrow('PushSubscription keys missing')
  })

  it('should throw when auth key is missing', () => {
    const subscription = {
      endpoint: 'https://push.example.com/endpoint',
      getKey: (name: string) => (name === 'p256dh' ? new Uint8Array([1]) : null),
    } as unknown as PushSubscription

    expect(() => subscriptionToPayload(subscription)).toThrow('PushSubscription keys missing')
  })
})
