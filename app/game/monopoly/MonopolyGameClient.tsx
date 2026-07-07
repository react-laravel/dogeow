'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  ArrowLeft,
  Bot,
  HelpCircle,
  Home,
  Loader2,
  Plus,
  RefreshCw,
  ScrollText,
  Trophy,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PageContainer } from '@/components/layout'
import { createEchoInstance, getEchoInstance } from '@/lib/websocket'
import useAuthStore from '@/stores/authStore'
import { monopolyApi } from './api'
import { Dice } from './components/Dice'
import { MonopolyBoard, formatMoney } from './components/MonopolyBoard'
import type { MonopolyPlayer, MonopolyProperty, MonopolyRoomSummary, MonopolyState } from './types'

interface StateBroadcastPayload {
  state?: MonopolyState
}

type CenterView = 'main' | 'assets' | 'events'
const APP_SCROLL_CONTAINER_IDS = ['main-scroll', 'main-container'] as const
const MONOPOLY_RULES = [
  '每名玩家初始资金 8M，经过或回到起点获得 2M。',
  '单骰 1-6 点，玩家按回合行动；电脑玩家会自动掷骰、买地和盖房。',
  '城市价格从罗马 100K 起递增，后续城市依次到 1.4M。',
  '城市可盖房，每栋 500K；单次最多盖 2 栋，单个城市最多 5 栋。',
  '城市过路费为地皮和房屋总价值的 10%；铁路和航空按拥有数量提高收费。',
  '机会和公益福利会随机触发奖励、惩罚、移动、进监狱或出狱卡。',
  '现金不足支付费用时玩家破产，资产释放；只剩一名未破产玩家时获胜。',
  '默认最多 30 轮；到达轮数上限后按总资产结算，总资产为现金 + 地皮 + 房屋价值。',
]

function useLockAppScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    const elements = APP_SCROLL_CONTAINER_IDS.map(id => document.getElementById(id)).filter(
      (element): element is HTMLElement => element !== null
    )
    const previous = elements.map(element => ({
      element,
      overflow: element.style.overflow,
      overscrollBehavior: element.style.overscrollBehavior,
    }))

    elements.forEach(element => {
      element.style.overflow = 'hidden'
      element.style.overscrollBehavior = 'none'
    })

    return () => {
      previous.forEach(({ element, overflow, overscrollBehavior }) => {
        element.style.overflow = overflow
        element.style.overscrollBehavior = overscrollBehavior
      })
    }
  }, [locked])
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
  const [centerView, setCenterView] = useState<CenterView>('main')
  const [selectedAssetPlayerId, setSelectedAssetPlayerId] = useState<number | null>(null)
  const [displayedPlayers, setDisplayedPlayers] = useState<MonopolyState['players']>([])
  const [movingPlayerId, setMovingPlayerId] = useState<number | null>(null)
  const [highlightedPosition, setHighlightedPosition] = useState<number | null>(null)
  const displayedPlayersRef = useRef<MonopolyState['players']>([])
  const movementTimersRef = useRef<number[]>([])
  const diceTimersRef = useRef<number[]>([])
  useLockAppScroll(Boolean(state))

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
  const playerSummary = useMemo(() => {
    if (!state) return []

    return [...state.players].sort((a, b) => a.turn_order - b.turn_order)
  }, [state])
  const playerNetWorth = useMemo(() => {
    if (!state) return new Map<number, number>()

    const totals = new Map<number, number>()
    state.players.forEach(player => totals.set(player.id, player.cash))
    state.properties.forEach(property => {
      if (!property.owner_player_id) return

      totals.set(
        property.owner_player_id,
        (totals.get(property.owner_player_id) ?? 0) +
          property.price +
          property.house_price * property.houses
      )
    })

    return totals
  }, [state])
  const selectedAssetPlayer = useMemo(() => {
    if (!state) return null

    return (
      state.players.find(player => player.id === selectedAssetPlayerId) ??
      me ??
      state.players[0] ??
      null
    )
  }, [me, selectedAssetPlayerId, state])
  const selectedAssetProperties = useMemo(
    () =>
      selectedAssetPlayer && state
        ? state.properties.filter(property => property.owner_player_id === selectedAssetPlayer.id)
        : [],
    [selectedAssetPlayer, state]
  )
  const selectedAssetValue = useMemo(
    () =>
      selectedAssetProperties.reduce(
        (total, property) => total + property.price + property.house_price * property.houses,
        0
      ),
    [selectedAssetProperties]
  )
  const latestCardEvent = useMemo(() => {
    if (!state) return null

    return (
      [...state.events]
        .reverse()
        .find(event => event.type === 'chance.drawn' || event.type === 'welfare.drawn') ?? null
    )
  }, [state])
  const finishedEvent = useMemo(() => {
    if (!state) return null

    return [...state.events].reverse().find(event => event.type === 'game.finished') ?? null
  }, [state])
  const boardPlayers = displayedPlayers.length > 0 ? displayedPlayers : (state?.players ?? [])

  useEffect(() => {
    displayedPlayersRef.current = displayedPlayers
  }, [displayedPlayers])

  useEffect(() => {
    return () => {
      movementTimersRef.current.forEach(timer => window.clearTimeout(timer))
      diceTimersRef.current.forEach(timer => window.clearTimeout(timer))
    }
  }, [])

  const clearMovementTimers = useCallback(() => {
    movementTimersRef.current.forEach(timer => window.clearTimeout(timer))
    movementTimersRef.current = []
  }, [])

  const stopDiceRolling = useCallback(() => {
    diceTimersRef.current.forEach(timer => window.clearTimeout(timer))
    diceTimersRef.current = []
    setRolling(false)
  }, [])

  const startDiceRolling = useCallback(() => {
    diceTimersRef.current.forEach(timer => window.clearTimeout(timer))
    diceTimersRef.current = []
    setRolling(true)

    const tick = () => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
      diceTimersRef.current.push(window.setTimeout(tick, 80))
    }

    tick()
  }, [])

  const animateDiceTo = useCallback(
    (finalValue: number) => {
      startDiceRolling()
      diceTimersRef.current.push(
        window.setTimeout(() => {
          diceTimersRef.current.forEach(timer => window.clearTimeout(timer))
          diceTimersRef.current = []
          setDiceValue(finalValue)
          setRolling(false)
        }, 650)
      )
    },
    [startDiceRolling]
  )

  const applyState = useCallback(
    (nextState: MonopolyState) => {
      const previousPlayers =
        displayedPlayersRef.current.length > 0 ? displayedPlayersRef.current : nextState.players
      const boardSize = Math.max(nextState.board.length, 1)
      const changes = nextState.players
        .map(nextPlayer => {
          const previousPlayer = previousPlayers.find(player => player.id === nextPlayer.id)
          if (!previousPlayer || previousPlayer.position === nextPlayer.position) return null

          return {
            playerId: nextPlayer.id,
            from: previousPlayer.position,
            to: nextPlayer.position,
          }
        })
        .filter((change): change is { playerId: number; from: number; to: number } =>
          Boolean(change)
        )

      setState(nextState)

      if (changes.length === 0) {
        clearMovementTimers()
        displayedPlayersRef.current = nextState.players
        setDisplayedPlayers(nextState.players)
        setMovingPlayerId(null)
        setHighlightedPosition(null)
        return
      }

      clearMovementTimers()
      let workingPlayers = previousPlayers.map(player => ({ ...player }))
      displayedPlayersRef.current = workingPlayers
      setDisplayedPlayers(workingPlayers)

      const animateChange = (changeIndex: number) => {
        const change = changes[changeIndex]
        if (!change) {
          displayedPlayersRef.current = nextState.players
          setDisplayedPlayers(nextState.players)
          setMovingPlayerId(null)
          setHighlightedPosition(null)
          return
        }

        setMovingPlayerId(change.playerId)
        let position = change.from
        const totalSteps = (change.to - change.from + boardSize) % boardSize
        let completedSteps = 0

        const step = () => {
          if (completedSteps >= totalSteps) {
            workingPlayers = workingPlayers.map(player =>
              player.id === change.playerId
                ? (nextState.players.find(nextPlayer => nextPlayer.id === change.playerId) ??
                  player)
                : player
            )
            setDisplayedPlayers(workingPlayers)
            animateChange(changeIndex + 1)
            return
          }

          position = (position + 1) % boardSize
          completedSteps += 1
          setHighlightedPosition(position)
          workingPlayers = workingPlayers.map(player =>
            player.id === change.playerId ? { ...player, position } : player
          )
          displayedPlayersRef.current = workingPlayers
          setDisplayedPlayers(workingPlayers)
          movementTimersRef.current.push(window.setTimeout(step, 240))
        }

        movementTimersRef.current.push(window.setTimeout(step, 120))
      }

      animateChange(0)
    },
    [clearMovementTimers]
  )

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

  const refreshState = useCallback(
    async (roomId: number) => {
      const data = await monopolyApi.state(roomId)
      applyState(data.state)
    },
    [applyState]
  )

  useEffect(() => {
    void loadRooms().catch(err => setError(err instanceof Error ? err.message : '加载房间失败'))
  }, [loadRooms])

  useEffect(() => {
    if (!state?.room.id) return

    const echo = getEchoInstance() ?? createEchoInstance()
    const channel = echo?.channel(`monopoly.room.${state.room.id}`)
    const update = (payload: StateBroadcastPayload) => {
      if (payload.state) applyState(payload.state)
    }

    channel?.listen('.state.updated', update)
    channel?.listen('.player.joined', update)
    channel?.listen('.player.left', update)
    channel?.listen('.turn.advanced', update)
    channel?.listen(
      '.dice.rolled',
      (payload: StateBroadcastPayload & { payload?: { roll?: number } }) => {
        if (payload.payload?.roll) animateDiceTo(payload.payload.roll)
        update(payload)
      }
    )

    return () => {
      echo?.leave(`monopoly.room.${state.room.id}`)
    }
  }, [animateDiceTo, applyState, state?.room.id])

  const createRoom = () =>
    runAction(async () => {
      const data = await monopolyApi.createRoom(roomName.trim() || '周末对局')
      applyState(data.state)
      await loadRooms()
    })

  const joinRoom = (roomId: number) =>
    runAction(async () => {
      const data = await monopolyApi.join(roomId)
      applyState(data.state)
      await loadRooms()
    })

  const roll = () =>
    runAction(async () => {
      try {
        startDiceRolling()
        const data = await monopolyApi.roll(state!.room.id)
        animateDiceTo(data.roll)
        applyState(data.state)
      } catch (err) {
        stopDiceRolling()
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
  const canBuildCurrent =
    isMyTurn &&
    currentProperty &&
    currentProperty.type === 'city' &&
    currentProperty.owner_player_id === me?.id &&
    currentProperty.houses < 5 &&
    me &&
    me.cash >= currentProperty.house_price &&
    me.last_roll !== null
  const canEndTurn = isMyTurn && Boolean(me?.last_roll || me?.is_in_jail)

  if (!state) {
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
    <PageContainer
      fullScreen
      className="fixed inset-x-0 z-20 overflow-hidden bg-background"
      style={
        {
          top: 'var(--app-header-total-height, var(--app-header-height, 50px))',
          height: 'calc(100dvh - var(--app-header-total-height, var(--app-header-height, 50px)))',
        } as CSSProperties
      }
    >
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
      <div className="flex h-full w-full items-center justify-center overflow-hidden">
        {error && (
          <div className="absolute top-2 left-2 z-10 max-w-sm rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <MonopolyBoard
          board={state.board}
          players={boardPlayers}
          properties={state.properties}
          currentPlayerId={state.current_player_id}
          movingPlayerId={movingPlayerId}
          highlightedPosition={highlightedPosition}
          center={
            <div className="flex size-full flex-col gap-3 overflow-hidden">
              {state.room.status === 'waiting' ? (
                <div className="flex size-full flex-col items-center justify-center gap-4 overflow-hidden rounded-md bg-white/75 p-3 text-center dark:bg-stone-950/45">
                  <div className="min-w-0 max-w-full">
                    <div className="truncate text-base font-semibold text-stone-950 dark:text-stone-50">
                      {state.room.name}
                    </div>
                    <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                      {playerSummary.length}/{state.room.max_players} 人
                    </div>
                  </div>

                  <div className="min-h-0 w-full max-w-sm overflow-hidden">
                    <div className="grid max-h-full grid-cols-2 justify-center gap-2 overflow-auto sm:grid-cols-3">
                      {playerSummary.map(player => (
                        <div
                          key={player.id}
                          className="min-w-0 rounded-md bg-stone-50 px-2 py-2 text-center dark:bg-stone-900"
                        >
                          <div className="truncate text-sm font-medium text-stone-950 dark:text-stone-50">
                            {player.name}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-stone-500 dark:text-stone-400">
                            {player.type === 'computer' ? '电脑' : player.is_host ? '房主' : '玩家'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-full max-w-sm shrink-0">
                    <div className="text-sm text-stone-500 dark:text-stone-400">
                      {me?.is_host ? '添加电脑或开始游戏' : '等待房主开始游戏'}
                    </div>
                    {me?.is_host && (
                      <div className="mt-3 flex flex-wrap justify-center gap-2">
                        <Button
                          variant="outline"
                          className="min-w-28 flex-1 whitespace-nowrap"
                          onClick={() =>
                            runAction(async () =>
                              applyState((await monopolyApi.addComputer(state.room.id)).state)
                            )
                          }
                          disabled={loading}
                        >
                          <Bot /> 创建机器人
                        </Button>
                        <Button
                          className="min-w-24 flex-1 whitespace-nowrap"
                          onClick={() =>
                            runAction(async () =>
                              applyState((await monopolyApi.start(state.room.id)).state)
                            )
                          }
                          disabled={loading}
                        >
                          开始游戏
                        </Button>
                      </div>
                    )}
                    <div className="mt-2 flex justify-center">
                      <MonopolyRulesDialog />
                    </div>
                  </div>
                </div>
              ) : state.room.status === 'finished' && centerView === 'main' ? (
                <div className="flex size-full flex-col items-center justify-center gap-4 overflow-hidden rounded-md bg-white/75 p-4 text-center dark:bg-stone-950/45">
                  <Trophy className="size-10 text-amber-500" />
                  <div className="min-w-0 max-w-full">
                    <div className="truncate text-lg font-semibold text-stone-950 dark:text-stone-50">
                      游戏结束
                    </div>
                    <div className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                      {finishedEvent?.message ?? `已完成第 ${state.room.max_rounds} 轮结算`}
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setCenterView('events')}>
                    <ScrollText /> 事件日志
                  </Button>
                  <MonopolyRulesDialog />
                </div>
              ) : centerView === 'main' ? (
                <div className="flex size-full flex-col gap-3 overflow-hidden">
                  <div className="flex items-center justify-between gap-3 rounded-md bg-white/75 px-3 py-2 dark:bg-stone-950/45">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-stone-950 dark:text-stone-50">
                        第 {Math.min(state.room.round, state.room.max_rounds)} /{' '}
                        {state.room.max_rounds} 轮 · {currentPlayer?.name ?? '等待开始'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {playerSummary.map(player => (
                      <button
                        type="button"
                        key={player.id}
                        className="min-w-0 rounded-md bg-white/75 px-2 py-1.5 text-left transition hover:bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none dark:bg-stone-950/45 dark:hover:bg-stone-900"
                        onClick={() => {
                          setSelectedAssetPlayerId(player.id)
                          setCenterView('assets')
                        }}
                      >
                        <div className="truncate text-xs font-medium text-stone-900 dark:text-stone-100">
                          {player.name}
                          {player.type === 'computer' ? ' · 电脑' : ''}
                        </div>
                        <div className="mt-0.5 font-mono text-sm font-semibold text-stone-950 dark:text-stone-50">
                          {formatMoney(playerNetWorth.get(player.id) ?? player.cash)}
                        </div>
                        <div className="truncate text-[10px] text-stone-500 dark:text-stone-400">
                          总资产
                          {player.is_in_jail ? ' · 监狱' : ''}
                          {player.is_bankrupt ? ' · 破产' : ''}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="min-h-0 flex-1 rounded-md bg-white/75 p-3 dark:bg-stone-950/45">
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
                      {canEndTurn && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            runAction(async () =>
                              applyState((await monopolyApi.endTurn(state.room.id)).state)
                            )
                          }
                          disabled={loading}
                        >
                          结束回合
                        </Button>
                      )}
                      {canBuy && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            runAction(async () =>
                              applyState((await monopolyApi.buy(state.room.id)).state)
                            )
                          }
                          disabled={loading}
                        >
                          购买资产
                        </Button>
                      )}
                      {canBuildCurrent && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            runAction(async () =>
                              applyState(
                                (await monopolyApi.build(state.room.id, currentProperty.id, 1))
                                  .state
                              )
                            )
                          }
                          disabled={loading}
                        >
                          <Home /> 盖房
                        </Button>
                      )}
                      {isMyTurn && me?.is_in_jail && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            runAction(async () =>
                              applyState((await monopolyApi.leaveJail(state.room.id, 'pay')).state)
                            )
                          }
                          disabled={loading}
                        >
                          支付出狱
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => setCenterView('events')}>
                        <ScrollText /> 事件日志
                      </Button>
                      <MonopolyRulesDialog />
                    </div>

                    {latestCardEvent && (
                      <div className="mt-3 rounded-md bg-stone-50 p-2 text-sm text-stone-700 dark:bg-stone-900 dark:text-stone-300">
                        <div className="font-medium">
                          {latestCardEvent.type === 'chance.drawn' ? '机会' : '公益福利'}
                        </div>
                        <div className="mt-1">{latestCardEvent.message}</div>
                      </div>
                    )}

                    {currentProperty && (
                      <div className="mt-3 rounded-md bg-stone-50 p-2 text-sm text-stone-700 dark:bg-stone-900 dark:text-stone-300">
                        <div className="font-medium">{currentProperty.name}</div>
                        <div>
                          价格 {formatMoney(currentProperty.price)} · 租金{' '}
                          {formatMoney(currentProperty.current_rent)} · 房屋{' '}
                          {currentProperty.houses}/5
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : centerView === 'assets' ? (
                <CenterPanel
                  title={`${selectedAssetPlayer?.name ?? '玩家'}资产`}
                  onBack={() => setCenterView('main')}
                >
                  <AssetsPanel
                    player={selectedAssetPlayer}
                    properties={selectedAssetProperties}
                    assetValue={selectedAssetValue}
                    netWorth={
                      selectedAssetPlayer
                        ? (playerNetWorth.get(selectedAssetPlayer.id) ?? selectedAssetPlayer.cash)
                        : 0
                    }
                    canBuild={Boolean(selectedAssetPlayer && me?.id === selectedAssetPlayer.id)}
                    onBuild={(property, houses) =>
                      runAction(async () =>
                        applyState(
                          (await monopolyApi.build(state.room.id, property.id, houses)).state
                        )
                      )
                    }
                  />
                </CenterPanel>
              ) : (
                <CenterPanel title="事件日志" onBack={() => setCenterView('main')}>
                  <div className="grid max-h-full gap-2 overflow-auto pr-1 text-sm">
                    {state.events.map(event => (
                      <div
                        key={event.id}
                        className="rounded-md bg-white/75 px-3 py-2 text-stone-700 dark:bg-stone-950/45 dark:text-stone-300"
                      >
                        {event.message}
                      </div>
                    ))}
                  </div>
                </CenterPanel>
              )}
            </div>
          }
        />
      </div>
    </PageContainer>
  )
}

function MonopolyRulesDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="whitespace-nowrap">
          <HelpCircle /> 游戏说明
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="size-5 text-amber-500" />
            地产棋局说明
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 overflow-auto pr-1">
          <div className="grid gap-3 text-sm text-stone-700 dark:text-stone-300">
            {MONOPOLY_RULES.map(rule => (
              <div key={rule} className="rounded-md bg-stone-50 px-3 py-2 dark:bg-stone-900/80">
                {rule}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CenterPanel({
  title,
  onBack,
  children,
}: {
  title: string
  onBack: () => void
  children: ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-md bg-white/75 p-3 dark:bg-stone-950/45">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onBack}>
          <ArrowLeft /> 返回
        </Button>
        <div className="truncate text-base font-semibold text-stone-950 dark:text-stone-50">
          {title}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

function AssetsPanel({
  player,
  properties,
  assetValue,
  netWorth,
  canBuild,
  onBuild,
}: {
  player: MonopolyPlayer | null
  properties: MonopolyProperty[]
  assetValue: number
  netWorth: number
  canBuild: boolean
  onBuild: (property: MonopolyProperty, houses: number) => void
}) {
  return (
    <div className="grid max-h-full gap-2 overflow-auto pr-1">
      <div className="rounded-md bg-white/75 p-3 text-sm dark:bg-stone-950/45">
        <div className="truncate font-medium text-stone-950 dark:text-stone-50">
          {player?.name ?? '玩家'}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-stone-50 px-2 py-2 dark:bg-stone-900">
            <div className="text-[10px] text-stone-500 dark:text-stone-400">现金</div>
            <div className="mt-0.5 font-mono font-semibold">{formatMoney(player?.cash ?? 0)}</div>
          </div>
          <div className="rounded-md bg-stone-50 px-2 py-2 dark:bg-stone-900">
            <div className="text-[10px] text-stone-500 dark:text-stone-400">资产</div>
            <div className="mt-0.5 font-mono font-semibold">{formatMoney(assetValue)}</div>
          </div>
          <div className="rounded-md bg-stone-50 px-2 py-2 dark:bg-stone-900">
            <div className="text-[10px] text-stone-500 dark:text-stone-400">总资产</div>
            <div className="mt-0.5 font-mono font-semibold">{formatMoney(netWorth)}</div>
          </div>
        </div>
      </div>
      {properties.length === 0 && (
        <div className="text-sm text-stone-500 dark:text-stone-400">暂无资产</div>
      )}
      {properties.map(property => (
        <div key={property.id} className="rounded-md border p-2 text-sm dark:border-stone-700">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-medium">{property.name}</div>
              <div className="text-stone-500 dark:text-stone-400">
                地皮 {formatMoney(property.price)} · 房屋投入{' '}
                {formatMoney(property.house_price * property.houses)} · 总价{' '}
                {formatMoney(property.price + property.house_price * property.houses)}
              </div>
            </div>
            {canBuild && property.type === 'city' && property.houses < 5 && (
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
    </div>
  )
}
