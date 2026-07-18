'use client'

import NoteNavigation from './components/NoteNavigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { BOTTOM_NAV_CONTENT_PADDING } from '@/components/layout'
import './styles/code-highlight.css'

export default function NoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className={`flex min-h-full flex-col ${BOTTOM_NAV_CONTENT_PADDING}`}>
        <main className="flex-1">{children}</main>
      </div>
      <NoteNavigation />
    </ProtectedRoute>
  )
}
