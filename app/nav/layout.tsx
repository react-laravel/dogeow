'use client'

import type { ReactNode } from 'react'
import { Compass, Plus, FolderTree } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { BottomNav, BOTTOM_NAV_CONTENT_PADDING, type BottomNavItem } from '@/components/layout'
import { useTranslation } from '@/hooks/useTranslation'

export default function NavLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()

  const items: BottomNavItem[] = [
    {
      href: '/nav',
      label: t('category.all', '全部'),
      icon: <Compass className="h-5 w-5" />,
      exact: true,
    },
    {
      href: '/nav/categories',
      label: t('nav.categories', '分类'),
      icon: <FolderTree className="h-5 w-5" />,
    },
    {
      href: '/nav/add',
      label: t('common.add', '添加'),
      icon: <Plus className="h-5 w-5" />,
    },
  ]

  return (
    <ProtectedRoute>
      <div className={BOTTOM_NAV_CONTENT_PADDING}>{children}</div>
      <BottomNav items={items} ariaLabel={t('nav.module_nav', '导航模块导航')} />
    </ProtectedRoute>
  )
}
