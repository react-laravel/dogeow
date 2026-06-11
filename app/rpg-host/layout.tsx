import type { CSSProperties } from 'react'

export default function RpgHostLayout({ children }: { children: React.ReactNode }) {
  const hostLayoutStyle = { '--app-header-height': '0px' } as CSSProperties

  return (
    <div className="flex min-h-dvh flex-col" style={hostLayoutStyle}>
      {children}
    </div>
  )
}
