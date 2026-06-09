'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import BuiltBy from './BuiltBy'
import PoweredBy from './PoweredBy'
import ICP from './ICP'
import FooterLinks from './FooterLinks'
import { UPYUN_CDN_URL, FOOTER_BG_IMAGES_LIGHT } from '@/lib/constants'

const FOOTER_BG_PARAMS = '!/compress/true/fw/400'

export default function Footer() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [lightBgIndex, setLightBgIndex] = React.useState(0)

  React.useEffect(() => {
    setLightBgIndex(Math.floor(Math.random() * FOOTER_BG_IMAGES_LIGHT.length))
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'

  const backgroundImage = React.useMemo(() => {
    if (!mounted) return undefined

    const base = `${UPYUN_CDN_URL}/bg`
    if (isDark) {
      return `url(${base}/tesla-vector-roadster.png${FOOTER_BG_PARAMS})`
    }
    const img = FOOTER_BG_IMAGES_LIGHT[lightBgIndex]
    return `url(${base}/${img}${FOOTER_BG_PARAMS})`
  }, [isDark, lightBgIndex, mounted])

  return (
    <footer className="mt-auto flex min-h-[200px] flex-col items-center gap-2 pt-4">
      <div
        className="flex w-full max-w-5xl flex-1 flex-col items-center gap-2"
        style={{
          ...(backgroundImage ? { backgroundImage } : {}),
          backgroundPosition: 'right 20px bottom',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '200px',
        }}
      >
        <FooterLinks />
        <BuiltBy />
        <PoweredBy />
        <ICP />
      </div>
    </footer>
  )
}
