'use client'

import dynamic from 'next/dynamic'
import type { AppLauncherProps } from './index'

const AppLauncher = dynamic(() => import('./index').then(mod => mod.AppLauncher), {
  ssr: false,
})

export function LazyAppLauncher(props: AppLauncherProps) {
  return <AppLauncher {...props} />
}
