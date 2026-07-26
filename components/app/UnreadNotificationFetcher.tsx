'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { BellDot } from 'lucide-react'
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

    toast.message(`你有 ${data.count} 条未读消息`, {
      icon: <BellDot className="h-4 w-4" style={{ color: 'var(--primary)' }} />,
      style: {
        background: 'var(--popover)',
        borderColor: 'var(--border)',
        color: 'var(--popover-foreground)',
        boxShadow: 'var(--surface-shadow-hover)',
      },
      action: {
        label: '查看',
        onClick: () => window.location.assign(viewUrl),
      },
      actionButtonStyle: {
        background: 'var(--primary)',
        color: 'var(--primary-foreground)',
        borderRadius: '0.5rem',
        fontWeight: 600,
      },
    })
  }, [isAuthenticated, data?.count, data?.items])

  return null
}
