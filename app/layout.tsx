import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { ThemeProvider } from '@/components/app/ThemeProvider'
import { UIThemeProvider } from '@/components/themes/UIThemeProvider'
import { LayoutRenderer } from '@/components/themes/LayoutRenderer'
import { BackgroundWrapper } from '@/components/provider/BackgroundWrapper'
import './globals.css'
import { SWRProvider } from '@/components/provider/SWRProvider'
import { LanguageProvider } from '@/components/provider/LanguageProvider'
import { DeferredRuntimeClients } from '@/components/app/DeferredRuntimeClients'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import '@/lib/themes/registry' // 初始化主题注册表
import '@/lib/i18n/log-control'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'DogeOW - 学习、生活、工作于一体',
  description: 'DogeOW是一个集学习、生活、工作于一体的综合性平台',
  keywords: ['DogeOW'],
  authors: [{ name: 'DogeOW' }],
  creator: 'DogeOW',
  publisher: 'DogeOW',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://dogeow.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'DogeOW - 学习、生活、工作于一体',
    description: 'DogeOW是一个集学习、生活、工作于一体的综合性平台',
    url: 'https://dogeow.com',
    siteName: 'DogeOW',
    images: [
      {
        url: '/480.png',
        width: 480,
        height: 480,
        alt: 'DogeOW Logo',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DogeOW - 学习、生活、工作于一体',
    description: 'DogeOW是一个集学习、生活、工作于一体的综合性平台',
    images: ['/480.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '64x64 32x32 24x24 16x16', type: 'image/x-icon' },
      { url: '/80.png', sizes: '80x80', type: 'image/png' },
      { url: '/480.png', sizes: '480x480', type: 'image/png' },
    ],
    apple: [{ url: '/480.png', sizes: '480x480', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'DogeOW',
    'msapplication-TileColor': '#000000',
    'theme-color': '#000000',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="flex h-screen flex-col overflow-hidden antialiased">
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="absolute left-[-9999px] top-0 z-50 inline-block bg-black px-4 py-2 text-white focus:left-0 focus:top-0"
        >
          Skip to main content
        </a>
        <SWRProvider>
          <ThemeProvider>
            <UIThemeProvider>
              <LanguageProvider>
                <LayoutRenderer>
                  <ErrorBoundary>
                    <Suspense>
                      <main id="main-content">
                        <BackgroundWrapper>{children}</BackgroundWrapper>
                      </main>
                    </Suspense>
                  </ErrorBoundary>
                </LayoutRenderer>
                <DeferredRuntimeClients />
              </LanguageProvider>
            </UIThemeProvider>
          </ThemeProvider>
        </SWRProvider>
      </body>
    </html>
  )
}
