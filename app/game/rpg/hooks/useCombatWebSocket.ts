'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { logger } from '@/lib/logger'
import { useGameStore } from '../stores/gameStore'
import { logger } from '@/lib/logger'
import { createEchoInstance } from '@/lib/websocket'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import type Echo from 'laravel-echo'
import { logger } from '@/lib/logger'
import type {
import { logger } from '@/lib/logger'
  CombatMonster,
  GameCharacter,
  GameItem,
  GameMonstersAppearEvent,
  GameCombatUpdateEvent,
  GameLootDroppedEvent,
  GameLevelUpEvent,
} from '../types'

interface CombatUpdateData {
  type?: 'monsters_appear' // 怪物出现类型
  monsters?: CombatMonster[] // 怪物数组（怪物出现时使用）
  victory: boolean
  monster: { name: string; type: string; level: number }
  damage_dealt: number
  damage_taken: number
  rounds: number
  experience_gained: number
  copper_gained: number
  loot?: {
    item?: GameItem
    copper: number
  }
  character: GameCharacter
  combat_log_id: number
}

interface LootDroppedData {
  item?: GameItem
  copper: number
}

interface LevelUpData {
  level: number
  character: GameCharacter
}

interface InventoryUpdateData {
  inventory?: GameItem[]
  storage?: GameItem[]
  equipment?: Record<string, GameItem | null>
  inventory_size?: number
  storage_size?: number
}

interface PusherConnection {
  state: string
  bind: (event: string, callback: (data?: unknown) => void) => void
  unbind: (event: string, callback?: (data?: unknown) => void) => void
}

interface PusherConnector {
  connection: PusherConnection
}

interface EchoConnector {
  pusher?: PusherConnector
}

const SUBSCRIBE_DEBOUNCE_MS = 150
const RECONNECT_INTERVAL_MS = 5000 // 重连间隔 5 秒

export function useCombatWebSocket(characterId: number | null) {
  const echoRef = useRef<Echo<'reverb'> | null>(null)
  const channelRef = useRef<ReturnType<Echo<'reverb'>['channel']> | null>(null)
  const subscribedCharacterIdRef = useRef<number | null>(null)
  const subscribedAtRef = useRef<number>(0)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [authError, setAuthError] = useState(false)

  // 清理重连定时器
  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearInterval(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }

  // 重新订阅频道
  const resubscribe = useCallback(() => {
    if (!characterId || !echoRef.current) return

    logger.debug('WebSocket: 正在重新订阅...')
    try {
      // 先清理旧频道
      if (channelRef.current) {
        try {
          channelRef.current.stopListening('.combat.update')
          channelRef.current.stopListening('.loot.dropped')
          channelRef.current.stopListening('.level.up')
          channelRef.current.stopListening('.inventory.update')
          channelRef.current.unsubscribe()
        } catch (e) {
          // 忽略清理错误
        }
      }

      // 重新订阅
      const ch = echoRef.current.channel(`game.${characterId}`)
      channelRef.current = ch

      ch.listen('.combat.update', (data: CombatUpdateData) => {
        logger.debug('🎮 Combat update received:', data)
        // 如果是怪物出现消息，单独处理
        if (data.type === 'monsters_appear') {
          logger.debug('👹 Monsters appear:', data.monsters)
          useGameStore.getState().handleMonstersAppear(data as unknown as GameMonstersAppearEvent)
        } else {
          useGameStore.getState().handleCombatUpdate(data as unknown as GameCombatUpdateEvent)
        }
      })
      ch.listen('.loot.dropped', (data: LootDroppedData) => {
        logger.debug('💎 Loot dropped:', data)
        useGameStore.getState().handleLootDropped(data as unknown as GameLootDroppedEvent)
      })
      ch.listen('.level.up', (data: LevelUpData) => {
        logger.debug('🎉 Level up:', data)
        useGameStore.getState().handleLevelUp(data as unknown as GameLevelUpEvent)
      })
      ch.listen('.inventory.update', (data: InventoryUpdateData) => {
        useGameStore.getState().handleInventoryUpdate(data)
      })

      subscribedCharacterIdRef.current = characterId
      logger.debug('WebSocket: 重新订阅成功')
      setIsConnected(true)
      clearReconnectTimer()
    } catch (error) {
      logger.error('WebSocket: 重新订阅失败', error)
    }
  }, [characterId])

  useEffect(() => {
    // 如果没有角色ID，或者已经订阅了相同的角色，跳过
    if (!characterId || subscribedCharacterIdRef.current === characterId) {
      return
    }

    // 如果之前订阅了其他角色，先清理
    if (subscribedCharacterIdRef.current !== null && channelRef.current) {
      logger.debug('WebSocket: 清理之前的订阅')
      try {
        channelRef.current.stopListening('.combat.update')
        channelRef.current.stopListening('.loot.dropped')
        channelRef.current.stopListening('.level.up')
        channelRef.current.stopListening('.inventory.update')
        channelRef.current.unsubscribe()
      } catch (error) {
        logger.warn('WebSocket: 清理之前的频道时出错', error)
      }
      channelRef.current = null
    }

    // 使用 setTimeout 避免在 effect 中同步调用 setState
    setTimeout(() => setAuthError(false), 0)

    // 初始化 Echo
    const echo = createEchoInstance()
    if (!echo) {
      logger.warn('WebSocket: Failed to create Echo instance')
      toast.error('实时连接初始化失败')
      return
    }

    echoRef.current = echo

    // 在连接就绪后订阅（与聊天室一致，避免连接未建立就 subscribe 被忽略）
    let connectionCleanup: (() => void) | null = null

    const doSubscribe = () => {
      if (!echoRef.current) return
      const ch = echoRef.current.channel(`game.${characterId}`)
      channelRef.current = ch
      subscribedAtRef.current = Date.now()
      logger.debug('WebSocket: 已订阅频道 game.' + characterId)

      ch.listen('.combat.update', (data: CombatUpdateData) => {
        logger.debug('🎮 Combat update received:', data)
        // 如果是怪物出现消息，单独处理
        if (data.type === 'monsters_appear') {
          logger.debug('👹 Monsters appear:', data.monsters)
          useGameStore.getState().handleMonstersAppear(data as unknown as GameMonstersAppearEvent)
        } else {
          useGameStore.getState().handleCombatUpdate(data as unknown as GameCombatUpdateEvent)
        }
      })
      ch.listen('.loot.dropped', (data: LootDroppedData) => {
        logger.debug('💎 Loot dropped:', data)
        useGameStore.getState().handleLootDropped(data as unknown as GameLootDroppedEvent)
      })
      ch.listen('.level.up', (data: LevelUpData) => {
        logger.debug('🎉 Level up:', data)
        useGameStore.getState().handleLevelUp(data as unknown as GameLevelUpEvent)
      })
      ch.listen('.inventory.update', (data: InventoryUpdateData) => {
        useGameStore.getState().handleInventoryUpdate(data)
      })
      subscribedCharacterIdRef.current = characterId
    }

    try {
      const connector = echo.connector as EchoConnector
      const connection = connector?.pusher?.connection
      if (connection) {
        const handleConnected = () => {
          logger.debug('WebSocket: 已连接')
          setIsConnected(true)
          setAuthError(false)
          clearReconnectTimer() // 清除重连定时器
          doSubscribe()
        }

        const handleError = (error: unknown) => {
          logger.error('WebSocket: 连接错误', error)
          setIsConnected(false)
          setAuthError(true)
          // 有重连机制，不需要显示错误提示
        }

        const handleDisconnected = () => {
          logger.debug('WebSocket: 已断开')
          setIsConnected(false)
          // 启动重连定时器
          if (!reconnectTimerRef.current && characterId) {
            logger.debug('WebSocket: 启动重连定时器')
            reconnectTimerRef.current = setInterval(() => {
              logger.debug('WebSocket: 尝试重新订阅...')
              resubscribe()
            }, RECONNECT_INTERVAL_MS)
          }
        }

        connection.bind('connected', handleConnected)
        connection.bind('error', handleError)
        connection.bind('disconnected', handleDisconnected)
        connectionCleanup = () => {
          connection.unbind('connected', handleConnected)
          connection.unbind('error', handleError)
          connection.unbind('disconnected', handleDisconnected)
        }

        if (connection.state === 'connected') {
          doSubscribe()
        }
      } else {
        doSubscribe()
      }
    } catch (error) {
      logger.warn('WebSocket: 无法绑定连接事件', error)
      doSubscribe()
    }

    // 清理函数：避免 React Strict Mode 下刚订阅就被 cleanup 取消（150ms 内不真正 unsubscribe）
    return () => {
      clearReconnectTimer()
      connectionCleanup?.()
      if (subscribedCharacterIdRef.current !== characterId) return
      if (Date.now() - subscribedAtRef.current < SUBSCRIBE_DEBOUNCE_MS) return

      logger.debug('WebSocket: 清理连接')
      if (channelRef.current) {
        try {
          channelRef.current.stopListening('.combat.update')
          channelRef.current.stopListening('.loot.dropped')
          channelRef.current.stopListening('.level.up')
          channelRef.current.stopListening('.inventory.update')
          channelRef.current.unsubscribe()
        } catch (error) {
          logger.warn('WebSocket: 清理频道时出错', error)
        }
        channelRef.current = null
      }
      subscribedCharacterIdRef.current = null
      setIsConnected(false)
    }
  }, [characterId, resubscribe])

  // 返回连接状态，供 UI 显示（可选）
  return { isConnected, authError }
}
