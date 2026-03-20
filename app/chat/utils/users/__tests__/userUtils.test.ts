import { describe, it, expect } from 'vitest'
import { userRoleUtils, type UserRole } from '../userUtils'
import type { OnlineUser } from '@/app/chat/types'

describe('userRoleUtils', () => {
  describe('isAdmin', () => {
    it('should return true only when user.role is admin', () => {
      const adminUser: OnlineUser = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      const regularUser: OnlineUser = {
        id: 2,
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user',
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      const moderatorUser: OnlineUser = {
        id: 3,
        name: 'Moderator User',
        email: 'mod@example.com',
        role: 'moderator',
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      expect(userRoleUtils.isAdmin(adminUser)).toBe(true)
      expect(userRoleUtils.isAdmin(regularUser)).toBe(false)
      expect(userRoleUtils.isAdmin(moderatorUser)).toBe(false)
    })

    it('should NOT determine admin status by email containing "admin"', () => {
      // This was the previous vulnerable implementation that allowed privilege escalation
      // A user could set their email to 'hacker@admin.com' and gain admin access
      const maliciousUser: OnlineUser = {
        id: 4,
        name: 'Malicious User',
        email: 'hacker@admin.com', // Attempting to exploit old email-based check
        role: 'user', // But actual role is 'user'
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      // Security fix: email-based privilege escalation should NOT work
      expect(userRoleUtils.isAdmin(maliciousUser)).toBe(false)
    })

    it('should NOT determine admin status by email containing "admin" with various patterns', () => {
      const exploitUsers: OnlineUser[] = [
        {
          id: 10,
          name: 'Exploit 1',
          email: 'admin@example.com',
          role: 'user',
          joined_at: '2024-01-01T00:00:00Z',
          is_online: true,
        },
        {
          id: 11,
          name: 'Exploit 2',
          email: 'admin@legit.com',
          role: 'user',
          joined_at: '2024-01-01T00:00:00Z',
          is_online: true,
        },
        {
          id: 12,
          name: 'Exploit 3',
          email: 'notanadmin@admin.xyz',
          role: 'user',
          joined_at: '2024-01-01T00:00:00Z',
          is_online: true,
        },
      ]

      // None of these email patterns should grant admin access
      for (const user of exploitUsers) {
        expect(userRoleUtils.isAdmin(user)).toBe(false)
      }
    })

    it('should handle user without role field (defaults to not admin)', () => {
      const userWithoutRole: OnlineUser = {
        id: 5,
        name: 'No Role User',
        email: 'norole@example.com',
        // role is not defined
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      expect(userRoleUtils.isAdmin(userWithoutRole)).toBe(false)
    })
  })

  describe('isModerator', () => {
    it('should return true when user.role is moderator or admin', () => {
      const adminUser: OnlineUser = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      const moderatorUser: OnlineUser = {
        id: 2,
        name: 'Moderator User',
        email: 'mod@example.com',
        role: 'moderator',
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      const regularUser: OnlineUser = {
        id: 3,
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user',
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      expect(userRoleUtils.isModerator(adminUser)).toBe(true)
      expect(userRoleUtils.isModerator(moderatorUser)).toBe(true)
      expect(userRoleUtils.isModerator(regularUser)).toBe(false)
    })

    it('should NOT determine moderator status by email containing "mod" or "admin"', () => {
      // Old vulnerable implementation allowed email-based privilege escalation
      const maliciousModerator: OnlineUser = {
        id: 4,
        name: 'Fake Moderator',
        email: 'super@mod.com', // Attempting to exploit old email-based check
        role: 'user', // But actual role is 'user'
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      const maliciousAdmin: OnlineUser = {
        id: 5,
        name: 'Fake Admin',
        email: 'admin@hack.com', // Attempting to exploit old email-based check
        role: 'user', // But actual role is 'user'
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      // Security fix: email-based privilege escalation should NOT work
      expect(userRoleUtils.isModerator(maliciousModerator)).toBe(false)
      expect(userRoleUtils.isModerator(maliciousAdmin)).toBe(false)
    })

    it('should handle user without role field (defaults to not moderator)', () => {
      const userWithoutRole: OnlineUser = {
        id: 6,
        name: 'No Role User',
        email: 'norole@example.com',
        // role is not defined
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      expect(userRoleUtils.isModerator(userWithoutRole)).toBe(false)
    })
  })

  describe('getUserRole', () => {
    it('should return correct role for admin, moderator, and user', () => {
      const adminUser: OnlineUser = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      const moderatorUser: OnlineUser = {
        id: 2,
        name: 'Moderator User',
        email: 'mod@example.com',
        role: 'moderator',
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      const regularUser: OnlineUser = {
        id: 3,
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user',
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      expect(userRoleUtils.getUserRole(adminUser)).toBe('admin')
      expect(userRoleUtils.getUserRole(moderatorUser)).toBe('moderator')
      expect(userRoleUtils.getUserRole(regularUser)).toBe('user')
    })

    it('should return user for user without role field', () => {
      const userWithoutRole: OnlineUser = {
        id: 4,
        name: 'No Role User',
        email: 'norole@example.com',
        // role is not defined
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      expect(userRoleUtils.getUserRole(userWithoutRole)).toBe('user')
    })

    it('should NOT determine role by email patterns', () => {
      // These users are trying to exploit the old email-based privilege escalation
      const exploitUsers: Array<{ user: OnlineUser; expectedRole: UserRole }> = [
        {
          user: {
            id: 10,
            name: 'Exploit 1',
            email: 'admin@evil.com',
            role: 'user',
            joined_at: '2024-01-01T00:00:00Z',
            is_online: true,
          },
          expectedRole: 'user',
        },
        {
          user: {
            id: 11,
            name: 'Exploit 2',
            email: 'moderator@evil.com',
            role: 'user',
            joined_at: '2024-01-01T00:00:00Z',
            is_online: true,
          },
          expectedRole: 'user',
        },
        {
          user: {
            id: 12,
            name: 'Exploit 3',
            email: 'superadmin@evil.com',
            role: 'user',
            joined_at: '2024-01-01T00:00:00Z',
            is_online: true,
          },
          expectedRole: 'user',
        },
      ]

      for (const { user, expectedRole } of exploitUsers) {
        expect(userRoleUtils.getUserRole(user)).toBe(expectedRole)
      }
    })
  })
})
