'use client'

import type { ReactNode } from 'react'
import { MessagesSquare, Users, Hash } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { BottomNav, type BottomNavItem } from '@/components/layout'
import { useChatUIStore } from './stores/uiStore'

export default function ChatLayout({ children }: { children: ReactNode }) {
  const { isRoomListOpen, isUsersListOpen, setRoomListOpen, setUsersListOpen } = useChatUIStore()

  const items: BottomNavItem[] = [
    {
      href: '/chat?panel=rooms',
      label: '房间',
      icon: <Hash className="h-5 w-5" />,
      onClick: () => {
        setUsersListOpen(false)
        setRoomListOpen(true)
      },
    },
    {
      href: '/chat',
      label: '消息',
      icon: <MessagesSquare className="h-5 w-5" />,
      onClick: () => {
        setRoomListOpen(false)
        setUsersListOpen(false)
      },
    },
    {
      href: '/chat?panel=users',
      label: '在线',
      icon: <Users className="h-5 w-5" />,
      onClick: () => {
        setRoomListOpen(false)
        setUsersListOpen(true)
      },
    },
  ]

  return (
    <ProtectedRoute>
      {children}
      <BottomNav
        items={items}
        ariaLabel="聊天模块导航"
        isActive={item => {
          if (item.href === '/chat?panel=rooms') return isRoomListOpen
          if (item.href === '/chat?panel=users') return isUsersListOpen
          return !isRoomListOpen && !isUsersListOpen
        }}
      />
    </ProtectedRoute>
  )
}
