import { describe, it, expect, vi } from 'vitest'

// Mock get from core since fetchCurrentUser uses it
const mockGet = vi.fn()

vi.mock('../core', () => ({
  get: (...args: any[]) => mockGet(...args),
}))

import { fetchCurrentUser } from '../user'

describe('fetchCurrentUser', () => {
  it('should call get with /user endpoint', async () => {
    const mockUser = { id: 1, name: 'Alice', email: 'alice@example.com' }
    mockGet.mockResolvedValue({ user: mockUser })

    const result = await fetchCurrentUser()
    expect(mockGet).toHaveBeenCalledWith('/user')
    expect(result).toEqual(mockUser)
  })

  it('should return user directly when response is not wrapped', async () => {
    const mockUser = { id: 1, name: 'Alice', email: 'alice@example.com' }
    mockGet.mockResolvedValue(mockUser)

    const result = await fetchCurrentUser()
    expect(result).toEqual(mockUser)
  })

  it('should handle API error', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))

    await expect(fetchCurrentUser()).rejects.toThrow('Network error')
  })

  it('should return payload as-is when user property is null', async () => {
    mockGet.mockResolvedValue({ user: null })

    const result = await fetchCurrentUser()
    // resolveUserPayload: 'user' in payload && payload.user → null is falsy, falls to (payload as User)
    expect(result).toEqual({ user: null })
  })
})
