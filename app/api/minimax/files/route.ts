import { NextRequest, NextResponse } from 'next/server'
import {
  MINIMAX_API_BASE_URL,
  MINIMAX_TOKEN_API_HEADERS,
  MINIMAX_TOKEN_API_KEY,
} from '../_lib/config'
import { requireAuth } from '../../_lib/auth-guard'
import { logger } from '@/lib/logger'

export interface MiniMaxFile {
  id: string
  bytes: number
  created_at: number
  filename: string
  purpose: string
}

export interface FilesListResponse {
  success: boolean
  files: MiniMaxFile[]
  has_more: boolean
  error?: string
}

export async function GET(request: NextRequest) {
  // Auth guard: require valid Bearer token (validates against backend)
  const authError = await requireAuth(request)
  if (authError) return authError

  if (!MINIMAX_TOKEN_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: 'MiniMax Token API Key 未配置，请设置 MINIMAX_TOKEN_API_KEY',
        files: [],
        has_more: false,
      },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100)
  const cursor = searchParams.get('cursor') ?? undefined

  try {
    const params = new URLSearchParams({ limit: String(limit) })
    if (cursor) params.set('cursor', cursor)

    const response = await fetch(`${MINIMAX_API_BASE_URL}/v1/files/list?${params.toString()}`, {
      method: 'GET',
      headers: MINIMAX_TOKEN_API_HEADERS,
    })

    const data = await response.json()

    if (!response.ok) {
      const msg = data?.base_resp?.status_msg ?? data?.error ?? `HTTP ${response.status}`
      return NextResponse.json(
        { success: false, error: `MiniMax Files API 错误: ${msg}`, files: [], has_more: false },
        { status: response.status }
      )
    }

    const rawFiles: Array<{
      file_id?: number | string
      id?: string
      bytes: number
      created_at: number
      filename: string
      purpose: string
    }> = data?.files ?? []

    const files: MiniMaxFile[] = rawFiles.map(f => ({
      id: String(f.file_id ?? f.id ?? ''),
      bytes: f.bytes,
      created_at: f.created_at,
      filename: f.filename,
      purpose: f.purpose,
    }))

    // Use cursor-based pagination: last file_id becomes next cursor
    const hasMore = files.length === limit
    const nextCursor = hasMore ? String(files[files.length - 1]?.id) : undefined

    return NextResponse.json({ success: true, files, has_more: hasMore, next_cursor: nextCursor })
  } catch (err) {
    logger.error('[MiniMax Files]', err)
    return NextResponse.json(
      { success: false, error: '文件列表请求失败', files: [], has_more: false },
      { status: 500 }
    )
  }
}
