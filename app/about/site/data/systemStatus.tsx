'use client'

import { useMemo } from 'react'
import { Server, Activity, ListTodo, Database, Layers, Wifi, Clock, Github } from 'lucide-react'
import useSWR from 'swr'
import { apiRequest } from '@/lib/api'
import type { SystemStatus } from '../types'
import type { SystemStatusApiResponse } from '../types-api'

const STATUS_KEY = 'system/status'
const REFRESH_INTERVAL_MS = 12_000

type StatusKind = 'online' | 'offline' | 'warning' | 'error'
const GITHUB_STATUS_UNAVAILABLE_MESSAGE = '当前后端尚未返回 GitHub API 状态'

function normalizeStatus(s: string): StatusKind {
  if (s === 'online') return 'online'
  if (s === 'offline') return 'offline'
  if (s === 'warning') return 'warning'
  return 'error'
}

function serviceDetails(
  status: string,
  details: string,
  responseTime?: number
): string | undefined {
  if (responseTime != null && status === 'online') {
    if (details.startsWith('响应时间:')) {
      return undefined
    }

    return details || undefined
  }

  return details || undefined
}

export function mapApiToSystemStatus(data: SystemStatusApiResponse): SystemStatus[] {
  const iconClass = 'h-5 w-5 text-gray-600 dark:text-gray-400'
  const githubStatus: SystemStatus = data.github
    ? {
        name: 'GitHub API',
        label: 'REST / GraphQL 配额',
        status: normalizeStatus(data.github.status),
        icon: <Github className={iconClass} />,
        details: data.github.details || undefined,
      }
    : {
        name: 'GitHub API',
        label: 'REST / GraphQL 配额',
        status: 'warning',
        icon: <Github className={iconClass} />,
        details: GITHUB_STATUS_UNAVAILABLE_MESSAGE,
      }

  return [
    {
      name: data.hermes.name,
      label: data.hermes.label,
      status: normalizeStatus(data.hermes.status),
      icon: <Server className={iconClass} />,
      responseTimeMs: data.hermes.response_time,
      details: serviceDetails(data.hermes.status, data.hermes.details, data.hermes.response_time),
    },
    {
      name: '数据库',
      label: data.database.label ?? '数据库',
      status: normalizeStatus(data.database.status),
      icon: <Database className={iconClass} />,
      responseTimeMs: data.database.response_time,
      details: serviceDetails(
        data.database.status,
        data.database.details,
        data.database.response_time
      ),
    },
    {
      name: 'Redis',
      label: 'Redis 缓存服务',
      status: normalizeStatus(data.redis.status),
      icon: <Layers className={iconClass} />,
      responseTimeMs: data.redis.response_time,
      details: serviceDetails(data.redis.status, data.redis.details, data.redis.response_time),
    },
    {
      name: 'CDN',
      label: '又拍云 CDN',
      status: normalizeStatus(data.cdn.status),
      icon: <Wifi className={iconClass} />,
      responseTimeMs: data.cdn.response_time,
      details: serviceDetails(data.cdn.status, data.cdn.details, data.cdn.response_time),
    },
    {
      name: 'Reverb',
      label: 'Laravel Reverb WebSocket',
      status: normalizeStatus(data.reverb.status),
      icon: <Activity className={iconClass} />,
      details: data.reverb.details || undefined,
    },
    {
      name: '队列',
      label: 'Laravel 队列 Worker',
      status: normalizeStatus(data.queue.status),
      icon: <ListTodo className={iconClass} />,
      details: data.queue.details || undefined,
    },
    {
      name: '调度器',
      label: 'Laravel 任务调度',
      status: normalizeStatus(data.scheduler.status),
      icon: <Clock className={iconClass} />,
      details: data.scheduler.details || undefined,
    },
    githubStatus,
  ]
}

export function fallbackStatuses(message: string, isError: boolean = true): SystemStatus[] {
  const iconClass = 'h-5 w-5 text-gray-600 dark:text-gray-400'
  const status: StatusKind = isError ? 'error' : 'online'
  return [
    {
      name: '小龙虾🦞',
      label: 'Hermes',
      status,
      icon: <Server className={iconClass} />,
      details: message,
    },
    {
      name: '数据库',
      label: '数据库',
      status,
      icon: <Database className={iconClass} />,
      details: message,
    },
    {
      name: 'Redis',
      label: 'Redis 缓存服务',
      status,
      icon: <Layers className={iconClass} />,
      details: message,
    },
    {
      name: 'CDN',
      label: '又拍云 CDN',
      status,
      icon: <Wifi className={iconClass} />,
      details: message,
    },
    {
      name: 'Reverb',
      label: 'Laravel Reverb WebSocket',
      status,
      icon: <Activity className={iconClass} />,
      details: message,
    },
    {
      name: '队列',
      label: 'Laravel 队列 Worker',
      status,
      icon: <ListTodo className={iconClass} />,
      details: message,
    },
    {
      name: '调度器',
      label: 'Laravel 任务调度',
      status,
      icon: <Clock className={iconClass} />,
      details: message,
    },
    {
      name: 'GitHub API',
      label: 'REST / GraphQL 配额',
      status,
      icon: <Github className={iconClass} />,
      details: message,
    },
  ]
}

const fetcher = (endpoint: string) =>
  apiRequest<SystemStatusApiResponse>(endpoint, 'GET', undefined, { handleError: false })

export interface SystemStatusSnapshot {
  statuses: SystemStatus[]
  lastCheck: Date
}

export const useSystemStatus = (): SystemStatusSnapshot => {
  const { data, error, isLoading } = useSWR<SystemStatusApiResponse>(STATUS_KEY, fetcher, {
    refreshInterval: REFRESH_INTERVAL_MS,
    revalidateOnFocus: false,
  })

  return useMemo(() => {
    const lastCheck = new Date()
    if (error) {
      return {
        statuses: fallbackStatuses(
          error instanceof Error ? error.message : '获取状态失败，请稍后刷新',
          true
        ),
        lastCheck,
      }
    }
    if (isLoading || !data) {
      return {
        statuses: fallbackStatuses('加载中…', false),
        lastCheck,
      }
    }
    return {
      statuses: mapApiToSystemStatus(data),
      lastCheck,
    }
  }, [data, error, isLoading])
}
