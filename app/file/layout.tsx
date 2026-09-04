'use client'

import { Suspense, useEffect, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { Grid, List, FolderTree } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { BottomNav, BOTTOM_NAV_CONTENT_PADDING, type BottomNavItem } from '@/components/layout'
import useFileStore from './store/useFileStore'
import type { FileView } from './types'

const VALID_VIEWS = new Set<FileView>(['grid', 'list', 'tree'])

function isFileView(value: string | null): value is FileView {
  return value !== null && VALID_VIEWS.has(value as FileView)
}

function FileLayoutNav() {
  const searchParams = useSearchParams()
  const { currentView, setCurrentView } = useFileStore()
  const viewParam = searchParams.get('view')

  // Keep Zustand view in sync with the URL (?view=) as source of truth.
  useEffect(() => {
    if (isFileView(viewParam) && viewParam !== currentView) {
      setCurrentView(viewParam)
    }
  }, [viewParam, currentView, setCurrentView])

  const items: BottomNavItem[] = (
    [
      { view: 'grid' as const, label: '网格', icon: <Grid className="h-5 w-5" /> },
      { view: 'list' as const, label: '列表', icon: <List className="h-5 w-5" /> },
      { view: 'tree' as const, label: '树状', icon: <FolderTree className="h-5 w-5" /> },
    ] as { view: FileView; label: string; icon: ReactNode }[]
  ).map(({ view, label, icon }) => ({
    href: `/file?view=${view}`,
    label,
    icon,
  }))

  const activeView = isFileView(viewParam) ? viewParam : currentView

  return (
    <BottomNav
      items={items}
      ariaLabel="文件视图切换"
      isActive={item => item.href === `/file?view=${activeView}`}
    />
  )
}

export default function FileLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className={BOTTOM_NAV_CONTENT_PADDING}>{children}</div>
      <Suspense fallback={null}>
        <FileLayoutNav />
      </Suspense>
    </ProtectedRoute>
  )
}
