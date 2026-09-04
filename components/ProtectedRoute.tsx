'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import useAuthStore from '@/stores/authStore'
import { isProtectedPath } from '@/lib/constants/protected-routes'
import { useTranslation } from '@/hooks/useTranslation'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading } = useAuthStore()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsClient(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const needsProtection = useMemo(() => isProtectedPath(pathname), [pathname])

  useEffect(() => {
    if (!isClient) return

    if (loading) {
      const authStorage = window.localStorage.getItem('auth-storage')
      const hasAuthStorage = Boolean(authStorage && authStorage !== '{}')
      const hasSessionCookie =
        document.cookie.includes('dogeow_session=') || document.cookie.includes('laravel_session=')

      if (!hasAuthStorage && !hasSessionCookie) {
        useAuthStore.getState().setLoading(false)
        return
      }
    }

    // 只有需要保护的路径才进行登录检查
    if (!loading && needsProtection && !isAuthenticated) {
      router.push('/')
    }
  }, [isClient, isAuthenticated, loading, router, needsProtection])

  // Public routes should render immediately instead of waiting for auth store
  // hydration, otherwise the app ships a loading shell for the homepage.
  if (!needsProtection) {
    return <>{children}</>
  }

  // Avoid unmounting authenticated pages during brief auth rehydrate/loading
  // flashes — that would wipe in-progress UI state (forms, modals, etc.).
  if (!isClient || (loading && !isAuthenticated)) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-muted-foreground">{t('loading.text')}</div>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : null
}
