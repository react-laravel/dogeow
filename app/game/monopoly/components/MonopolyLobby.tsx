'use client'

import { Loader2, Plus, UserPlus } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { MonopolyRoomSummary } from '../types'

interface MonopolyLobbyProps {
  rooms: MonopolyRoomSummary[]
  roomName: string
  loading: boolean
  error: string | null
  onRoomNameChange: (roomName: string) => void
  onCreateRoom: () => void
  onOpenRoom: (room: MonopolyRoomSummary) => void
}

export function MonopolyLobby({
  rooms,
  roomName,
  loading,
  error,
  onRoomNameChange,
  onCreateRoom,
  onOpenRoom,
}: MonopolyLobbyProps) {
  return (
    <PageContainer>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-950 dark:text-stone-50">地产棋局</h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              创建房间，加入玩家或电脑，开始实时对局。
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>创建房间</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={roomName}
              onChange={event => onRoomNameChange(event.target.value)}
              maxLength={40}
            />
            <Button onClick={onCreateRoom} disabled={loading} className="sm:w-36">
              {loading ? <Loader2 className="animate-spin" /> : <Plus />} 创建
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map(room => (
            <Card key={room.id} className="rounded-md">
              <CardContent className="space-y-3 pt-2">
                <div>
                  <div className="font-medium">{room.name}</div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">
                    {room.players_count}/{room.max_players}
                  </div>
                </div>
                <Button
                  className="w-full"
                  variant={room.is_member ? 'outline' : 'default'}
                  onClick={() => onOpenRoom(room)}
                >
                  <UserPlus /> {room.is_member ? '回到房间' : '加入'}
                </Button>
              </CardContent>
            </Card>
          ))}
          {rooms.length === 0 && (
            <Card className="rounded-md sm:col-span-2 lg:col-span-3">
              <CardContent className="py-8 text-center text-sm text-stone-500 dark:text-stone-400">
                暂无房间，创建一个新对局即可开始。
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
