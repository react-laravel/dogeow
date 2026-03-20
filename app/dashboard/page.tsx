'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { FileText, MapPin, CreditCard, Menu } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { PageContainer, PageTitle } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  DashboardNavItem,
  LocationPanel,
  LogPanel,
  MiniMaxPanel,
  MiniMaxRefreshButton,
} from './components'
import { isAdminSync } from '@/lib/auth'
import useAuthStore from '@/stores/authStore'
import type { DashboardSection } from './types'

const NAV_ITEMS: Array<{
  key: DashboardSection
  icon: LucideIcon
  label: string
}> = [
  { key: 'location', icon: MapPin, label: '我的位置' },
  { key: 'logs', icon: FileText, label: 'Laravel 日志' },
  { key: 'minimax', icon: CreditCard, label: 'MiniMax 订阅' },
]

export default function Dashboard() {
  const { isAuthenticated } = useAuthStore()
  const isAdmin = useMemo(() => isAdminSync(), [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 从 URL 读取当前 section，默认 location
  const activeSection = (searchParams.get('section') as DashboardSection) || 'location'

  const setActiveSection = (section: DashboardSection) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', section)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  if (!isAuthenticated) {
    return <div className="text-muted-foreground p-6">正在加载用户信息...</div>
  }

  const visibleNavItems = NAV_ITEMS.filter(item => item.key === 'location' || isAdmin)

  const activeNavLabel = visibleNavItems.find(n => n.key === activeSection)?.label ?? '仪表盘'

  const activeContent = (() => {
    switch (activeSection) {
      case 'location':
        return <LocationPanel />
      case 'logs':
        return <LogPanel />
      case 'minimax':
        return <MiniMaxPanel />
    }
  })()

  return (
    <ProtectedRoute>
      <PageContainer maxWidth="6xl" className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* 顶部栏 */}
        <header className="mb-6 flex items-center gap-3">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-56 p-0"
              style={{ top: 'var(--app-header-height, 50px)' }}
            >
              <SheetHeader className="border-b p-4">
                <SheetTitle className="text-base">仪表盘</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3">
                {visibleNavItems.map(item => (
                  <DashboardNavItem
                    key={item.key}
                    icon={item.icon}
                    label={item.label}
                    active={activeSection === item.key}
                    onSelect={() => {
                      setActiveSection(item.key)
                      setSidebarOpen(false)
                    }}
                  />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <PageTitle className="flex-1 text-2xl sm:text-3xl">{activeNavLabel}</PageTitle>
          {activeSection === 'minimax' && <MiniMaxRefreshButton />}
        </header>

        {/* 内容区 */}
        <div className="mx-auto max-w-5xl">{activeContent}</div>
      </PageContainer>
    </ProtectedRoute>
  )
}
