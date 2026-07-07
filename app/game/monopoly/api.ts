'use client'

import { del, get, post } from '@/lib/api'
import type { MonopolyProperty, MonopolyRoomSummary, MonopolyState } from './types'

export const monopolyApi = {
  rooms: () => get<{ rooms: MonopolyRoomSummary[] }>('/monopoly/rooms'),
  createRoom: (name: string) =>
    post<{ room: { id: number }; state: MonopolyState }>('/monopoly/rooms', { name }),
  state: (roomId: number) => get<{ state: MonopolyState }>(`/monopoly/rooms/${roomId}`),
  join: (roomId: number) => post<{ state: MonopolyState }>(`/monopoly/rooms/${roomId}/join`, {}),
  leave: (roomId: number) => post<Record<string, never>>(`/monopoly/rooms/${roomId}/leave`, {}),
  addComputer: (roomId: number) =>
    post<{ state: MonopolyState }>(`/monopoly/rooms/${roomId}/computers`, {}),
  removeComputer: (roomId: number, playerId: number) =>
    del<{ state: MonopolyState }>(`/monopoly/rooms/${roomId}/computers/${playerId}`),
  start: (roomId: number) => post<{ state: MonopolyState }>(`/monopoly/rooms/${roomId}/start`, {}),
  roll: (roomId: number) =>
    post<{ roll: number; state: MonopolyState }>(`/monopoly/rooms/${roomId}/roll`, {}),
  buy: (roomId: number) =>
    post<{ property: MonopolyProperty; state: MonopolyState }>(`/monopoly/rooms/${roomId}/buy`, {}),
  build: (roomId: number, propertyId: number, houses: number) =>
    post<{ property: MonopolyProperty; state: MonopolyState }>(`/monopoly/rooms/${roomId}/build`, {
      property_id: propertyId,
      houses,
    }),
  endTurn: (roomId: number) =>
    post<{ state: MonopolyState }>(`/monopoly/rooms/${roomId}/end-turn`, {}),
  leaveJail: (roomId: number, method: 'pay' | 'card') =>
    post<{ state: MonopolyState }>(`/monopoly/rooms/${roomId}/leave-jail`, { method }),
}
