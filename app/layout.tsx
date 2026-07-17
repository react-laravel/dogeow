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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf7' },
    { media: '(prefers-color-scheme: dark)', color: '#181512' },
  ],
  colorScheme: 'dark light',
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
    'msapplication-TileColor': '#fbfaf7',
    'theme-color': '#fbfaf7',
  },
}

const themeBootstrapScript = `
(() => {
  try {
    const raw = localStorage.getItem('theme-storage')
    const state = raw ? JSON.parse(raw).state : null
    const mode = state?.themeMode ?? 'light'
    const followSystem = state?.followSystem === true
    const restPeriod = state?.restPeriod ?? { startHour: 23, endHour: 6 }
    const hour = new Date().getHours()
    const inRest = restPeriod.startHour > restPeriod.endHour
      ? hour >= restPeriod.startHour || hour < restPeriod.endHour
      : hour >= restPeriod.startHour && hour < restPeriod.endHour
    const dark = mode === 'dark' || (mode === 'system' && followSystem && matchMedia('(prefers-color-scheme: dark)').matches) || (mode === 'rest' && inRest)
    const backgroundColor = dark ? '#181512' : '#fbfaf7'
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    document.documentElement.style.backgroundColor = backgroundColor
    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) themeColor.setAttribute('content', backgroundColor)
    const tileColor = document.querySelector('meta[name="msapplication-TileColor"]')
    if (tileColor) tileColor.setAttribute('content', backgroundColor)
    const statusBarStyle = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (statusBarStyle) statusBarStyle.setAttribute('content', 'default')
  } catch {}
})()
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="flex h-dvh flex-col overflow-hidden antialiased">
        <SWRProvider>
          <ThemeProvider>
            <UIThemeProvider>
              <LanguageProvider>
                <LayoutRenderer>
                  <ErrorBoundary>
                    <Suspense>
                      <BackgroundWrapper>{children}</BackgroundWrapper>
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
