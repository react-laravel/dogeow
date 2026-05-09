'use client'

import type { ReactNode } from 'react'
import { Grid, List, FolderTree } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { BottomNav, BOTTOM_NAV_CONTENT_PADDING, type BottomNavItem } from '@/components/layout'
import useFileStore from './store/useFileStore'
import type { FileView } from './types'

export default function FileLayout({ children }: { children: ReactNode }) {
  const { currentView, setCurrentView } = useFileStore()

  const items: BottomNavItem[] = (
    [
      { view: 'grid', label: '网格', icon: <Grid className="h-5 w-5" /> },
      { view: 'list', label: '列表', icon: <List className="h-5 w-5" /> },
      { view: 'tree', label: '树状', icon: <FolderTree className="h-5 w-5" /> },
    ] as { view: FileView; label: string; icon: ReactNode }[]
  ).map(({ view, label, icon }) => ({
    href: `/file?view=${view}`,
    label,
    icon,
    onClick: () => setCurrentView(view),
  }))

  return (
    <ProtectedRoute>
      <div className={BOTTOM_NAV_CONTENT_PADDING}>{children}</div>
      <BottomNav
        items={items}
        ariaLabel="文件视图切换"
        isActive={item => item.href === `/file?view=${currentView}`}
      />
    </ProtectedRoute>
  )
}
