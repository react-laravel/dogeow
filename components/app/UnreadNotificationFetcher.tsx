'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useUnreadNotifications } from '@/lib/api'
import useAuthStore from '@/stores/authStore'

const UNREAD_TOAST_SESSION_KEY = 'unread-notification-toast-shown'

function markUnreadToastShown(): boolean {
  try {
    if (sessionStorage.getItem(UNREAD_TOAST_SESSION_KEY)) return false
    sessionStorage.setItem(UNREAD_TOAST_SESSION_KEY, '1')
    return true
  } catch {
    return false
  }
}

function resolveUnreadViewUrl(items: { data?: { url?: string } }[] | undefined): string {
  const fromItem = items?.find(item => item.data?.url)?.data?.url
  if (fromItem && fromItem.startsWith('/')) return fromItem
  return '/'
}

/**
 * 登录状态下拉取未读通知：触发后端「打开时补发汇总推送」；
 * 若有未读且本次会话未提示过，则 Toast 一次。
 */
export function UnreadNotificationFetcher() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const { data } = useUnreadNotifications(isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated || !data?.count) return
    if (!markUnreadToastShown()) return

    const viewUrl = resolveUnreadViewUrl(data.items)

    toast.info(`你有 ${data.count} 条未读消息`, {
      action: {
        label: '查看',
        onClick: () => window.location.assign(viewUrl),
      },
    })
  }, [isAuthenticated, data?.count, data?.items])

  return null
}
