'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { Bell, BellOff, BellRing, ChevronDown, Loader2, Volume2, VolumeX, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  markAllNotificationsRead,
  markNotificationRead,
  useUnreadNotifications,
  type UnreadNotificationsResponse,
} from '@/lib/api'
import { Switch } from '@/components/ui/switch'
import { BottomHourPicker } from '@/components/ui/bottom-hour-picker'
import { usePushSubscription } from '@/hooks/usePushSubscription'
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from '@/lib/push/notificationPreferences'
import { syncPushNotificationPreferences } from '@/lib/push/serviceWorker'
import useAuthStore from '@/stores/authStore'
import usePushSubscriptionStore from '@/stores/pushSubscriptionStore'

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

function getPushControlLabel(
  permission: ReturnType<typeof usePushSubscriptionStore.getState>['permission'],
  hasSubscription: boolean,
  isLoading: boolean
): string {
  if (isLoading) return '正在注册本站推送…'
  if (hasSubscription) return '系统通知已开启'
  if (permission === 'granted') return '浏览器已授权，本站推送未开启'
  return '开启系统通知'
}

function getSoundSummary(preferences: NotificationPreferences): string {
  if (!preferences.soundEnabled) return '声音已关闭'
  return `声音开启 · ${formatHour(preferences.quietHoursStart)}–${formatHour(preferences.quietHoursEnd)} 静音`
}

function useClickOutside(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void
) {
  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      if (target.closest('[data-slot="sheet-content"], [data-slot="sheet-overlay"]')) {
        return
      }

      if (containerRef.current?.contains(target)) return
      onClose()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, containerRef, onClose])
}

function useSyncedNotificationPreferences() {
  const [preferences, setPreferences] = useState(getNotificationPreferences)
  const preferencesRef = useRef(preferences)
  const revisionRef = useRef(0)
  const confirmedRef = useRef(preferences)
  const confirmedRevisionRef = useRef(0)

  useEffect(() => {
    preferencesRef.current = preferences
  }, [preferences])

  const updatePreferences = useCallback((next: NotificationPreferences) => {
    const previous = preferencesRef.current
    if (!saveNotificationPreferences(next)) {
      saveNotificationPreferences(previous)
      toast.error('通知声音设置无法保存，请检查浏览器存储权限')
      return
    }

    const revision = revisionRef.current + 1
    revisionRef.current = revision
    setPreferences(next)

    void syncPushNotificationPreferences(next)
      .then(() => {
        if (revision <= confirmedRevisionRef.current) return
        confirmedRef.current = next
        confirmedRevisionRef.current = revision
      })
      .catch(() => {
        if (revisionRef.current !== revision) return

        const confirmed = confirmedRef.current
        setPreferences(confirmed)
        saveNotificationPreferences(confirmed)
        void syncPushNotificationPreferences(confirmed).catch(() => undefined)
        toast.error('通知声音设置保存失败，请稍后重试')
      })
  }, [])

  return { preferences, updatePreferences }
}

function SoundSettingsPanel({
  preferences,
  onSoundChange,
  onQuietHoursChange,
}: {
  preferences: NotificationPreferences
  onSoundChange: (enabled: boolean) => void
  onQuietHoursChange: (start: number, end: number) => void
}) {
  return (
    <div id="notification-sound-settings" className="space-y-2 border-t pt-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {preferences.soundEnabled ? (
            <Volume2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <VolumeX className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium">通知声音</div>
            <div className="text-muted-foreground text-xs leading-5">按本设备设置</div>
          </div>
        </div>
        <Switch
          checked={preferences.soundEnabled}
          onCheckedChange={onSoundChange}
          aria-label="通知声音开关"
        />
      </div>

      {preferences.soundEnabled && (
        <div className="bg-muted/40 flex items-center justify-between gap-2 rounded-md p-2">
          <span className="shrink-0 text-xs font-medium">自动静音</span>
          <div className="flex items-center gap-1.5">
            <BottomHourPicker
              id="notification-quiet-start"
              value={preferences.quietHoursStart}
              onChange={hour => onQuietHoursChange(hour, preferences.quietHoursEnd)}
              label="通知静音开始时间"
              title="静音开始时间；支持跨天，开始与结束相同表示不自动静音"
              className="h-8 min-w-[4.25rem] px-2"
            />
            <span className="text-muted-foreground text-xs">至</span>
            <BottomHourPicker
              id="notification-quiet-end"
              value={preferences.quietHoursEnd}
              onChange={hour => onQuietHoursChange(preferences.quietHoursStart, hour)}
              label="通知静音结束时间"
              title="静音结束时间；支持跨天，开始与结束相同表示不自动静音"
              className="h-8 min-w-[4.25rem] px-2"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function PushControls({
  permission,
  hasSubscription,
  isLoading,
  label,
  soundSettingsOpen,
  preferences,
  onToggleSoundSettings,
  onPushSwitchChange,
  onSoundChange,
  onQuietHoursChange,
}: {
  permission: ReturnType<typeof usePushSubscriptionStore.getState>['permission']
  hasSubscription: boolean
  isLoading: boolean
  label: string
  soundSettingsOpen: boolean
  preferences: NotificationPreferences
  onToggleSoundSettings: () => void
  onPushSwitchChange: (checked: boolean) => void
  onSoundChange: (enabled: boolean) => void
  onQuietHoursChange: (start: number, end: number) => void
}) {
  if (permission === 'denied') {
    return (
      <div className="shrink-0 border-b px-4 py-2.5">
        <div className="flex items-start gap-2 text-sm">
          <BellOff className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <div className="font-medium">系统通知已被阻止</div>
            <div className="text-muted-foreground text-xs leading-5">
              请在浏览器或系统设置中允许通知。
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-b px-4 py-2.5">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          {hasSubscription ? (
            <button
              type="button"
              onClick={onToggleSoundSettings}
              className="hover:text-primary flex min-w-0 flex-1 items-center gap-2 text-left text-sm transition-colors"
              aria-expanded={soundSettingsOpen}
              aria-controls="notification-sound-settings"
              aria-label={`${soundSettingsOpen ? '收起' : '展开'}声音与静音设置`}
            >
              {isLoading ? (
                <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <BellRing className="text-primary h-4 w-4 shrink-0" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{label}</span>
                <span className="text-muted-foreground block truncate text-xs">
                  {getSoundSummary(preferences)}
                </span>
              </span>
              <ChevronDown
                className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform ${soundSettingsOpen ? 'rotate-180' : ''}`}
              />
            </button>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
              {isLoading ? (
                <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Bell className="text-muted-foreground h-4 w-4 shrink-0" />
              )}
              <span className="font-medium">{label}</span>
            </div>
          )}
          <Switch
            checked={hasSubscription}
            onCheckedChange={onPushSwitchChange}
            disabled={isLoading}
            aria-label="系统通知开关"
          />
        </div>

        {hasSubscription && soundSettingsOpen && (
          <SoundSettingsPanel
            preferences={preferences}
            onSoundChange={onSoundChange}
            onQuietHoursChange={onQuietHoursChange}
          />
        )}
      </div>
    </div>
  )
}

function NotificationList({
  items,
  onMarkRead,
}: {
  items: UnreadNotificationsResponse['items'] | undefined
  onMarkRead: (id: string, url: string) => void
}) {
  if (!items || items.length === 0) {
    return <div className="text-muted-foreground py-4 text-center text-sm">暂无未读通知</div>
  }

  return (
    <>
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          onClick={() => onMarkRead(item.id, item.data.url || '/')}
          className="hover:bg-muted flex w-full flex-col items-start gap-1 border-b px-4 py-3 text-left last:border-0"
        >
          <span className="font-medium">{item.data.title || '通知'}</span>
          {item.data.body ? (
            <span className="text-muted-foreground line-clamp-2 text-sm">{item.data.body}</span>
          ) : null}
          <span className="text-muted-foreground text-xs">
            {new Date(item.created_at).toLocaleString('zh-CN')}
          </span>
        </button>
      ))}
    </>
  )
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [soundSettingsOpen, setSoundSettingsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const pushPermission = usePushSubscriptionStore(s => s.permission)
  const hasPushSubscription = usePushSubscriptionStore(s => s.hasSubscription)
  const { preferences, updatePreferences } = useSyncedNotificationPreferences()
  const {
    register,
    unregister,
    refreshState,
    isSupported,
    status: pushStatus,
    errorMessage,
  } = usePushSubscription()

  const { data, mutate } = useUnreadNotifications(isAuthenticated, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
  })

  const triggerRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => {
    setOpen(false)
    queueMicrotask(() => triggerRef.current?.focus())
  }, [])
  useClickOutside(open, containerRef, close)

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
    if (!nextOpen) return
    setSoundSettingsOpen(false)
    void refreshState()
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
    if (ok) toast.success('已关闭本站推送')
  }

  const handleMarkRead = async (id: string, url: string) => {
    try {
      await markNotificationRead(id)
      void mutate()
      window.location.assign(url)
      setOpen(false)
    } catch {
      toast.error('标记已读失败')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      void mutate()
      toast.success('已全部标记为已读')
      setOpen(false)
    } catch {
      toast.error('标记失败')
    }
  }

  const count = data?.count ?? 0
  const renderedCount = count > 99 ? '99+' : String(count)
  const showPushControl = isAuthenticated && pushPermission !== 'unsupported'
  const pushIsLoading = pushStatus === 'loading'
  const pushLabel = getPushControlLabel(pushPermission, hasPushSubscription, pushIsLoading)

  const NOTIFICATION_PANEL_ID = 'notification-dropdown-panel'

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggleOpen}
        className="hover:bg-accent/70 relative flex size-10 items-center justify-center rounded-xl transition-colors"
        aria-label={count > 0 ? `通知，${renderedCount} 条未读` : '通知'}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={NOTIFICATION_PANEL_ID}
      >
        <Bell className="h-4 w-4" />
        {count > 0 ? (
          <span className="bg-destructive absolute -top-px -right-px flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] leading-none font-medium text-white">
            {renderedCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={NOTIFICATION_PANEL_ID}
          role="dialog"
          aria-modal="true"
          aria-label="通知面板"
          className="border-border/70 bg-popover/96 text-popover-foreground fixed top-[calc(var(--app-header-total-height)+0.5rem)] right-[max(1rem,env(safe-area-inset-right))] left-[max(1rem,env(safe-area-inset-left))] z-[100] flex max-h-[calc(100dvh-var(--app-header-total-height)-1rem)] flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-2 sm:w-[min(22rem,calc(100vw-2rem))]"
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
            <span className="font-medium">通知</span>
            <div className="flex items-center gap-1">
              {count > 0 ? (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-muted-foreground hover:text-foreground flex min-h-9 items-center rounded-md px-2 text-xs"
                >
                  全部已读
                </button>
              ) : null}
              <button
                type="button"
                onClick={close}
                className="text-muted-foreground hover:text-foreground hover:bg-muted flex size-9 items-center justify-center rounded-lg transition-colors"
                aria-label="关闭通知面板"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showPushControl ? (
            <PushControls
              permission={pushPermission}
              hasSubscription={hasPushSubscription}
              isLoading={pushIsLoading}
              label={pushLabel}
              soundSettingsOpen={soundSettingsOpen}
              preferences={preferences}
              onToggleSoundSettings={() => setSoundSettingsOpen(value => !value)}
              onPushSwitchChange={checked => {
                void (checked ? handleEnablePush() : handleDisablePush())
              }}
              onSoundChange={soundEnabled => updatePreferences({ ...preferences, soundEnabled })}
              onQuietHoursChange={(quietHoursStart, quietHoursEnd) =>
                updatePreferences({ ...preferences, quietHoursStart, quietHoursEnd })
              }
            />
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain sm:max-h-96">
            <NotificationList items={data?.items} onMarkRead={handleMarkRead} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
