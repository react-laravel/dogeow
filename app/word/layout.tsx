'use client'

import type { ReactNode } from 'react'
import { BookOpen, Brain, Library, Settings } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { BottomNav, BOTTOM_NAV_CONTENT_PADDING, type BottomNavItem } from '@/components/layout'
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
      <div className={BOTTOM_NAV_CONTENT_PADDING}>{children}</div>
      <BottomNav items={items} ariaLabel={t('nav.word_module_nav', '单词模块导航')} />
    </ProtectedRoute>
  )
}
