'use client'

import { useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

interface LanguageProviderProps {
  children: React.ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { currentLanguage, t } = useTranslation()

  useEffect(() => {
    if (typeof document === 'undefined') return

    document.documentElement.lang = currentLanguage
    document.title = t('home.title', 'DogeOW')
  }, [currentLanguage, t])

  return <>{children}</>
}
