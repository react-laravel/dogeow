'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { PageContainer } from '@/components/layout'
import { createEchoInstance, getEchoInstance } from '@/lib/websocket'
import useAuthStore from '@/stores/authStore'
import { monopolyApi } from './api'
import { ActiveGamePanel, type MonopolyAnimationPhase } from './components/ActiveGamePanel'
import { FinishedGamePanel } from './components/FinishedGamePanel'
import { MonopolyAnimationStyles } from './components/MonopolyAnimationStyles'
import { MonopolyBoard } from './components/MonopolyBoard'
import { MonopolyLobby } from './components/MonopolyLobby'
import { PlayerAssetsPanel } from './components/PlayerAssetsPanel'
import { WaitingRoomPanel } from './components/WaitingRoomPanel'
import { MAX_HOUSES_PER_PROPERTY, MAX_HOUSES_PER_TURN } from './constants'
import type { MonopolyRollAnimation, MonopolyRoomSummary, MonopolyState } from './types'

interface StateBroadcastPayload {
  state?: MonopolyState
}

interface LobbyBroadcastPayload {
  rooms?: MonopolyRoomSummary[]
}

type CenterView = 'main' | 'assets'
interface AnimationWaiter {
  remaining: number
  timer: number
  resolve: () => void
}
const APP_SCROLL_CONTAINER_IDS = ['main-scroll', 'main-container'] as const

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
  const [animationPhase, setAnimationPhase] = useState<MonopolyAnimationPhase>('idle')
  const displayedPlayersRef = useRef<MonopolyState['players']>([])
  const animationPhaseRef = useRef<MonopolyAnimationPhase>('idle')
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

  const changeAnimationPhase = useCallback((phase: MonopolyAnimationPhase) => {
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
      <MonopolyLobby
        rooms={rooms}
        roomName={roomName}
        loading={loading}
        error={error}
        onRoomNameChange={setRoomName}
        onCreateRoom={createRoom}
        onOpenRoom={room => (room.is_member ? refreshState(room.id) : joinRoom(room.id))}
      />
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
      <MonopolyAnimationStyles />
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
                <WaitingRoomPanel
                  room={state.room}
                  players={playerSummary}
                  isHost={Boolean(me?.is_host)}
                  loading={loading}
                  onAddComputer={() =>
                    runAction(async () =>
                      applyState((await monopolyApi.addComputer(state.room.id)).state)
                    )
                  }
                  onStart={() =>
                    runAction(async () =>
                      applyState((await monopolyApi.start(state.room.id)).state)
                    )
                  }
                />
              ) : visualRoom?.status === 'finished' && centerView === 'main' ? (
                <FinishedGamePanel events={displayedEvents} maxRounds={state.room.max_rounds} />
              ) : centerView === 'main' ? (
                <ActiveGamePanel
                  room={visualRoom ?? state.room}
                  players={playerSummary}
                  currentPlayer={visualCurrentPlayer}
                  me={me}
                  playerNetWorth={playerNetWorth}
                  events={displayedEvents}
                  currentProperty={visualCurrentProperty}
                  animationPhase={animationPhase}
                  diceValue={diceValue}
                  rolling={rolling}
                  actionLocked={actionLocked}
                  isMyTurn={isMyTurn}
                  canBuy={Boolean(canBuy)}
                  canBuildCurrent={Boolean(canBuildCurrent)}
                  canEndTurn={canEndTurn}
                  remainingBuildsThisTurn={remainingBuildsThisTurn}
                  onOpenAssets={playerId => {
                    setSelectedAssetPlayerId(playerId)
                    setCenterView('assets')
                  }}
                  onRoll={roll}
                  onEndTurn={() =>
                    runAction(async () => {
                      const data = await monopolyApi.endTurn(state.room.id)
                      enqueueRollAnimations(data.animations, data.state)
                    })
                  }
                  onBuy={() =>
                    runAction(async () => applyState((await monopolyApi.buy(state.room.id)).state))
                  }
                  onBuild={() => {
                    if (!currentProperty) return

                    void runAction(async () =>
                      applyState(
                        (await monopolyApi.build(state.room.id, currentProperty.id, 1)).state
                      )
                    )
                  }}
                  onLeaveJail={() =>
                    runAction(async () => {
                      const data = await monopolyApi.leaveJail(state.room.id, 'pay')
                      enqueueRollAnimations(data.animations, data.state)
                    })
                  }
                />
              ) : centerView === 'assets' ? (
                <PlayerAssetsPanel
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
                  onBack={() => setCenterView('main')}
                  onBuild={(property, houses) =>
                    runAction(async () =>
                      applyState(
                        (await monopolyApi.build(state.room.id, property.id, houses)).state
                      )
                    )
                  }
                />
              ) : null}
            </div>
          }
        />
      </div>
    </PageContainer>
  )
}
