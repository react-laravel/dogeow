'use client'

import React, { memo, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User, LayoutDashboard, LogOut, Check, X, KeyRound } from 'lucide-react'
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
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
        setConfirmingLogout(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const closeMenu = () => {
    setOpen(false)
    setConfirmingLogout(false)
  }

  const handleLogoutConfirm = async () => {
    try {
      await logout()
      toast.success('已退出登录', {
        position: 'top-center',
      })
      closeMenu()
    } catch {
      toast.error('退出登录失败，请稍后重试', {
        position: 'top-center',
      })
    }
  }

  const handleOpenChangePassword = () => {
    closeMenu()
    setChangePasswordOpen(true)
  }

  if (isAuthenticated) {
    return (
      <>
        <div className="relative" ref={ref}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`size-10 gap-2 rounded-xl lg:w-auto lg:px-3 ${
              open ? 'bg-accent text-accent-foreground' : ''
            }`}
            onClick={() => setOpen(prev => !prev)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={open ? '关闭用户菜单' : '打开用户菜单'}
            title={open ? '关闭用户菜单' : '打开用户菜单'}
          >
            <User className="h-5 w-5" />
            <span className="hidden max-w-24 truncate text-sm font-medium lg:inline">账户</span>
          </Button>

          {open && (
            <div
              className="border-border/70 bg-popover/96 text-popover-foreground absolute right-0 top-full z-[100] mt-2 max-h-[calc(100dvh-var(--app-header-total-height)-1rem)] w-72 overflow-y-auto overscroll-contain rounded-2xl border p-4 shadow-2xl backdrop-blur-xl"
              role="menu"
              aria-label="账户操作"
            >
              <div className="border-border/70 mb-4 flex items-center gap-3 border-b pb-4">
                <div className="bg-primary text-primary-foreground flex h-11 w-11 items-center justify-center rounded-full text-base font-semibold">
                  {(user?.name ?? 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user?.name || 'User'}</p>
                  {user?.email && (
                    <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground mb-2 px-1 text-xs font-medium">账户操作</p>
              <div className="space-y-1.5">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full justify-start gap-2"
                  asChild
                >
                  <Link href="/dashboard" role="menuitem" onClick={closeMenu} prefetch>
                    <LayoutDashboard className="h-4 w-4" />
                    进入仪表盘
                  </Link>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full justify-start gap-2"
                  onClick={handleOpenChangePassword}
                  role="menuitem"
                >
                  <KeyRound className="h-4 w-4" />
                  修改密码
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full justify-start gap-2 text-red-500"
                  onClick={() => setConfirmingLogout(true)}
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </Button>
                {confirmingLogout && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" className="h-9" onClick={handleLogoutConfirm}>
                      <Check className="mr-1 h-4 w-4" />
                      确认
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9"
                      onClick={() => setConfirmingLogout(false)}
                    >
                      <X className="mr-1 h-4 w-4" />
                      取消
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      </>
    )
  }

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
})

UserButton.displayName = 'UserButton'
