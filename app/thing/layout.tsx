'use client'

import React from 'react'
import { Package, FolderTree, MapPin, Tag } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { BottomNav, BOTTOM_NAV_CONTENT_PADDING, type BottomNavItem } from '@/components/layout'
import { useTranslation } from '@/hooks/useTranslation'

export default function ThingLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()

  const items: BottomNavItem[] = [
    {
      href: '/thing',
      label: t('nav.all_things', '所有物品'),
      icon: <Package className="h-5 w-5" />,
      exact: true,
    },
    {
      href: '/thing/categories',
      label: t('nav.categories', '分类'),
      icon: <FolderTree className="h-5 w-5" />,
    },
    {
      href: '/thing/locations',
      label: t('nav.locations', '位置'),
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      href: '/thing/tags',
      label: t('nav.tags', '标签'),
      icon: <Tag className="h-5 w-5" />,
    },
  ]

  return (
    <ProtectedRoute>
      <div className={`flex flex-col gap-2 ${BOTTOM_NAV_CONTENT_PADDING}`}>
        <main>{children}</main>
      </div>
      <BottomNav items={items} ariaLabel="物品模块导航" />
    </ProtectedRoute>
  )
}
