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
  CircleDollarSign,
  Home,
  Loader2,
  Plus,
  Trophy,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageContainer } from '@/components/layout'
import { cn } from '@/lib/helpers'
import { createEchoInstance, getEchoInstance } from '@/lib/websocket'
import useAuthStore from '@/stores/authStore'
import { monopolyApi } from './api'
import { Dice } from './components/Dice'
import { MonopolyBoard, formatMoney } from './components/MonopolyBoard'
import type {
  MonopolyPlayer,
  MonopolyProperty,
  MonopolyRollAnimation,
  MonopolyRoomSummary,
  MonopolyState,
} from './types'

interface StateBroadcastPayload {
  state?: MonopolyState
}

interface LobbyBroadcastPayload {
  rooms?: MonopolyRoomSummary[]
}

type CenterView = 'main' | 'assets'
type AnimationPhase = 'idle' | 'rolling' | 'moving' | 'settling'
interface AnimationWaiter {
  remaining: number
  timer: number
  resolve: () => void
}
const APP_SCROLL_CONTAINER_IDS = ['main-scroll', 'main-container'] as const
const MAX_HOUSES_PER_TURN = 2
const MAX_HOUSES_PER_PROPERTY = 5

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
  const [displayedEvents, setDisplayedEvents] = useState<MonopolyState['events']>([])
  const [displayedPlayers, setDisplayedPlayers] = useState<MonopolyState['players']>([])
  const [displayedProperties, setDisplayedProperties] = useState<MonopolyState['properties']>([])
  const [displayedRoom, setDisplayedRoom] = useState<MonopolyState['room'] | null>(null)
  const [displayedCurrentPlayerId, setDisplayedCurrentPlayerId] = useState<number | null>(null)
  const [movingPlayerId, setMovingPlayerId] = useState<number | null>(null)
  const [highlightedPosition, setHighlightedPosition] = useState<number | null>(null)
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle')
  const displayedPlayersRef = useRef<MonopolyState['players']>([])
  const animationPhaseRef = useRef<AnimationPhase>('idle')
  const animationQueueRef = useRef<MonopolyRollAnimation[]>([])
  const animationRunningRef = useRef(false)
  const queuedFinalStateRef = useRef<MonopolyState | null>(null)
  const animationWaitersRef = useRef<AnimationWaiter[]>([])
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
  const actionLocked = loading || animationPhase !== 'idle'
  const remainingBuildsThisTurn = Math.max(
    0,
    MAX_HOUSES_PER_TURN - (me?.houses_built_this_turn ?? 0)
  )
  const currentProperty = useMemo(() => {
    if (!me || !state) return null
    return state.properties.find(property => property.tile_index === me.position) ?? null
  }, [me, state])
  const playerSummary = useMemo(() => {
    if (!state) return []

    const players = displayedPlayers.length > 0 ? displayedPlayers : state.players
    return [...players].sort((a, b) => a.turn_order - b.turn_order)
  }, [displayedPlayers, state])
  const playerNetWorth = useMemo(() => {
    if (!state) return new Map<number, number>()

    const totals = new Map<number, number>()
    playerSummary.forEach(player => totals.set(player.id, player.cash))
    const properties = displayedProperties.length > 0 ? displayedProperties : state.properties
    properties.forEach(property => {
      if (!property.owner_player_id) return

      totals.set(
        property.owner_player_id,
        (totals.get(property.owner_player_id) ?? 0) +
          property.price +
          property.house_price * property.houses
      )
    })

    return totals
  }, [displayedProperties, playerSummary, state])
  const selectedAssetPlayer = useMemo(() => {
    if (!state) return null

    return (
      playerSummary.find(player => player.id === selectedAssetPlayerId) ??
      me ??
      playerSummary[0] ??
      null
    )
  }, [me, playerSummary, selectedAssetPlayerId, state])
  const selectedAssetProperties = useMemo(
    () =>
      selectedAssetPlayer && state
        ? (displayedProperties.length > 0 ? displayedProperties : state.properties).filter(
            property => property.owner_player_id === selectedAssetPlayer.id
          )
        : [],
    [displayedProperties, selectedAssetPlayer, state]
  )
  const selectedAssetValue = useMemo(
    () =>
      selectedAssetProperties.reduce(
        (total, property) => total + property.price + property.house_price * property.houses,
        0
      ),
    [selectedAssetProperties]
  )
  const finishedEvent = useMemo(() => {
    return [...displayedEvents].reverse().find(event => event.type === 'game.finished') ?? null
  }, [displayedEvents])
  const boardPlayers = useMemo(
    () => (displayedPlayers.length > 0 ? displayedPlayers : (state?.players ?? [])),
    [displayedPlayers, state?.players]
  )
  const boardProperties = useMemo(
    () => (displayedProperties.length > 0 ? displayedProperties : (state?.properties ?? [])),
    [displayedProperties, state?.properties]
  )
  const visualRoom = displayedRoom ?? state?.room ?? null
  const visualCurrentPlayer =
    boardPlayers.find(player => player.id === displayedCurrentPlayerId) ?? currentPlayer
  const visualMe = boardPlayers.find(player => player.user_id === currentUserId) ?? me
  const visualCurrentProperty = visualMe
    ? (boardProperties.find(property => property.tile_index === visualMe.position) ?? null)
    : null

  useEffect(() => {
    const gameWindow = window as Window & {
      advanceTime?: (milliseconds: number) => void
      render_game_to_text?: () => string
    }

    gameWindow.render_game_to_text = () =>
      JSON.stringify({
        mode: visualRoom?.status ?? 'lobby',
        round: visualRoom?.round ?? 0,
        currentPlayer: visualCurrentPlayer?.name ?? null,
        animationPhase,
        dice: diceValue,
        highlightedPosition,
        players: boardPlayers.map(player => ({
          id: player.id,
          name: player.name,
          cash: player.cash,
          position: player.position,
          bankrupt: player.is_bankrupt,
          inJail: player.is_in_jail,
        })),
      })

    gameWindow.advanceTime = milliseconds => {
      const elapsed = Math.max(0, milliseconds)
      const ready: AnimationWaiter[] = []
      animationWaitersRef.current.forEach(waiter => {
        waiter.remaining -= elapsed
        if (waiter.remaining <= 0) ready.push(waiter)
      })
      ready.forEach(waiter => {
        window.clearTimeout(waiter.timer)
        animationWaitersRef.current = animationWaitersRef.current.filter(
          candidate => candidate !== waiter
        )
        waiter.resolve()
      })
    }

    return () => {
      delete gameWindow.render_game_to_text
      delete gameWindow.advanceTime
    }
  }, [
    animationPhase,
    boardPlayers,
    diceValue,
    highlightedPosition,
    visualCurrentPlayer?.name,
    visualRoom?.round,
    visualRoom?.status,
  ])

  useEffect(() => {
    displayedPlayersRef.current = displayedPlayers
  }, [displayedPlayers])

  useEffect(() => {
    const movementTimers = movementTimersRef.current

    return () => {
      movementTimers.forEach(timer => window.clearTimeout(timer))
      diceTimersRef.current.forEach(timer => window.clearTimeout(timer))
      animationWaitersRef.current = []
      animationQueueRef.current = []
      animationRunningRef.current = false
    }
  }, [])

  const changeAnimationPhase = useCallback((phase: AnimationPhase) => {
    animationPhaseRef.current = phase
    setAnimationPhase(phase)
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

  const commitDisplayedState = useCallback((nextState: MonopolyState) => {
    displayedPlayersRef.current = nextState.players
    setState(nextState)
    setDisplayedPlayers(nextState.players)
    setDisplayedProperties(nextState.properties)
    setDisplayedEvents(nextState.events)
    setDisplayedRoom(nextState.room)
    setDisplayedCurrentPlayerId(nextState.current_player_id)
    setMovingPlayerId(null)
    setHighlightedPosition(null)
  }, [])

  const waitForAnimation = useCallback(
    (duration: number) =>
      new Promise<void>(resolve => {
        const waiter: AnimationWaiter = {
          remaining: duration,
          timer: 0,
          resolve,
        }
        waiter.timer = window.setTimeout(() => {
          animationWaitersRef.current = animationWaitersRef.current.filter(
            candidate => candidate !== waiter
          )
          resolve()
        }, duration)
        movementTimersRef.current.push(waiter.timer)
        animationWaitersRef.current.push(waiter)
      }),
    []
  )

  const animatePlayerToState = useCallback(
    async (step: MonopolyRollAnimation) => {
      const previousPlayers =
        displayedPlayersRef.current.length > 0 ? displayedPlayersRef.current : step.state.players
      const previousPlayer = previousPlayers.find(player => player.id === step.player_id)
      const nextPlayer = step.state.players.find(player => player.id === step.player_id)

      if (!previousPlayer || !nextPlayer || previousPlayer.position === nextPlayer.position) {
        await waitForAnimation(180)
        return
      }

      changeAnimationPhase('moving')
      setMovingPlayerId(step.player_id)
      const boardSize = Math.max(step.state.board.length, 1)
      const totalSteps = (nextPlayer.position - previousPlayer.position + boardSize) % boardSize
      let position = previousPlayer.position
      let workingPlayers = previousPlayers.map(player => ({ ...player }))

      for (let completedSteps = 0; completedSteps < totalSteps; completedSteps += 1) {
        position = (position + 1) % boardSize
        setHighlightedPosition(position)
        workingPlayers = workingPlayers.map(player =>
          player.id === step.player_id ? { ...player, position } : player
        )
        displayedPlayersRef.current = workingPlayers
        setDisplayedPlayers(workingPlayers)
        await waitForAnimation(190)
      }
    },
    [changeAnimationPhase, waitForAnimation]
  )

  const runAnimationQueue = useCallback(async () => {
    if (animationRunningRef.current) return

    animationRunningRef.current = true
    while (animationQueueRef.current.length > 0) {
      const step = animationQueueRef.current.shift()
      if (!step) continue

      setState(step.state)
      setDisplayedRoom(step.state.room)
      setDisplayedCurrentPlayerId(step.player_id)
      changeAnimationPhase('rolling')
      startDiceRolling()
      await waitForAnimation(540)
      stopDiceRolling()
      setDiceValue(step.roll)
      await waitForAnimation(180)
      await animatePlayerToState(step)

      displayedPlayersRef.current = step.state.players
      setDisplayedPlayers(step.state.players)
      setDisplayedProperties(step.state.properties)
      setDisplayedEvents(step.state.events)
      setMovingPlayerId(null)
      setHighlightedPosition(null)
      changeAnimationPhase('settling')
      await waitForAnimation(260)
    }

    const finalState = queuedFinalStateRef.current
    queuedFinalStateRef.current = null
    if (finalState) commitDisplayedState(finalState)

    animationRunningRef.current = false
    changeAnimationPhase('idle')
  }, [
    animatePlayerToState,
    changeAnimationPhase,
    commitDisplayedState,
    startDiceRolling,
    stopDiceRolling,
    waitForAnimation,
  ])

  const enqueueRollAnimations = useCallback(
    (animations: MonopolyRollAnimation[], finalState: MonopolyState) => {
      if (animations.length === 0) {
        commitDisplayedState(finalState)
        changeAnimationPhase('idle')
        return
      }

      animationQueueRef.current.push(...animations)
      queuedFinalStateRef.current = finalState
      void runAnimationQueue()
    },
    [changeAnimationPhase, commitDisplayedState, runAnimationQueue]
  )

  const applyState = useCallback(
    (nextState: MonopolyState) => {
      if (animationRunningRef.current || animationPhaseRef.current !== 'idle') {
        setState(nextState)
        queuedFinalStateRef.current = nextState
        return
      }

      commitDisplayedState(nextState)
    },
    [commitDisplayedState]
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
    const echo = getEchoInstance() ?? createEchoInstance()
    const channel = echo?.channel('monopoly.lobby')

    channel?.listen('.rooms.updated', (payload: LobbyBroadcastPayload) => {
      if (!payload.rooms) return

      setRooms(previousRooms => {
        const membershipByRoom = new Map(previousRooms.map(room => [room.id, room.is_member]))

        return payload.rooms!.map(room => ({
          ...room,
          is_member: membershipByRoom.get(room.id) ?? room.is_member,
        }))
      })
    })

    return () => {
      echo?.leave('monopoly.lobby')
    }
  }, [])

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
      (payload: StateBroadcastPayload & { payload?: { player_id?: number; roll?: number } }) => {
        if (payload.state && payload.payload?.player_id && payload.payload.roll) {
          enqueueRollAnimations(
            [
              {
                player_id: payload.payload.player_id,
                roll: payload.payload.roll,
                state: payload.state,
              },
            ],
            payload.state
          )
          return
        }

        update(payload)
      }
    )

    return () => {
      echo?.leave(`monopoly.room.${state.room.id}`)
    }
  }, [applyState, enqueueRollAnimations, state?.room.id])

  const createRoom = () =>
    runAction(async () => {
      const data = await monopolyApi.createRoom(roomName.trim() || '周末对局')
      applyState(data.state)
    })

  const joinRoom = (roomId: number) =>
    runAction(async () => {
      const data = await monopolyApi.join(roomId)
      applyState(data.state)
    })

  const roll = () =>
    runAction(async () => {
      try {
        changeAnimationPhase('rolling')
        startDiceRolling()
        const data = await monopolyApi.roll(state!.room.id)
        enqueueRollAnimations(data.animations, data.state)
      } catch (err) {
        stopDiceRolling()
        changeAnimationPhase('idle')
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
    currentProperty.houses < MAX_HOUSES_PER_PROPERTY &&
    me &&
    me.cash >= currentProperty.house_price &&
    remainingBuildsThisTurn > 0 &&
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
            transform: translateY(0) rotate(0deg) scale(1);
          }
          35% {
            transform: translateY(-7px) rotate(110deg) scale(1.08);
          }
          70% {
            transform: translateY(2px) rotate(250deg) scale(0.96);
          }
          100% {
            transform: translateY(0) rotate(360deg) scale(1);
          }
        }
        @keyframes monopoly-token-hop {
          0% {
            transform: translateY(5px) scale(0.72);
            opacity: 0.3;
          }
          55% {
            transform: translateY(-5px) scale(1.18);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes monopoly-tile-pulse {
          0%,
          100% {
            background-color: rgba(14, 165, 233, 0.08);
          }
          50% {
            background-color: rgba(14, 165, 233, 0.22);
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
          properties={boardProperties}
          currentPlayerId={displayedCurrentPlayerId ?? state.current_player_id}
          movingPlayerId={movingPlayerId}
          highlightedPosition={highlightedPosition}
          center={
            <div className="flex size-full flex-col gap-3 overflow-hidden">
              {visualRoom?.status === 'waiting' ? (
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
                  </div>
                </div>
              ) : visualRoom?.status === 'finished' && centerView === 'main' ? (
                <div className="flex size-full flex-col gap-3 overflow-hidden rounded-md bg-white/75 p-4 dark:bg-stone-950/45">
                  <div className="flex shrink-0 flex-col items-center gap-3 text-center">
                    <Trophy className="size-10 text-amber-500" />
                    <div className="min-w-0 max-w-full">
                      <div className="truncate text-lg font-semibold text-stone-950 dark:text-stone-50">
                        游戏结束
                      </div>
                      <div className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                        {finishedEvent?.message ?? `已完成第 ${state.room.max_rounds} 轮结算`}
                      </div>
                    </div>
                  </div>
                  <EventLogPanel events={displayedEvents} />
                </div>
              ) : centerView === 'main' ? (
                <div className="grid size-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden [@media_(orientation:landscape)]:grid-cols-[minmax(360px,1fr)_minmax(360px,1fr)] [@media_(orientation:landscape)]:grid-rows-1">
                  <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
                    <div className="flex items-center justify-between gap-3 rounded-md bg-white/75 px-3 py-2 dark:bg-stone-950/45">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-stone-950 dark:text-stone-50">
                          第 {Math.min(visualRoom?.round ?? 1, visualRoom?.max_rounds ?? 30)} /{' '}
                          {visualRoom?.max_rounds ?? 30} 轮 ·{' '}
                          {visualCurrentPlayer?.name ?? '等待开始'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 [@media_(orientation:landscape)]:grid-cols-2">
                      {playerSummary.map(player => {
                        const isActivePlayer = player.id === visualCurrentPlayer?.id
                        const netWorth = playerNetWorth.get(player.id) ?? player.cash
                        const playerStatus = [
                          player.is_in_jail ? '监狱' : null,
                          player.is_bankrupt ? '破产' : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')

                        return (
                          <button
                            type="button"
                            key={player.id}
                            className={cn(
                              'relative min-w-0 overflow-hidden rounded-md bg-white/75 px-2 py-1.5 text-left transition-all duration-200 hover:bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none dark:bg-stone-950/45 dark:hover:bg-stone-900',
                              isActivePlayer &&
                                'bg-amber-50/80 shadow-[inset_3px_0_0_rgb(245,158,11)] dark:bg-amber-950/25'
                            )}
                            onClick={() => {
                              setSelectedAssetPlayerId(player.id)
                              setCenterView('assets')
                            }}
                            aria-label={`查看${player.name}资产，现金${formatMoney(player.cash)}，总资产${formatMoney(netWorth)}`}
                          >
                            <div className="truncate text-xs font-medium text-stone-900 dark:text-stone-100">
                              {player.name}
                              {player.type === 'computer' ? ' · 电脑' : ''}
                            </div>
                            <div className="mt-0.5 truncate font-mono text-sm font-semibold text-stone-950 dark:text-stone-50">
                              {formatMoney(player.cash)}/{formatMoney(netWorth)}
                            </div>
                            {playerStatus && (
                              <div className="truncate text-[10px] text-stone-500 dark:text-stone-400">
                                {playerStatus}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col rounded-md bg-white/75 p-3 dark:bg-stone-950/45">
                      <div className="grid shrink-0 gap-3 [@media_(orientation:landscape)]:grid-cols-[auto_minmax(0,1fr)] [@media_(orientation:landscape)]:items-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div
                            className={cn(
                              'rounded-xl p-1.5 transition-all duration-300',
                              animationPhase === 'rolling' &&
                                'bg-sky-100 shadow-[0_0_24px_rgba(14,165,233,0.35)] dark:bg-sky-950/50',
                              animationPhase === 'settling' &&
                                'bg-emerald-100 dark:bg-emerald-950/50'
                            )}
                          >
                            <Dice value={diceValue} rolling={rolling} />
                          </div>
                          <div className="flex gap-1" aria-hidden="true">
                            {(['rolling', 'moving', 'settling'] as const).map(phase => (
                              <span
                                key={phase}
                                className={cn(
                                  'h-1 w-4 rounded-full bg-stone-200 transition-colors dark:bg-stone-700',
                                  animationPhase === phase && 'bg-sky-500 dark:bg-sky-400'
                                )}
                              />
                            ))}
                          </div>
                          <span className="sr-only" aria-live="polite">
                            {animationPhase === 'rolling'
                              ? '正在掷骰子'
                              : animationPhase === 'moving'
                                ? '棋子正在移动'
                                : animationPhase === 'settling'
                                  ? '正在结算落地结果'
                                  : '等待操作'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            className={cn(
                              !canEndTurn && !canBuy && !canBuildCurrent && 'col-span-2'
                            )}
                            onClick={roll}
                            disabled={!isMyTurn || Boolean(me?.last_roll) || actionLocked}
                          >
                            掷骰子
                          </Button>
                          {canEndTurn && (
                            <Button
                              variant="outline"
                              onClick={() =>
                                runAction(async () => {
                                  const data = await monopolyApi.endTurn(state.room.id)
                                  enqueueRollAnimations(data.animations, data.state)
                                })
                              }
                              disabled={actionLocked}
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
                              disabled={actionLocked}
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
                              disabled={actionLocked}
                            >
                              <Home /> 盖房
                            </Button>
                          )}
                          {isMyTurn && me?.is_in_jail && (
                            <Button
                              variant="outline"
                              onClick={() =>
                                runAction(async () => {
                                  const data = await monopolyApi.leaveJail(state.room.id, 'pay')
                                  enqueueRollAnimations(data.animations, data.state)
                                })
                              }
                              disabled={actionLocked}
                            >
                              支付出狱
                            </Button>
                          )}
                        </div>
                      </div>

                      {visualCurrentProperty && (
                        <div className="mt-3 shrink-0 rounded-md bg-stone-50 p-2.5 text-sm text-stone-700 dark:bg-stone-900 dark:text-stone-300">
                          <div className="flex items-center gap-2">
                            <CircleDollarSign className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {visualCurrentProperty.name}
                              </div>
                              <div className="truncate text-xs text-stone-500 dark:text-stone-400">
                                {formatMoney(visualCurrentProperty.price)} · 过路费{' '}
                                {formatMoney(visualCurrentProperty.current_rent)} · 房屋{' '}
                                {visualCurrentProperty.houses}/{MAX_HOUSES_PER_PROPERTY}
                                {canBuildCurrent ? ` · 可建 ${remainingBuildsThisTurn}` : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <EventLogPanel
                    events={displayedEvents}
                    className="rounded-md border border-stone-200 bg-white/75 p-2 dark:border-stone-800 dark:bg-stone-950/45"
                  />
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
                    canBuild={Boolean(
                      selectedAssetPlayer &&
                      me?.id === selectedAssetPlayer.id &&
                      isMyTurn &&
                      me.last_roll !== null &&
                      remainingBuildsThisTurn > 0 &&
                      !actionLocked
                    )}
                    maxBuildHouses={remainingBuildsThisTurn}
                    onBuild={(property, houses) =>
                      runAction(async () =>
                        applyState(
                          (await monopolyApi.build(state.room.id, property.id, houses)).state
                        )
                      )
                    }
                  />
                </CenterPanel>
              ) : null}
            </div>
          }
        />
      </div>
    </PageContainer>
  )
}

function EventLogPanel({
  events,
  className = '',
}: {
  events: MonopolyState['events']
  className?: string
}) {
  const logContainerRef = useRef<HTMLDivElement | null>(null)
  const latestEventId = events[events.length - 1]?.id

  useEffect(() => {
    const element = logContainerRef.current
    if (!element) return

    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
  }, [latestEventId])

  return (
    <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${className}`}>
      <div className="shrink-0 text-xs font-medium text-stone-500 dark:text-stone-400">事件</div>
      <div
        ref={logContainerRef}
        className="mt-2 grid min-h-0 flex-1 content-start gap-1.5 overflow-auto pr-1 text-sm leading-snug"
      >
        {events.length === 0 ? (
          <div className="rounded-md bg-stone-50 px-2 py-4 text-center text-stone-500 dark:bg-stone-900 dark:text-stone-400">
            暂无事件
          </div>
        ) : (
          events.map((event, index) => (
            <div
              key={event.id}
              className={cn(
                'relative rounded-md bg-stone-50 py-1.5 pr-2 pl-3 text-stone-700 transition-colors dark:bg-stone-900 dark:text-stone-300',
                index === events.length - 1 &&
                  'animate-in fade-in slide-in-from-bottom-1 bg-amber-50 dark:bg-amber-950/25'
              )}
              data-latest={index === events.length - 1 ? 'true' : undefined}
            >
              <span
                className={cn(
                  'absolute top-2 bottom-2 left-1 w-0.5 rounded-full bg-stone-300 dark:bg-stone-700',
                  event.type.startsWith('property.') && 'bg-emerald-500',
                  (event.type.startsWith('chance.') || event.type.startsWith('welfare.')) &&
                    'bg-sky-500',
                  (event.type.startsWith('rent.') || event.type.startsWith('cash.')) &&
                    'bg-amber-500',
                  (event.type.startsWith('jail.') || event.type === 'player.bankrupt') &&
                    'bg-red-500'
                )}
              />
              {event.message}
            </div>
          ))
        )}
      </div>
    </div>
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
  maxBuildHouses,
  onBuild,
}: {
  player: MonopolyPlayer | null
  properties: MonopolyProperty[]
  assetValue: number
  netWorth: number
  canBuild: boolean
  maxBuildHouses: number
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
            {canBuild && property.type === 'city' && property.houses < MAX_HOUSES_PER_PROPERTY && (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => onBuild(property, 1)}>
                  <Home /> 1
                </Button>
                {maxBuildHouses >= 2 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onBuild(property, 2)}
                    disabled={property.houses > MAX_HOUSES_PER_PROPERTY - 2}
                  >
                    <Home /> 2
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
