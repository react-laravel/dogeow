'use client'

import React, { memo, useRef, useState } from 'react'
import Link from 'next/link'
import { User, LayoutDashboard, LogOut, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTranslation } from '@/hooks/useTranslation'
import useAuthStore from '@/stores/authStore'
import { toast } from 'sonner'
import { ChangePasswordDialog } from './ChangePasswordDialog'

interface UserButtonProps {
  isAuthenticated: boolean
  onToggleAuth: () => void
}

export const UserButton = memo<UserButtonProps>(({ isAuthenticated, onToggleAuth }) => {
  const { t } = useTranslation()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const openingDialogRef = useRef(false)
  const logoutPendingRef = useRef(false)
  const [open, setOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)

  const openAccountDialog = (type: 'password' | 'logout') => {
    openingDialogRef.current = true
    setOpen(false)
    if (type === 'password') setChangePasswordOpen(true)
    else setConfirmingLogout(true)
  }

  const handleLogoutConfirm = async () => {
    if (logoutPendingRef.current) return
    logoutPendingRef.current = true
    setLoggingOut(true)
    try {
      await logout()
      toast.success('已退出登录', { position: 'top-center' })
      setConfirmingLogout(false)
    } catch {
      toast.error('退出登录失败，请稍后重试', { position: 'top-center' })
    } finally {
      logoutPendingRef.current = false
      setLoggingOut(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Button
        type="button"
        variant="default"
        className="h-10 rounded-xl px-3 sm:px-4"
        data-login-trigger
        onClick={onToggleAuth}
      >
        {t('auth.login')}
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 gap-2 rounded-xl data-[state=open]:bg-accent data-[state=open]:text-accent-foreground lg:w-auto lg:px-3"
            aria-label={open ? '关闭用户菜单' : '打开用户菜单'}
            title="账户"
          >
            <User className="size-5" />
            <span className="hidden max-w-24 truncate text-sm font-medium lg:inline">账户</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="bg-popover w-56 max-w-[calc(100vw-1.5rem)] p-1.5 outline-none focus-visible:ring-0"
          aria-label="账户操作"
          aria-labelledby={undefined}
          onCloseAutoFocus={event => {
            if (openingDialogRef.current) {
              event.preventDefault()
              openingDialogRef.current = false
            }
          }}
        >
          <DropdownMenuLabel className="px-3 py-2.5 dark:bg-transparent">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                aria-hidden="true"
              >
                {(user?.name ?? 'U').charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" title={user?.name}>
                  {user?.name || 'User'}
                </p>
                {user?.email && (
                  <p
                    className="text-muted-foreground mt-0.5 truncate text-xs font-normal"
                    title={user.email}
                  >
                    {user.email}
                  </p>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="mx-2 bg-border/70 dark:bg-border/70" />
          <DropdownMenuItem
            asChild
            className="min-h-10 cursor-pointer gap-2.5 rounded-lg px-3 dark:bg-transparent"
          >
            <Link href="/dashboard" prefetch>
              <LayoutDashboard className="size-4" />
              进入仪表盘
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => openAccountDialog('password')}
            className="min-h-10 cursor-pointer gap-2.5 rounded-lg px-3 dark:bg-transparent"
          >
            <KeyRound className="size-4" />
            修改密码
          </DropdownMenuItem>
          <DropdownMenuSeparator className="mx-2 bg-border/70 dark:bg-border/70" />
          <DropdownMenuItem
            onSelect={() => openAccountDialog('logout')}
            className="min-h-10 cursor-pointer gap-2.5 rounded-lg px-3 text-red-600 focus:bg-red-500/10 focus:text-red-600 dark:bg-transparent dark:text-red-400 dark:focus:bg-red-400/10 dark:focus:text-red-400 [&_svg]:text-red-600 dark:[&_svg]:text-red-400"
          >
            <LogOut className="size-4" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={next => {
          setChangePasswordOpen(next)
          if (!next) requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }))
        }}
      />

      <AlertDialog
        open={confirmingLogout}
        onOpenChange={next => {
          if (!logoutPendingRef.current) setConfirmingLogout(next)
        }}
      >
        <AlertDialogContent
          className="w-80 sm:max-w-xs"
          onCloseAutoFocus={event => {
            event.preventDefault()
            triggerRef.current?.focus({ preventScroll: true })
          }}
        >
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>退出登录？</AlertDialogTitle>
            <AlertDialogDescription>退出后，可以重新登录继续使用。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2">
            <AlertDialogCancel disabled={loggingOut}>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={loggingOut}
              onClick={event => {
                event.preventDefault()
                void handleLogoutConfirm()
              }}
            >
              {loggingOut ? '退出中…' : '确认退出'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})

UserButton.displayName = 'UserButton'
