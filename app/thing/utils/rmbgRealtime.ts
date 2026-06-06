'use client'

import type Echo from 'laravel-echo'
import { createEchoInstance, getEchoInstance } from '@/lib/websocket'
import type { RmbgStatusResponse } from './rmbg'

export type RmbgStatusEvent = RmbgStatusResponse & {
  upload_path: string
  item_id?: number | null
  item_image_id?: number | null
}

type RmbgListener = (event: RmbgStatusEvent) => void

const RMBG_EVENT_NAME = '.rmbg.status.updated'
const RMBG_WAIT_TIMEOUT_MS = 120_000

const listeners = new Set<RmbgListener>()
let subscribedUserId: number | null = null
let subscribedChannelName: string | null = null
let subscribedChannel: ReturnType<Echo<'reverb'>['private']> | null = null

function dispatchRmbgEvent(raw: unknown): void {
  if (!raw || typeof raw !== 'object') {
    return
  }

  const event = raw as RmbgStatusEvent
  if (typeof event.upload_path !== 'string' || typeof event.status !== 'string') {
    return
  }

  listeners.forEach(listener => listener(event))
}

function teardownSubscription(): void {
  if (!subscribedChannel || !subscribedChannelName) {
    subscribedUserId = null
    subscribedChannel = null
    subscribedChannelName = null
    return
  }

  try {
    subscribedChannel.stopListening(RMBG_EVENT_NAME)
  } catch {
    // ignore cleanup errors
  }

  const echo = getEchoInstance()
  if (echo && subscribedChannelName) {
    try {
      echo.leave(subscribedChannelName)
    } catch {
      // ignore cleanup errors
    }
  }

  subscribedUserId = null
  subscribedChannel = null
  subscribedChannelName = null
}

export function ensureRmbgSubscription(userId: number): void {
  if (subscribedUserId === userId && subscribedChannel) {
    return
  }

  teardownSubscription()

  const echo = getEchoInstance() ?? createEchoInstance()
  if (!echo) {
    return
  }

  const channelName = `user.${userId}.uploads`
  const channel = echo.private(channelName)
  channel.listen(RMBG_EVENT_NAME, dispatchRmbgEvent)

  subscribedUserId = userId
  subscribedChannelName = channelName
  subscribedChannel = channel
}

export function subscribeRmbgStatusUpdates(userId: number, listener: RmbgListener): () => void {
  ensureRmbgSubscription(userId)
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      teardownSubscription()
    }
  }
}

export function waitForRmbgStatus(
  uploadPath: string,
  userId: number,
  onUpdate: (result: RmbgStatusResponse) => void
): Promise<'done' | 'failed' | 'timeout'> {
  return new Promise(resolve => {
    let settled = false

    const finish = (outcome: 'done' | 'failed' | 'timeout') => {
      if (settled) {
        return
      }
      settled = true
      window.clearTimeout(timeoutId)
      unsubscribe()
      resolve(outcome)
    }

    const unsubscribe = subscribeRmbgStatusUpdates(userId, event => {
      if (event.upload_path !== uploadPath) {
        return
      }

      onUpdate(event)

      if (event.status === 'done') {
        finish('done')
        return
      }

      if (event.status === 'failed') {
        finish('failed')
      }
    })

    const timeoutId = window.setTimeout(() => {
      finish('timeout')
    }, RMBG_WAIT_TIMEOUT_MS)
  })
}

export function extractUploadUserId(uploadPath: string): number | null {
  const match = /^uploads\/(\d+)\//.exec(uploadPath)
  if (!match) {
    return null
  }

  const userId = Number.parseInt(match[1], 10)
  return Number.isFinite(userId) ? userId : null
}
