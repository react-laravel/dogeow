import { NextRequest, NextResponse } from 'next/server'
import {
  MINIMAX_API_BASE_URL,
  MINIMAX_TOKEN_API_KEY,
  MINIMAX_TOKEN_API_HEADERS,
  MINIMAX_MUSIC_MODEL,
} from '../_lib/config'
import { requireAuth } from '../../_lib/auth-guard'

export interface MusicRequest {
  prompt: string
  lyrics: string
  format?: string
}

export async function POST(request: NextRequest) {
  // Auth guard: require valid Bearer token
  const authError = await requireAuth(request)
  if (authError) return authError

  if (!MINIMAX_TOKEN_API_KEY) {
    return NextResponse.json(
      { error: 'MiniMax Token API Key 未配置，请设置 MINIMAX_TOKEN_API_KEY' },
      { status: 500 }
    )
  }

  let body: MusicRequest
  try {
    body = (await request.json()) as MusicRequest
  } catch {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 })
  }

  const { prompt, lyrics, format = 'mp3' } = body

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt 参数不能为空' }, { status: 400 })
  }
  if (!lyrics?.trim()) {
    return NextResponse.json({ error: 'lyrics 参数不能为空' }, { status: 400 })
  }

  try {
    const response = await fetch(`${MINIMAX_API_BASE_URL}/v1/music_generation`, {
      method: 'POST',
      headers: {
        ...MINIMAX_TOKEN_API_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MINIMAX_MUSIC_MODEL,
        prompt: prompt.trim(),
        lyrics: lyrics.trim(),
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format,
        },
        output_format: 'url',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const msg = data?.base_resp?.status_msg ?? data?.error ?? `HTTP ${response.status}`
      return NextResponse.json(
        { error: `MiniMax Music API 错误: ${msg}` },
        { status: response.status }
      )
    }

    const musicUrl: string = data?.data?.audio
    if (!musicUrl) {
      return NextResponse.json({ error: '未返回音乐 URL' }, { status: 500 })
    }

    return NextResponse.json({ success: true, musicUrl })
  } catch (err) {
    console.error('[MiniMax Music]', err)
    return NextResponse.json({ error: '音乐生成请求失败' }, { status: 500 })
  }
}
