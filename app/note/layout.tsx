'use client'

import NoteNavigation from './components/NoteNavigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import './styles/code-highlight.css'

export default function NoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-full min-h-0 flex-col overflow-hidden pb-[calc(3.875rem+env(safe-area-inset-bottom,0px))]">
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          {children}
        </main>
      </div>
      <NoteNavigation />
    </ProtectedRoute>
  )
}
