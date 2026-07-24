'use client'

import useSWR, { type SWRConfiguration } from 'swr'

import { get, post } from './core'
import { baseSWRConfig, apiFetcher } from './swr'

export const UNREAD_NOTIFICATIONS_KEY = 'notifications/unread' as const

// 未读通知（拉取时会触发后端「打开时补发汇总推送」）
export interface UnreadNotificationItem {
  id: string
  type: string
  data: {
    title?: string
    body?: string
    url?: string
    icon?: string
    notification_id?: string
  }
  created_at: string
}

export interface UnreadNotificationsResponse {
  count: number
  items: UnreadNotificationItem[]
}

export const fetchUnreadNotifications = () =>
  get<UnreadNotificationsResponse>(UNREAD_NOTIFICATIONS_KEY)

export const useUnreadNotifications = (
  enabled: boolean = true,
  config?: SWRConfiguration<UnreadNotificationsResponse>
) =>
  useSWR<UnreadNotificationsResponse>(enabled ? UNREAD_NOTIFICATIONS_KEY : null, apiFetcher, {
    ...baseSWRConfig,
    revalidateOnFocus: true,
    ...config,
  })

export const markNotificationRead = (id: string) =>
  post<{ message: string }>(`notifications/${id}/read`, {}, { handleError: false })

export const markAllNotificationsRead = () =>
  post<{ message: string }>('notifications/read-all', {}, { handleError: false })
