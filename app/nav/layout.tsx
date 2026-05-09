'use client'

import type { ReactNode } from 'react'
import { Compass, Plus, FolderTree } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { BottomNav, BOTTOM_NAV_CONTENT_PADDING, type BottomNavItem } from '@/components/layout'

const items: BottomNavItem[] = [
  {
    href: '/nav',
    label: '全部',
    icon: <Compass className="h-5 w-5" />,
    exact: true,
  },
  {
    href: '/nav/categories',
    label: '分类',
    icon: <FolderTree className="h-5 w-5" />,
  },
  {
    href: '/nav/add',
    label: '添加',
    icon: <Plus className="h-5 w-5" />,
  },
]

export default function NavLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className={BOTTOM_NAV_CONTENT_PADDING}>{children}</div>
      <BottomNav items={items} ariaLabel="导航模块导航" />
    </ProtectedRoute>
  )
}
