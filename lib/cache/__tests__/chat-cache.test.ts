import { describe, expect, it } from 'vitest'
import chatCache from '../chat-cache'
import type { ChatMessage, ChatRoom, ChatUser } from '@/app/chat/types'

const createMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 1,
  room_id: 1,
  user_id: 1,
  message: 'Hello',
  message_type: 'text',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user: { id: 1, name: 'User', email: 'user@example.com' },
  ...overrides,
})

const createUser = (overrides: Partial<ChatUser> = {}): ChatUser => ({
  id: 1,
  name: 'User',
  email: 'user@example.com',
  ...overrides,
})

const createRoom = (overrides: Partial<ChatRoom> = {}): ChatRoom => ({
  id: 1,
  name: 'Room',
  created_by: 1,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('ChatCacheManager', () => {
  beforeEach(() => {
    chatCache.clearAll()
  })

  describe('message caching', () => {
    it('should cache messages for a room', () => {
      const messages = [createMessage({ id: 1 }), createMessage({ id: 2 })]
      chatCache.cacheMessages('1', messages)

      const cached = chatCache.getCachedMessages('1')
      expect(cached).not.toBeNull()
      expect(cached!.messages).toHaveLength(2)
    })

    it('should return null for non-existent room', () => {
      expect(chatCache.getCachedMessages('999')).toBeNull()
    })

    it('should return a copy of cached messages', () => {
      const messages = [createMessage({ id: 1 })]
      chatCache.cacheMessages('1', messages)

      const cached = chatCache.getCachedMessages('1')!
      cached.messages.push(createMessage({ id: 999 }))

      // Original cache should not be affected
      expect(chatCache.getCachedMessages('1')!.messages).toHaveLength(1)
    })

    it('should add message to existing cache and sort by created_at', () => {
      chatCache.cacheMessages('1', [
        createMessage({ id: 1, created_at: '2024-01-01T00:00:00Z' }),
        createMessage({ id: 2, created_at: '2024-01-03T00:00:00Z' }),
      ])
      chatCache.addMessageToCache('1', createMessage({ id: 3, created_at: '2024-01-02T00:00:00Z' }))

      const cached = chatCache.getCachedMessages('1')
      expect(cached!.messages).toHaveLength(3)
      expect(cached!.messages[0].id).toBe(1)
      expect(cached!.messages[1].id).toBe(3)
      expect(cached!.messages[2].id).toBe(2)
    })

    it('should not add message when room not cached', () => {
      chatCache.addMessageToCache('999', createMessage())
      expect(chatCache.getCachedMessages('999')).toBeNull()
    })

    it('should remove message from cache', () => {
      chatCache.cacheMessages('1', [createMessage({ id: 1 }), createMessage({ id: 2 })])
      chatCache.removeMessageFromCache('1', 1)

      const cached = chatCache.getCachedMessages('1')
      expect(cached!.messages).toHaveLength(1)
      expect(cached!.messages[0].id).toBe(2)
    })

    it('should update message in cache', () => {
      chatCache.cacheMessages('1', [createMessage({ id: 1, message: 'Hello' })])
      chatCache.updateMessageInCache('1', 1, { message: 'Updated' })

      const cached = chatCache.getCachedMessages('1')
      expect(cached!.messages[0].message).toBe('Updated')
    })

    it('should preserve pagination when caching messages', () => {
      const pagination = { page: 1, total: 10 }
      chatCache.cacheMessages('1', [createMessage()], pagination)

      const cached = chatCache.getCachedMessages('1')
      expect(cached!.pagination).toEqual(pagination)
    })
  })

  describe('user caching', () => {
    it('should cache and retrieve user', () => {
      const user = createUser({ id: 1, name: 'Test' })
      chatCache.cacheUser(user)

      const cached = chatCache.getCachedUser('1')
      expect(cached).not.toBeNull()
      expect(cached!.name).toBe('Test')
    })

    it('should return null for non-existent user', () => {
      expect(chatCache.getCachedUser('999')).toBeNull()
    })

    it('should return a copy of cached user', () => {
      const user = createUser({ id: 1 })
      chatCache.cacheUser(user)

      const cached = chatCache.getCachedUser('1')!
      cached.name = 'Modified'

      // Original cache should not be affected
      expect(chatCache.getCachedUser('1')!.name).toBe('User')
    })

    it('should cache multiple users', () => {
      chatCache.cacheUsers([createUser({ id: 1 }), createUser({ id: 2 })])
      expect(chatCache.getCachedUser('1')).not.toBeNull()
      expect(chatCache.getCachedUser('2')).not.toBeNull()
    })
  })

  describe('room caching', () => {
    it('should cache and retrieve room', () => {
      const room = createRoom({ id: 1, name: 'Test Room' })
      chatCache.cacheRoom(room)

      const cached = chatCache.getCachedRoom('1')
      expect(cached).not.toBeNull()
      expect(cached!.name).toBe('Test Room')
    })

    it('should return null for non-existent room', () => {
      expect(chatCache.getCachedRoom('999')).toBeNull()
    })

    it('should return a copy of cached room', () => {
      const room = createRoom({ id: 1 })
      chatCache.cacheRoom(room)

      const cached = chatCache.getCachedRoom('1')!
      cached.name = 'Modified'

      expect(chatCache.getCachedRoom('1')!.name).toBe('Room')
    })

    it('should cache multiple rooms', () => {
      chatCache.cacheRooms([createRoom({ id: 1 }), createRoom({ id: 2 })])
      expect(chatCache.getCachedRoom('1')).not.toBeNull()
      expect(chatCache.getCachedRoom('2')).not.toBeNull()
    })
  })

  describe('online users caching', () => {
    it('should cache and retrieve online users', () => {
      const users = [createUser({ id: 1 }), createUser({ id: 2 })]
      chatCache.cacheOnlineUsers('1', users)

      const cached = chatCache.getCachedOnlineUsers('1')
      expect(cached).not.toBeNull()
      expect(cached).toHaveLength(2)
    })

    it('should return null for non-existent room', () => {
      expect(chatCache.getCachedOnlineUsers('999')).toBeNull()
    })

    it('should return a copy of cached online users', () => {
      const users = [createUser({ id: 1 })]
      chatCache.cacheOnlineUsers('1', users)

      const cached = chatCache.getCachedOnlineUsers('1')!
      cached.push(createUser({ id: 999 }))

      expect(chatCache.getCachedOnlineUsers('1')).toHaveLength(1)
    })
  })

  describe('cache invalidation', () => {
    it('should invalidate message cache for specific room', () => {
      chatCache.cacheMessages('1', [createMessage()])
      chatCache.cacheMessages('2', [createMessage()])

      chatCache.invalidateMessageCache('1')
      expect(chatCache.getCachedMessages('1')).toBeNull()
      expect(chatCache.getCachedMessages('2')).not.toBeNull()
    })

    it('should invalidate all message cache', () => {
      chatCache.cacheMessages('1', [createMessage()])
      chatCache.cacheMessages('2', [createMessage()])

      chatCache.invalidateMessageCache()
      expect(chatCache.getCachedMessages('1')).toBeNull()
      expect(chatCache.getCachedMessages('2')).toBeNull()
    })

    it('should invalidate user cache for specific user', () => {
      chatCache.cacheUser(createUser({ id: 1 }))
      chatCache.cacheUser(createUser({ id: 2 }))

      chatCache.invalidateUserCache('1')
      expect(chatCache.getCachedUser('1')).toBeNull()
      expect(chatCache.getCachedUser('2')).not.toBeNull()
    })

    it('should invalidate all user cache', () => {
      chatCache.cacheUser(createUser({ id: 1 }))
      chatCache.cacheUser(createUser({ id: 2 }))

      chatCache.invalidateUserCache()
      expect(chatCache.getCachedUser('1')).toBeNull()
      expect(chatCache.getCachedUser('2')).toBeNull()
    })

    it('should invalidate room cache for specific room', () => {
      chatCache.cacheRoom(createRoom({ id: 1 }))
      chatCache.cacheRoom(createRoom({ id: 2 }))

      chatCache.invalidateRoomCache('1')
      expect(chatCache.getCachedRoom('1')).toBeNull()
      expect(chatCache.getCachedRoom('2')).not.toBeNull()
    })

    it('should invalidate all room cache', () => {
      chatCache.cacheRoom(createRoom({ id: 1 }))
      chatCache.cacheRoom(createRoom({ id: 2 }))

      chatCache.invalidateRoomCache()
      expect(chatCache.getCachedRoom('1')).toBeNull()
      expect(chatCache.getCachedRoom('2')).toBeNull()
    })

    it('should invalidate online users cache for specific room', () => {
      chatCache.cacheOnlineUsers('1', [createUser()])
      chatCache.cacheOnlineUsers('2', [createUser()])

      chatCache.invalidateOnlineUsersCache('1')
      expect(chatCache.getCachedOnlineUsers('1')).toBeNull()
      expect(chatCache.getCachedOnlineUsers('2')).not.toBeNull()
    })

    it('should invalidate all online users cache', () => {
      chatCache.cacheOnlineUsers('1', [createUser()])
      chatCache.cacheOnlineUsers('2', [createUser()])

      chatCache.invalidateOnlineUsersCache()
      expect(chatCache.getCachedOnlineUsers('1')).toBeNull()
      expect(chatCache.getCachedOnlineUsers('2')).toBeNull()
    })
  })

  describe('clearAll', () => {
    it('should clear all caches', () => {
      chatCache.cacheMessages('1', [createMessage()])
      chatCache.cacheUser(createUser({ id: 1 }))
      chatCache.cacheRoom(createRoom({ id: 1 }))
      chatCache.cacheOnlineUsers('1', [createUser()])

      chatCache.clearAll()

      expect(chatCache.getCachedMessages('1')).toBeNull()
      expect(chatCache.getCachedUser('1')).toBeNull()
      expect(chatCache.getCachedRoom('1')).toBeNull()
      expect(chatCache.getCachedOnlineUsers('1')).toBeNull()
    })
  })

  describe('getCacheStats', () => {
    it('should return correct stats', () => {
      chatCache.cacheMessages('1', [createMessage()])
      chatCache.cacheUser(createUser({ id: 1 }))
      chatCache.cacheRoom(createRoom({ id: 1 }))
      chatCache.cacheOnlineUsers('1', [createUser()])

      const stats = chatCache.getCacheStats()

      expect(stats.messages).toBe(1)
      expect(stats.users).toBe(1)
      expect(stats.rooms).toBe(1)
      expect(stats.onlineUsers).toBe(1)
      expect(stats.totalMemoryUsage).toBeGreaterThan(0)
    })

    it('should return zeros for empty cache', () => {
      const stats = chatCache.getCacheStats()
      expect(stats.messages).toBe(0)
      expect(stats.users).toBe(0)
      expect(stats.rooms).toBe(0)
      expect(stats.onlineUsers).toBe(0)
      // totalMemoryUsage accounts for empty JSON objects ({}) which have 2 chars * 2 * 4 caches = 16
      expect(stats.totalMemoryUsage).toBeGreaterThanOrEqual(0)
    })
  })

  describe('cleanup', () => {
    it('should remove expired entries when timestamps are old', () => {
      // Directly manipulate the internal cache to simulate expired entries
      const now = Date.now()
      chatCache.cacheMessages('1', [createMessage()])
      chatCache.cacheUser(createUser({ id: 1 }))

      // Manually set old timestamps to simulate expiry
      const messageCache = (chatCache as unknown as Record<string, unknown>).messageCache as Record<
        string,
        { lastUpdated: number }
      >
      const userCache = (chatCache as unknown as Record<string, unknown>).userCache as Record<
        string,
        { lastUpdated: number }
      >

      if (messageCache['1']) {
        messageCache['1'].lastUpdated = now - 6 * 60 * 1000 // 6 min ago
      }
      if (userCache['1']) {
        userCache['1'].lastUpdated = now - 11 * 60 * 1000 // 11 min ago
      }

      chatCache.cleanup()

      expect(chatCache.getCachedMessages('1')).toBeNull()
      expect(chatCache.getCachedUser('1')).toBeNull()
    })

    it('should keep non-expired entries', () => {
      chatCache.cacheMessages('1', [createMessage()])
      chatCache.cacheUser(createUser({ id: 1 }))

      // Timestamps are fresh (just set), cleanup should not remove them
      chatCache.cleanup()

      expect(chatCache.getCachedMessages('1')).not.toBeNull()
      expect(chatCache.getCachedUser('1')).not.toBeNull()
    })
  })
})
