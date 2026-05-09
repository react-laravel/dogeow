'use client'

import NoteNavigation from './components/NoteNavigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { BOTTOM_NAV_CONTENT_PADDING } from '@/components/layout'
import 'prismjs/themes/prism.css'
import './styles/prism.css'

export default function NoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div
        className={`flex min-h-[calc(100vh-var(--header-height,50px))] flex-col ${BOTTOM_NAV_CONTENT_PADDING}`}
      >
        <main className="flex-1">{children}</main>
      </div>
      <NoteNavigation />
    </ProtectedRoute>
  )
}
