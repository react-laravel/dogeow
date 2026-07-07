'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bot, Home, Loader2, LogOut, Plus, RefreshCw, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageContainer } from '@/components/layout'
import { createEchoInstance, getEchoInstance } from '@/lib/websocket'
import useAuthStore from '@/stores/authStore'
import { monopolyApi } from './api'
import { Dice } from './components/Dice'
import { MonopolyBoard, formatMoney } from './components/MonopolyBoard'
import type { MonopolyProperty, MonopolyRoomSummary, MonopolyState } from './types'

interface StateBroadcastPayload {
  state?: MonopolyState
}

export default function MonopolyGameClient() {
  const currentUserId = useAuthStore(state => state.user?.id ?? null)
  const [rooms, setRooms] = useState<MonopolyRoomSummary[]>([])
  const [state, setState] = useState<MonopolyState | null>(null)
  const [roomName, setRoomName] = useState('周末对局')
  const [diceValue, setDiceValue] = useState(1)
  const [rolling, setRolling] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentPlayer = useMemo(
    () => state?.players.find(player => player.id === state.current_player_id) ?? null,
    [state]
  )
  const me = useMemo(
    () => state?.players.find(player => player.user_id === currentUserId) ?? null,
    [state, currentUserId]
  )
  const isMyTurn = Boolean(me && currentPlayer?.id === me.id && state?.room.status === 'playing')
  const currentProperty = useMemo(() => {
    if (!me || !state) return null
    return state.properties.find(property => property.tile_index === me.position) ?? null
  }, [me, state])
  const myProperties = useMemo(
    () =>
      me && state ? state.properties.filter(property => property.owner_player_id === me.id) : [],
    [me, state]
  )
  const playerSummary = useMemo(() => {
    if (!state) return []

    return [...state.players].sort((a, b) => a.turn_order - b.turn_order)
  }, [state])

  const runAction = useCallback(async (action: () => Promise<void>) => {
    setLoading(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRooms = useCallback(async () => {
    const data = await monopolyApi.rooms()
    setRooms(data.rooms)
  }, [])

  const refreshState = useCallback(async (roomId: number) => {
    const data = await monopolyApi.state(roomId)
    setState(data.state)
  }, [])

  useEffect(() => {
    void loadRooms().catch(err => setError(err instanceof Error ? err.message : '加载房间失败'))
  }, [loadRooms])

  useEffect(() => {
    if (!state?.room.id) return

    const echo = getEchoInstance() ?? createEchoInstance()
    const channel = echo?.channel(`monopoly.room.${state.room.id}`)
    const update = (payload: StateBroadcastPayload) => {
      if (payload.state) setState(payload.state)
    }

    channel?.listen('.state.updated', update)
    channel?.listen('.player.joined', update)
    channel?.listen('.player.left', update)
    channel?.listen('.turn.advanced', update)
    channel?.listen(
      '.dice.rolled',
      (payload: StateBroadcastPayload & { payload?: { roll?: number } }) => {
        if (payload.payload?.roll) setDiceValue(payload.payload.roll)
        update(payload)
      }
    )

    return () => {
      echo?.leave(`monopoly.room.${state.room.id}`)
    }
  }, [state?.room.id])

  const createRoom = () =>
    runAction(async () => {
      const data = await monopolyApi.createRoom(roomName.trim() || '周末对局')
      setState(data.state)
      await loadRooms()
    })

  const joinRoom = (roomId: number) =>
    runAction(async () => {
      const data = await monopolyApi.join(roomId)
      setState(data.state)
      await loadRooms()
    })

  const roll = () =>
    runAction(async () => {
      setRolling(true)
      const timer = window.setInterval(() => setDiceValue(Math.floor(Math.random() * 6) + 1), 80)
      try {
        const data = await monopolyApi.roll(state!.room.id)
        window.setTimeout(() => {
          window.clearInterval(timer)
          setDiceValue(data.roll)
          setRolling(false)
          setState(data.state)
        }, 500)
      } catch (err) {
        window.clearInterval(timer)
        setRolling(false)
        throw err
      }
    })

  const canBuy =
    isMyTurn &&
    currentProperty &&
    currentProperty.owner_player_id === null &&
    me &&
    me.cash >= currentProperty.price &&
    me.last_roll !== null
  const canEndTurn = isMyTurn && Boolean(me?.last_roll || me?.is_in_jail)

  if (!state) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-950 dark:text-stone-50">大富翁</h1>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                创建房间，加入玩家或电脑，开始实时对局。
              </p>
            </div>
            <Button variant="outline" onClick={() => void loadRooms()} disabled={loading}>
              <RefreshCw /> 刷新
            </Button>
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
                onChange={event => setRoomName(event.target.value)}
                maxLength={40}
              />
              <Button onClick={createRoom} disabled={loading} className="sm:w-36">
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
                    onClick={() => (room.is_member ? refreshState(room.id) : joinRoom(room.id))}
                  >
                    <UserPlus /> {room.is_member ? '回到房间' : '加入'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <style jsx global>{`
        @keyframes monopoly-dice-roll {
          0% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(18deg) scale(1.08);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }
      `}</style>
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-950 dark:text-stone-50">大富翁</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.room.status === 'waiting' && me?.is_host && (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    runAction(async () =>
                      setState((await monopolyApi.addComputer(state.room.id)).state)
                    )
                  }
                >
                  <Bot /> 添加电脑
                </Button>
                <Button
                  onClick={() =>
                    runAction(async () => setState((await monopolyApi.start(state.room.id)).state))
                  }
                >
                  开始游戏
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => runAction(async () => refreshState(state.room.id))}
            >
              <RefreshCw /> 同步
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                runAction(async () => {
                  await monopolyApi.leave(state.room.id)
                  setState(null)
                  await loadRooms()
                })
              }
            >
              <LogOut /> 离开
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <MonopolyBoard
            board={state.board}
            players={state.players}
            properties={state.properties}
            currentPlayerId={state.current_player_id}
            center={
              <div className="flex size-full flex-col gap-3 overflow-hidden">
                <div className="flex items-center justify-between gap-3 rounded-md border bg-white/85 px-3 py-2 shadow-xs dark:border-stone-700 dark:bg-stone-950/70">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-stone-950 dark:text-stone-50">
                      第 {state.room.round} 轮 · {currentPlayer?.name ?? '等待开始'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {playerSummary.map(player => (
                    <div
                      key={player.id}
                      className="min-w-0 rounded-md border bg-white/85 px-2 py-1.5 text-left shadow-xs dark:border-stone-700 dark:bg-stone-950/70"
                    >
                      <div className="truncate text-xs font-medium text-stone-900 dark:text-stone-100">
                        {player.name}
                        {player.type === 'computer' ? ' · 电脑' : ''}
                      </div>
                      <div className="mt-0.5 font-mono text-sm font-semibold text-stone-950 dark:text-stone-50">
                        {formatMoney(player.cash)}
                      </div>
                      <div className="truncate text-[10px] text-stone-500 dark:text-stone-400">
                        {player.tile_name}
                        {player.is_in_jail ? ' · 监狱' : ''}
                        {player.is_bankrupt ? ' · 破产' : ''}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="min-h-0 flex-1 rounded-md border bg-white/90 p-3 shadow-xs dark:border-stone-700 dark:bg-stone-950/75">
                  <div className="flex items-center gap-3">
                    <Dice value={diceValue} rolling={rolling} />
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-stone-950 dark:text-stone-50">
                        {isMyTurn ? '轮到你行动' : `等待 ${currentPlayer?.name ?? '玩家'}`}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      onClick={roll}
                      disabled={!isMyTurn || Boolean(me?.last_roll) || rolling || loading}
                    >
                      掷骰子
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        runAction(async () =>
                          setState((await monopolyApi.endTurn(state.room.id)).state)
                        )
                      }
                      disabled={!canEndTurn || loading}
                    >
                      结束回合
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        runAction(async () =>
                          setState((await monopolyApi.buy(state.room.id)).state)
                        )
                      }
                      disabled={!canBuy || loading}
                    >
                      购买资产
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        runAction(async () =>
                          setState((await monopolyApi.leaveJail(state.room.id, 'pay')).state)
                        )
                      }
                      disabled={!isMyTurn || !me?.is_in_jail || loading}
                    >
                      支付出狱
                    </Button>
                  </div>

                  {currentProperty && (
                    <div className="mt-3 rounded-md bg-stone-50 p-2 text-sm text-stone-700 dark:bg-stone-900 dark:text-stone-300">
                      <div className="font-medium">{currentProperty.name}</div>
                      <div>
                        价格 {formatMoney(currentProperty.price)} · 租金{' '}
                        {formatMoney(currentProperty.base_rent)} · 房屋 {currentProperty.houses}/5
                      </div>
                    </div>
                  )}
                </div>
              </div>
            }
          />

          <div className="space-y-4">
            <AssetsPanel
              properties={myProperties}
              onBuild={(property, houses) =>
                runAction(async () =>
                  setState((await monopolyApi.build(state.room.id, property.id, houses)).state)
                )
              }
            />
          </div>
        </div>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>事件日志</CardTitle>
          </CardHeader>
          <CardContent className="grid max-h-64 gap-2 overflow-auto text-sm">
            {state.events.map(event => (
              <div
                key={event.id}
                className="rounded-md bg-stone-50 px-3 py-2 text-stone-700 dark:bg-stone-900 dark:text-stone-300"
              >
                {event.message}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

function AssetsPanel({
  properties,
  onBuild,
}: {
  properties: MonopolyProperty[]
  onBuild: (property: MonopolyProperty, houses: number) => void
}) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>我的资产</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {properties.length === 0 && (
          <div className="text-sm text-stone-500 dark:text-stone-400">暂无资产</div>
        )}
        {properties.map(property => (
          <div key={property.id} className="rounded-md border p-2 text-sm dark:border-stone-700">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-medium">{property.name}</div>
                <div className="text-stone-500 dark:text-stone-400">
                  房屋 {property.houses}/5 · 建造 {formatMoney(property.house_price)}
                </div>
              </div>
              {property.type === 'city' && property.houses < 5 && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => onBuild(property, 1)}>
                    <Home /> 1
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onBuild(property, 2)}
                    disabled={property.houses > 3}
                  >
                    <Home /> 2
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
