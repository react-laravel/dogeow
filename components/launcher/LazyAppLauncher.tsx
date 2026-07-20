'use client'

import dynamic from 'next/dynamic'
import type { AppLauncherProps } from './index'
import { LogoButton } from './common/LogoButton'

function LauncherFallback() {
  return (
    <div id="app-launcher-bar-loading" className="relative z-50 flex h-full w-full flex-col">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex items-center">
        <div className="pointer-events-auto">
          <LogoButton
            onClick={() => {
              if (window.location.pathname !== '/') window.location.assign('/')
            }}
          />
        </div>
      </div>
    </div>
  )
}

const AppLauncher = dynamic(() => import('./index').then(mod => mod.AppLauncher), {
  ssr: false,
  loading: LauncherFallback,
})

export function LazyAppLauncher(props: AppLauncherProps) {
  return <AppLauncher {...props} />
}
