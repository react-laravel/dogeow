'use client'

export const NOTIFICATION_SOUND_STORAGE_KEY = 'dogeow:notification-sound-enabled'
export const NOTIFICATION_QUIET_START_STORAGE_KEY = 'dogeow:notification-quiet-start-hour'
export const NOTIFICATION_QUIET_END_STORAGE_KEY = 'dogeow:notification-quiet-end-hour'

export interface NotificationPreferences {
  soundEnabled: boolean
  quietHoursStart: number
  quietHoursEnd: number
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  quietHoursStart: 22,
  quietHoursEnd: 9,
}

function normalizeHour(value: string | null, fallback: number): number {
  if (value === null || value.trim() === '') return fallback

  const hour = Number(value)
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : fallback
}

export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_NOTIFICATION_PREFERENCES
  }

  try {
    return {
      soundEnabled: window.localStorage.getItem(NOTIFICATION_SOUND_STORAGE_KEY) !== 'false',
      quietHoursStart: normalizeHour(
        window.localStorage.getItem(NOTIFICATION_QUIET_START_STORAGE_KEY),
        DEFAULT_NOTIFICATION_PREFERENCES.quietHoursStart
      ),
      quietHoursEnd: normalizeHour(
        window.localStorage.getItem(NOTIFICATION_QUIET_END_STORAGE_KEY),
        DEFAULT_NOTIFICATION_PREFERENCES.quietHoursEnd
      ),
    }
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES
  }
}

export function saveNotificationPreferences(preferences: NotificationPreferences): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    window.localStorage.setItem(NOTIFICATION_SOUND_STORAGE_KEY, String(preferences.soundEnabled))
    window.localStorage.setItem(
      NOTIFICATION_QUIET_START_STORAGE_KEY,
      String(preferences.quietHoursStart)
    )
    window.localStorage.setItem(
      NOTIFICATION_QUIET_END_STORAGE_KEY,
      String(preferences.quietHoursEnd)
    )
    return true
  } catch {
    return false
  }
}

export function getNotificationSoundEnabled(): boolean {
  return getNotificationPreferences().soundEnabled
}

export function saveNotificationSoundEnabled(enabled: boolean): boolean {
  return saveNotificationPreferences({
    ...getNotificationPreferences(),
    soundEnabled: enabled,
  })
}
