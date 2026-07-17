'use client'

import { RouteAwareAiLauncher } from '@/components/app/RouteAwareAiLauncher'
import { ScrollButton } from '@/components/display/ScrollButton'

/** 全站唯一页面壳层。明暗与强调色仍由 ThemeProvider 控制。 */
export function LayoutRenderer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col" data-theme-layout="unified">
      <header
        id="header-container"
        className="safe-area-header border-border/60 bg-background/82 supports-[backdrop-filter]:bg-background/72 sticky top-0 z-30 w-full flex-none border-b backdrop-blur-xl"
      >
        <div className="mx-auto flex h-full w-full max-w-[var(--content-max-width)] items-center pr-[max(var(--page-gutter),env(safe-area-inset-right))] pl-[max(var(--page-gutter),env(safe-area-inset-left))]">
          <RouteAwareAiLauncher />
        </div>
      </header>

      <main
        id="main-scroll"
        data-scroll-container
        className="mx-auto flex min-h-0 w-full max-w-[var(--content-max-width)] flex-1 flex-col overflow-x-hidden overflow-y-auto"
      >
        {children}
      </main>

      <ScrollButton />
    </div>
  )
}
