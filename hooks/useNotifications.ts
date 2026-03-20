'use client'

import { useEffect, useCallback, useRef } from 'react'
import useChatStore from '@/app/chat/chatStore'
import NotificationService from '@/lib/services/notificationService'

// Value Objects for notification parameters (resolves Long Parameter List code smell)
export interface NewMessageNotificationParams {
  roomId: number
  senderName: string
  message: string
}

export interface MentionNotificationParams {
  roomId: number
  messageId: number
  senderName: string
  message: string
}

export interface UserPresenceNotificationParams {
  roomId: number
  userName: string
}

interface UseNotificationsOptions {
  enableSounds?: boolean
  enableBrowserNotifications?: boolean
}

interface NotificationDecision {
  shouldPlaySound: boolean
  shouldShowBrowser: boolean
  isCurrentRoom: boolean
  isTabInactive: boolean
}

// DRY: Extract shared notification decision logic
function getNotificationDecision(
  roomId: number,
  rooms: { id: number; name: string }[],
  currentRoom: { id: number } | null,
  notificationSettings: {
    browserNotifications: boolean
    soundNotifications: boolean
    mentionNotifications?: boolean
    roomNotifications?: boolean
  },
  browserNotificationPermission: NotificationPermission,
  options: UseNotificationsOptions,
  requiresCurrentRoom = false
): { decision: NotificationDecision; room: { id: number; name: string } | undefined } {
  const room = rooms.find(r => r.id === roomId)
  if (!room) {
    return {
      decision: { shouldPlaySound: false, shouldShowBrowser: false, isCurrentRoom: false, isTabInactive: false },
      room: undefined,
    }
  }

  const shouldPlaySound = notificationSettings.soundNotifications && options.enableSounds !== false
  const shouldShowBrowser =
    notificationSettings.browserNotifications &&
    options.enableBrowserNotifications !== false &&
    browserNotificationPermission === 'granted'

  const isCurrentRoom = currentRoom?.id === roomId
  const isTabInactive = typeof document !== 'undefined' && document.hidden

  // Skip if requires current room and not in it
  if (requiresCurrentRoom && !isCurrentRoom) {
    return {
      decision: { shouldPlaySound: false, shouldShowBrowser: false, isCurrentRoom: false, isTabInactive: false },
      room,
    }
  }

  return { decision: { shouldPlaySound, shouldShowBrowser, isCurrentRoom, isTabInactive }, room }
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    currentRoom,
    rooms,
    notificationSettings,
    browserNotificationPermission,
    requestBrowserNotificationPermission,
  } = useChatStore()

  const notificationService = useRef(NotificationService.getInstance())
  const visibilityCleanupRef = useRef<(() => void) | null>(null)

  // Initialize notification service and request permissions
  useEffect(() => {
    const initializeNotifications = async () => {
      if (
        notificationSettings.browserNotifications &&
        browserNotificationPermission === 'default'
      ) {
        await requestBrowserNotificationPermission()
      }
    }

    initializeNotifications()
  }, [
    notificationSettings.browserNotifications,
    browserNotificationPermission,
    requestBrowserNotificationPermission,
  ])

  // Handle visibility changes for notification management
  useEffect(() => {
    if (visibilityCleanupRef.current) {
      visibilityCleanupRef.current()
    }

    visibilityCleanupRef.current = notificationService.current.onVisibilityChange(isHidden => {
      if (!isHidden && currentRoom) {
        useChatStore.getState().clearRoomNotifications(currentRoom.id)
      }
    })

    return () => {
      if (visibilityCleanupRef.current) {
        visibilityCleanupRef.current()
      }
    }
  }, [currentRoom])

  // DRY: Centralized notification execution
  const executeNotification = useCallback(
    (
      notificationType: 'message' | 'mention' | 'join' | 'leave',
      room: { id: number; name: string },
      decision: NotificationDecision,
      extra?: { messageId?: number; senderName?: string; message?: string }
    ) => {
      if (decision.shouldShowBrowser) {
        switch (notificationType) {
          case 'message':
            notificationService.current.notifyNewMessage({
              roomName: room.name,
              senderName: extra?.senderName || '',
              message: extra?.message || '',
              roomId: room.id,
              playSound: decision.shouldPlaySound,
            })
            break
          case 'mention':
            notificationService.current.notifyMention({
              roomName: room.name,
              senderName: extra?.senderName || '',
              message: extra?.message || '',
              roomId: room.id,
              messageId: extra?.messageId || 0,
              playSound: decision.shouldPlaySound,
            })
            break
          case 'join':
            notificationService.current.notifyUserJoined({
              roomName: room.name,
              userName: extra?.senderName || '',
              roomId: room.id,
              playSound: decision.shouldPlaySound,
            })
            break
          case 'leave':
            notificationService.current.notifyUserLeft({
              roomName: room.name,
              userName: extra?.senderName || '',
              roomId: room.id,
              playSound: decision.shouldPlaySound,
            })
            break
        }
      } else if (decision.shouldPlaySound) {
        const soundName = notificationType === 'message' ? 'message' :
          notificationType === 'mention' ? 'mention' :
            notificationType === 'join' ? 'join' : 'leave'
        const volume = notificationType === 'message' || notificationType === 'mention' ? undefined : 0.3
        notificationService.current.playSound(soundName, { volume })
      }
    },
    []
  )

  // Notification methods using shared logic
  const notifyNewMessage = useCallback(
    (params: NewMessageNotificationParams) => {
      const { decision, room } = getNotificationDecision(
        params.roomId,
        rooms,
        currentRoom,
        {
          browserNotifications: notificationSettings.browserNotifications,
          soundNotifications: notificationSettings.soundNotifications,
          roomNotifications: notificationSettings.roomNotifications,
        },
        browserNotificationPermission,
        options
      )

      if (!decision.isCurrentRoom || decision.isTabInactive) {
        executeNotification('message', room!, decision, {
          senderName: params.senderName,
          message: params.message,
        })
      }
    },
    [
      rooms,
      currentRoom,
      notificationSettings,
      browserNotificationPermission,
      options,
      executeNotification,
    ]
  )

  const notifyMention = useCallback(
    (params: MentionNotificationParams) => {
      const { decision, room } = getNotificationDecision(
        params.roomId,
        rooms,
        currentRoom,
        {
          browserNotifications: notificationSettings.browserNotifications,
          soundNotifications: notificationSettings.soundNotifications,
          mentionNotifications: notificationSettings.mentionNotifications,
        },
        browserNotificationPermission,
        options
      )

      if (decision.shouldShowBrowser || decision.shouldPlaySound) {
        executeNotification('mention', room!, decision, {
          senderName: params.senderName,
          message: params.message,
          messageId: params.messageId,
        })
      }
    },
    [
      rooms,
      notificationSettings,
      browserNotificationPermission,
      options,
      executeNotification,
    ]
  )

  const notifyUserJoined = useCallback(
    (params: UserPresenceNotificationParams) => {
      const { decision, room } = getNotificationDecision(
        params.roomId,
        rooms,
        currentRoom,
        notificationSettings,
        browserNotificationPermission,
        options,
        true // requires current room
      )

      if (decision.shouldShowBrowser || decision.shouldPlaySound) {
        executeNotification('join', room!, decision, {
          senderName: params.userName,
        })
      }
    },
    [
      rooms,
      currentRoom,
      notificationSettings,
      browserNotificationPermission,
      options,
      executeNotification,
    ]
  )

  const notifyUserLeft = useCallback(
    (params: UserPresenceNotificationParams) => {
      const { decision, room } = getNotificationDecision(
        params.roomId,
        rooms,
        currentRoom,
        notificationSettings,
        browserNotificationPermission,
        options,
        true // requires current room
      )

      if (decision.shouldShowBrowser || decision.shouldPlaySound) {
        executeNotification('leave', room!, decision, {
          senderName: params.userName,
        })
      }
    },
    [
      rooms,
      currentRoom,
      notificationSettings,
      browserNotificationPermission,
      options,
      executeNotification,
    ]
  )

  const playSound = useCallback(
    (soundName: string, volume?: number) => {
      if (notificationSettings.soundNotifications && options.enableSounds !== false) {
        notificationService.current.playSound(soundName, { volume })
      }
    },
    [notificationSettings.soundNotifications, options.enableSounds]
  )

  const requestPermission = useCallback(async () => {
    return await requestBrowserNotificationPermission()
  }, [requestBrowserNotificationPermission])

  const isNotificationSupported = useCallback(() => {
    return notificationService.current.isNotificationSupported()
  }, [])

  const isTabInactive = useCallback(() => {
    return notificationService.current.isTabInactive()
  }, [])

  return {
    notifyNewMessage,
    notifyMention,
    notifyUserJoined,
    notifyUserLeft,
    playSound,
    requestPermission,
    isNotificationSupported,
    isTabInactive,
    notificationSettings,
    browserNotificationPermission,
  }
}

export default useNotifications
