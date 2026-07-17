'use client'

import { useState, useRef, useEffect } from 'react'
import useSWR from 'swr'
import { get, post } from '@/lib/api'
import type { UnreadNotificationsResponse } from '@/lib/api'
import useAuthStore from '@/stores/authStore'
import usePushSubscriptionStore from '@/stores/pushSubscriptionStore'
import { Switch } from '@/components/ui/switch'
import { BottomHourPicker } from '@/components/ui/bottom-hour-picker'
import { Bell, BellOff, BellRing, ChevronDown, Loader2, Volume2, VolumeX, X } from 'lucide-react'
import { toast } from 'sonner'
import { isPushSupported, usePushSubscription } from '@/hooks/usePushSubscription'
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from '@/lib/push/notificationPreferences'
import { syncPushNotificationPreferences } from '@/lib/push/serviceWorker'

const fetcher = (url: string) => get<UnreadNotificationsResponse>(url)

function getPushControlLabel(
  permission: ReturnType<typeof usePushSubscriptionStore.getState>['permission'],
  hasSubscription: boolean,
  isLoading: boolean
): string {
  if (isLoading) {
    return '正在注册本站推送…'
  }

  if (hasSubscription) {
    return '系统通知已开启'
  }

  if (permission === 'granted') {
    return '浏览器已授权，本站推送未开启'
  }

  return '开启系统通知'
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [soundSettingsOpen, setSoundSettingsOpen] = useState(false)
  const [notificationPreferences, setNotificationPreferences] = useState(() =>
    getNotificationPreferences()
  )
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const ref = useRef<HTMLDivElement>(null)
  const preferencesRevisionRef = useRef(0)
  const confirmedPreferencesRef = useRef(notificationPreferences)
  const confirmedPreferencesRevisionRef = useRef(0)
  const pushPermission = usePushSubscriptionStore(s => s.permission)
  const hasPushSubscription = usePushSubscriptionStore(s => s.hasSubscription)
  const {
    register,
    unregister,
    refreshState,
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

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (
        e.target instanceof Element &&
        e.target.closest('[data-slot="sheet-content"], [data-slot="sheet-overlay"]')
      ) {
        return
      }

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
      setSoundSettingsOpen(false)
      void refreshState()
    }
  }

  const handleEnablePush = async () => {
    if (!isSupported || typeof Notification === 'undefined') {
      toast.error('当前环境不支持系统通知')
      return
    }

    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
      usePushSubscriptionStore.setState({ permission })
    }

    if (permission !== 'granted') {
      toast.error('请在浏览器或系统设置中允许通知')
      await refreshState()
      return
    }

    const ok = await register()
    if (ok) {
      toast.success('系统通知已开启')
    } else {
      await refreshState()
    }
  }

  const handleDisablePush = async () => {
    const ok = await unregister()
    await refreshState()
    if (ok) {
      toast.success('已关闭本站推送')
    }
  }

  const handlePushSwitchChange = async (checked: boolean) => {
    if (checked) {
      await handleEnablePush()
    } else {
      await handleDisablePush()
    }
  }

  const updateNotificationPreferences = (preferences: NotificationPreferences) => {
    const previousPreferences = notificationPreferences
    if (!saveNotificationPreferences(preferences)) {
      saveNotificationPreferences(previousPreferences)
      toast.error('通知声音设置无法保存，请检查浏览器存储权限')
      return
    }

    const revision = preferencesRevisionRef.current + 1
    preferencesRevisionRef.current = revision
    setNotificationPreferences(preferences)
    void syncPushNotificationPreferences(preferences)
      .then(() => {
        if (revision <= confirmedPreferencesRevisionRef.current) return
        confirmedPreferencesRef.current = preferences
        confirmedPreferencesRevisionRef.current = revision
      })
      .catch(() => {
        if (preferencesRevisionRef.current !== revision) return

        const confirmedPreferences = confirmedPreferencesRef.current
        setNotificationPreferences(confirmedPreferences)
        saveNotificationPreferences(confirmedPreferences)
        void syncPushNotificationPreferences(confirmedPreferences).catch(() => undefined)
        toast.error('通知声音设置保存失败，请稍后重试')
      })
  }

  const handleSoundSwitchChange = (checked: boolean) => {
    updateNotificationPreferences({
      ...notificationPreferences,
      soundEnabled: checked,
    })
  }

  const handleQuietHoursChange = (quietHoursStart: number, quietHoursEnd: number) => {
    updateNotificationPreferences({
      ...notificationPreferences,
      quietHoursStart,
      quietHoursEnd,
    })
  }

  const handleMarkRead = async (id: string, url: string) => {
    try {
      await post<{ message: string }>(`notifications/${id}/read`, {})
      mutate()
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
  const pushLabel = getPushControlLabel(pushPermission, hasPushSubscription, pushIsLoading)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggleOpen}
        className="hover:bg-accent/70 relative flex size-10 items-center justify-center rounded-xl transition-colors"
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
        <div className="border-border/70 bg-popover/96 text-popover-foreground fixed top-[calc(var(--app-header-total-height)+0.5rem)] right-[max(1rem,env(safe-area-inset-right))] left-[max(1rem,env(safe-area-inset-left))] z-[100] flex max-h-[calc(100dvh-var(--app-header-total-height)-1rem)] flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-2 sm:w-[min(22rem,calc(100vw-2rem))]">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
            <span className="font-medium">通知</span>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-muted-foreground hover:text-foreground flex min-h-9 items-center rounded-md px-2 text-xs"
                >
                  全部已读
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted flex size-9 items-center justify-center rounded-lg transition-colors"
                aria-label="关闭通知面板"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showPushControl && (
            <div className="shrink-0 border-b px-4 py-2.5">
              {pushPermission === 'denied' ? (
                <div className="flex items-start gap-2 text-sm">
                  <BellOff className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                  <div className="space-y-1">
                    <div className="font-medium">系统通知已被阻止</div>
                    <div className="text-muted-foreground text-xs leading-5">
                      请在浏览器或系统设置中允许通知。
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    {hasPushSubscription ? (
                      <button
                        type="button"
                        onClick={() => setSoundSettingsOpen(value => !value)}
                        className="hover:text-primary flex min-w-0 flex-1 items-center gap-2 text-left text-sm transition-colors"
                        aria-expanded={soundSettingsOpen}
                        aria-controls="notification-sound-settings"
                        aria-label={`${soundSettingsOpen ? '收起' : '展开'}声音与静音设置`}
                      >
                        {pushIsLoading ? (
                          <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
                        ) : (
                          <BellRing className="text-primary h-4 w-4 shrink-0" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{pushLabel}</span>
                          <span className="text-muted-foreground block truncate text-xs">
                            {notificationPreferences.soundEnabled
                              ? `声音开启 · ${String(notificationPreferences.quietHoursStart).padStart(2, '0')}:00–${String(notificationPreferences.quietHoursEnd).padStart(2, '0')}:00 静音`
                              : '声音已关闭'}
                          </span>
                        </span>
                        <ChevronDown
                          className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform ${soundSettingsOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                    ) : (
                      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                        {pushIsLoading ? (
                          <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
                        ) : (
                          <Bell className="text-muted-foreground h-4 w-4 shrink-0" />
                        )}
                        <span className="font-medium">{pushLabel}</span>
                      </div>
                    )}
                    <Switch
                      checked={hasPushSubscription}
                      onCheckedChange={handlePushSwitchChange}
                      disabled={pushIsLoading}
                      aria-label="系统通知开关"
                    />
                  </div>

                  {hasPushSubscription && soundSettingsOpen && (
                    <div id="notification-sound-settings" className="space-y-2 border-t pt-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-2">
                          {notificationPreferences.soundEnabled ? (
                            <Volume2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                          ) : (
                            <VolumeX className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-medium">通知声音</div>
                            <div className="text-muted-foreground text-xs leading-5">
                              按本设备设置
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={notificationPreferences.soundEnabled}
                          onCheckedChange={handleSoundSwitchChange}
                          aria-label="通知声音开关"
                        />
                      </div>

                      {notificationPreferences.soundEnabled && (
                        <div className="bg-muted/40 flex items-center justify-between gap-2 rounded-md p-2">
                          <span className="shrink-0 text-xs font-medium">自动静音</span>
                          <div className="flex items-center gap-1.5">
                            <BottomHourPicker
                              id="notification-quiet-start"
                              value={notificationPreferences.quietHoursStart}
                              onChange={hour =>
                                handleQuietHoursChange(hour, notificationPreferences.quietHoursEnd)
                              }
                              label="通知静音开始时间"
                              title="静音开始时间；支持跨天，开始与结束相同表示不自动静音"
                              className="h-8 min-w-[4.25rem] px-2"
                            />
                            <span className="text-muted-foreground text-xs">至</span>
                            <BottomHourPicker
                              id="notification-quiet-end"
                              value={notificationPreferences.quietHoursEnd}
                              onChange={hour =>
                                handleQuietHoursChange(
                                  notificationPreferences.quietHoursStart,
                                  hour
                                )
                              }
                              label="通知静音结束时间"
                              title="静音结束时间；支持跨天，开始与结束相同表示不自动静音"
                              className="h-8 min-w-[4.25rem] px-2"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain sm:max-h-96">
            {!data || data.items.length === 0 ? (
              <div className="text-muted-foreground py-4 text-center text-sm">暂无未读通知</div>
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
