import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getNotificationPreferences,
  getNotificationSoundEnabled,
  NOTIFICATION_QUIET_END_STORAGE_KEY,
  NOTIFICATION_QUIET_START_STORAGE_KEY,
  NOTIFICATION_SOUND_STORAGE_KEY,
  saveNotificationPreferences,
  saveNotificationSoundEnabled,
} from '../notificationPreferences'

describe('notification preferences', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('enables notification sounds by default', () => {
    expect(getNotificationSoundEnabled()).toBe(true)
    expect(getNotificationPreferences()).toEqual(DEFAULT_NOTIFICATION_PREFERENCES)
  })

  it('restores a disabled sound preference', () => {
    window.localStorage.setItem(NOTIFICATION_SOUND_STORAGE_KEY, 'false')

    expect(getNotificationSoundEnabled()).toBe(false)
    expect(getNotificationPreferences()).toEqual({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      soundEnabled: false,
    })
  })

  it('persists sound preference changes', () => {
    expect(saveNotificationSoundEnabled(false)).toBe(true)

    expect(window.localStorage.getItem(NOTIFICATION_SOUND_STORAGE_KEY)).toBe('false')
  })

  it('persists a custom cross-midnight quiet period', () => {
    const preferences = {
      soundEnabled: true,
      quietHoursStart: 23,
      quietHoursEnd: 8,
    }

    expect(saveNotificationPreferences(preferences)).toBe(true)

    expect(getNotificationPreferences()).toEqual(preferences)
    expect(window.localStorage.getItem(NOTIFICATION_QUIET_START_STORAGE_KEY)).toBe('23')
    expect(window.localStorage.getItem(NOTIFICATION_QUIET_END_STORAGE_KEY)).toBe('8')
  })

  it('falls back to default hours for invalid stored values', () => {
    window.localStorage.setItem(NOTIFICATION_QUIET_START_STORAGE_KEY, '24')
    window.localStorage.setItem(NOTIFICATION_QUIET_END_STORAGE_KEY, '7.5')

    expect(getNotificationPreferences()).toEqual(DEFAULT_NOTIFICATION_PREFERENCES)
  })
})
