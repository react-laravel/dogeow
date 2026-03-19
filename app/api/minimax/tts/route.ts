import { NextRequest, NextResponse } from 'next/server'
import {
  MINIMAX_API_BASE_URL,
  MINIMAX_TOKEN_API_KEY,
  MINIMAX_TOKEN_API_HEADERS,
  MINIMAX_TTS_MODEL,
  MINIMAX_DEFAULT_VOICE_ID,
} from '../_lib/config'

export interface TTSRequest {
  text: string
  voiceId?: string
  speed?: number
  vol?: number
  pitch?: number
  emotion?: string
  sampleRate?: number
  bitrate?: number
  format?: string
  languageBoost?: string
}

export async function POST(request: NextRequest) {
  if (!MINIMAX_TOKEN_API_KEY) {
    return NextResponse.json(
      { error: 'MiniMax Token API Key 未配置，请设置 MINIMAX_TOKEN_API_KEY' },
      { status: 500 }
    )
  }

  let body: TTSRequest
  try {
    body = (await request.json()) as TTSRequest
  } catch {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 })
  }

  const {
    text,
    voiceId,
    speed = 1.0,
    vol = 1.0,
    pitch = 0,
    emotion = 'happy',
    sampleRate = 32000,
    bitrate = 128000,
    format = 'mp3',
    languageBoost,
  } = body

  if (!text?.trim()) {
    return NextResponse.json({ error: 'text 参数不能为空' }, { status: 400 })
  }

  try {
    const response = await fetch(`${MINIMAX_API_BASE_URL}/v1/t2a_v2`, {
      method: 'POST',
      headers: {
        ...MINIMAX_TOKEN_API_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MINIMAX_TTS_MODEL,
        text: text.trim(),
        voice_setting: {
          voice_id: voiceId ?? MINIMAX_DEFAULT_VOICE_ID,
          speed,
          vol,
          pitch,
          emotion,
        },
        audio_setting: {
          sample_rate: sampleRate,
          bitrate,
          format,
          channel: 1,
        },
        output_format: 'url',
        ...(languageBoost && { language_boost: languageBoost }),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const msg = data?.base_resp?.status_msg ?? data?.error ?? `HTTP ${response.status}`
      return NextResponse.json(
        { error: `MiniMax TTS API 错误: ${msg}` },
        { status: response.status }
      )
    }

    const audioUrl = data?.data?.audio
    if (!audioUrl) {
      return NextResponse.json({ error: '未返回音频 URL' }, { status: 500 })
    }

    return NextResponse.json({ success: true, audioUrl })
  } catch (err) {
    console.error('[MiniMax TTS]', err)
    return NextResponse.json({ error: 'TTS 请求失败' }, { status: 500 })
  }
}
