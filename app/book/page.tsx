'use client'

import { useTranslation } from '@/hooks/useTranslation'
import { configs } from '@/app/configs'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { PageContainer } from '@/components/layout'
import { BookOpen } from 'lucide-react'

export default function BookPage() {
  const { t } = useTranslation()
  const router = useRouter()

  const books = useMemo(() => {
    const translated = configs.books as ReadonlyArray<{
      id: string
      nameKey: string
      descriptionKey: string
      href: string
      color: string
      icon: string
    }>
    return translated.map(book => ({
      ...book,
      name: t(book.nameKey, book.id),
      description: t(book.descriptionKey, ''),
    }))
  }, [t])

  return (
    <PageContainer className="py-4 sm:py-6">
      <header className="mb-6 space-y-1">
        <h1 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
          {t('nav.book', '电子书')}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t('book.select_description', '选择一本好书开始阅读')}
        </p>
      </header>

      <section aria-label={t('nav.book', '电子书')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map(book => (
            <button
              key={book.id}
              type="button"
              onClick={() => router.push(book.href)}
              className="group border-border/60 bg-card hover:border-border hover:bg-accent/40 flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-all hover:scale-[0.98] active:scale-[0.97]"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                style={{ backgroundColor: `${book.color}20` }}
              >
                {book.icon}
              </div>
              <div className="space-y-1">
                <h2 className="text-foreground text-base font-medium">{book.name}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{book.description}</p>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                <BookOpen className="h-3 w-3" />
                <span>{t('book.start_reading', '开始阅读')}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </PageContainer>
  )
}
