'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { get, post } from '@/lib/api'
import type { UnreadNotificationsResponse } from '@/lib/api'
import useAuthStore from '@/stores/authStore'
import { Bell, BellOff, BellRing } from 'lucide-react'
import { toast } from 'sonner'
import { isPushSupported, usePushSubscription } from '@/hooks/usePushSubscription'

const fetcher = (url: string) => get<UnreadNotificationsResponse>(url)

type PushPermissionState = NotificationPermission | 'unsupported'

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [pushPermission, setPushPermission] = useState<PushPermissionState>('default')
  const [hasPushSubscription, setHasPushSubscription] = useState(false)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const ref = useRef<HTMLDivElement>(null)
  const {
    register,
    unregister,
    isSupported,
    status: pushStatus,
    errorMessage,
  } = usePushSubscription()

  const { data, mutate } = useSWR<UnreadNotificationsResponse>(
    isAuthenticated ? 'notifications/unread' : null,
    fetcher,
    {
      revalidateOnMount: false,
    }
  )

  const refreshPushState = useCallback(async () => {
    if (!isSupported || typeof Notification === 'undefined') {
      setPushPermission('unsupported')
      setHasPushSubscription(false)
      return
    }

    setPushPermission(Notification.permission)

    if (Notification.permission !== 'granted' || !('serviceWorker' in navigator)) {
      setHasPushSubscription(false)
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setHasPushSubscription(Boolean(subscription))
    } catch {
      setHasPushSubscription(false)
    }
  }, [isSupported])

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // 打开下拉时主动刷新一次，确保列表和角标是最新
  useEffect(() => {
    if (!open || !isAuthenticated) return
    void mutate()
  }, [open, isAuthenticated, mutate])

  useEffect(() => {
    if (pushStatus === 'error' && errorMessage) {
      toast.error(errorMessage)
    }
  }, [pushStatus, errorMessage])

  const handleToggleOpen = () => {
    const nextOpen = !open
    setOpen(nextOpen)
    if (nextOpen) {
      void refreshPushState()
    }
  }

  const handleEnablePush = async () => {
    if (!isSupported || typeof Notification === 'undefined') {
      setPushPermission('unsupported')
      toast.error('当前环境不支持系统通知')
      return
    }

    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
      setPushPermission(permission)
    }

    if (permission !== 'granted') {
      toast.error('请在浏览器或系统设置中允许通知')
      await refreshPushState()
      return
    }

    const ok = await register()
    await refreshPushState()
    if (ok) {
      setHasPushSubscription(true)
      toast.success('系统通知已开启')
    }
  }

  const handleDisablePush = async () => {
    const ok = await unregister()
    await refreshPushState()
    if (ok) {
      setHasPushSubscription(false)
      toast.success('已关闭本站推送')
    }
  }

  const handleMarkRead = async (id: string, url: string) => {
    try {
      await post<{ message: string }>(`notifications/${id}/read`, {})
      mutate()
      // 跳转
      window.location.assign(url)
      setOpen(false)
    } catch {
      toast.error('标记已读失败')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await post<{ message: string }>('notifications/read-all', {})
      mutate()
      toast.success('已全部标记为已读')
      setOpen(false)
    } catch {
      toast.error('标记失败')
    }
  }

  const count = data?.count ?? 0
  const showPushControl = isAuthenticated && pushPermission !== 'unsupported'
  const pushIsLoading = pushStatus === 'loading'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggleOpen}
        className="hover:bg-muted relative flex size-10 items-center justify-center rounded-xl transition-colors"
        aria-label="通知"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="bg-destructive text-white absolute -top-px -right-px flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] font-medium leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="bg-background border-border absolute right-0 top-full z-[100] mt-2 w-80 rounded-lg border shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-medium">通知</span>
            {count > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                全部已读
              </button>
            )}
          </div>

          {showPushControl && (
            <div className="border-b px-4 py-3">
              {pushPermission === 'denied' ? (
                <div className="flex items-start gap-2 text-sm">
                  <BellOff className="text-muted-foreground mt-0.5 h-4 w-4" />
                  <div className="space-y-1">
                    <div className="font-medium">系统通知已被阻止</div>
                    <div className="text-muted-foreground text-xs leading-5">
                      请在浏览器或系统设置中允许通知。
                    </div>
                  </div>
                </div>
              ) : hasPushSubscription ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <BellRing className="text-primary h-4 w-4" />
                    <span className="font-medium">系统通知已开启</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisablePush}
                    disabled={pushIsLoading}
                    className="border-border hover:bg-muted disabled:opacity-60 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    {pushIsLoading ? '关闭中' : '关闭'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Bell className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">
                      {pushPermission === 'granted' ? '系统通知已允许' : '开启系统通知'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleEnablePush}
                    disabled={pushIsLoading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    {pushIsLoading ? '开启中' : '开启'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {!data || data.items.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">暂无未读通知</div>
            ) : (
              data.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleMarkRead(item.id, item.data.url || '/')}
                  className="hover:bg-muted flex w-full flex-col items-start gap-1 border-b px-4 py-3 text-left last:border-0"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium">{item.data.title || '通知'}</span>
                  </div>
                  {item.data.body && (
                    <span className="text-muted-foreground line-clamp-2 text-sm">
                      {item.data.body}
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {new Date(item.created_at).toLocaleString('zh-CN')}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
