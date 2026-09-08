'use client'

import type { ReactNode } from 'react'
import { BookOpen, Brain, Library, Settings } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { BottomNav, type BottomNavItem } from '@/components/layout'
import { useTranslation } from '@/hooks/useTranslation'

export default function WordLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()

  const items: BottomNavItem[] = [
    {
      href: '/word',
      label: t('nav.home', '首页'),
      icon: <BookOpen className="h-5 w-5" />,
      exact: true,
    },
    {
      href: '/word/books',
      label: t('nav.word_books', '单词书'),
      icon: <Library className="h-5 w-5" />,
    },
    {
      href: '/word/learn',
      label: t('nav.word_learn', '学习'),
      icon: <Brain className="h-5 w-5" />,
    },
    {
      href: '/word/settings',
      label: t('settings.title', '设置'),
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <ProtectedRoute>
      <div className="flex h-full min-h-0 flex-col overflow-hidden pb-[calc(3.875rem+env(safe-area-inset-bottom,0px))]">
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          {children}
        </main>
      </div>
      <BottomNav
        isActive={(item, pathname) => {
          if (item.href === '/word/learn')
            return ['/word/learn', '/word/review', '/word/fill-blank', '/word/quiz'].includes(
              pathname
            )
          if (item.href === '/word')
            return ['/word', '/word/search', '/word/import', '/word/scan'].includes(pathname)
          return pathname === item.href || pathname.startsWith(`${item.href}/`)
        }}
        items={items}
        ariaLabel={t('nav.word_module_nav', '单词模块导航')}
      />
    </ProtectedRoute>
  )
}
