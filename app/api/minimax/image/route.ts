import { NextRequest, NextResponse } from 'next/server'
import {
  MINIMAX_API_BASE_URL,
  MINIMAX_TOKEN_API_KEY,
  MINIMAX_TOKEN_API_HEADERS,
  MINIMAX_IMAGE_MODEL,
} from '../_lib/config'
import { requireAuth } from '../../_lib/auth-guard'

export interface ImageRequest {
  prompt: string
  aspectRatio?: string
  n?: number
  promptOptimizer?: boolean
}

export async function POST(request: NextRequest) {
  // Auth guard: require valid Bearer token
  const authError = requireAuth(request)
  if (authError) return authError

  if (!MINIMAX_TOKEN_API_KEY) {
    return NextResponse.json(
      { error: 'MiniMax Token API Key 未配置，请设置 MINIMAX_TOKEN_API_KEY' },
      { status: 500 }
    )
  }

  let body: ImageRequest
  try {
    body = (await request.json()) as ImageRequest
  } catch {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 })
  }

  const { prompt, aspectRatio = '1:1', n = 1, promptOptimizer = true } = body

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt 参数不能为空' }, { status: 400 })
  }

  try {
    const response = await fetch(`${MINIMAX_API_BASE_URL}/v1/image_generation`, {
      method: 'POST',
      headers: {
        ...MINIMAX_TOKEN_API_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MINIMAX_IMAGE_MODEL,
        prompt: prompt.trim(),
        aspect_ratio: aspectRatio,
        n: Math.min(Math.max(n, 1), 9),
        prompt_optimizer: promptOptimizer,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const msg = data?.base_resp?.status_msg ?? data?.error ?? `HTTP ${response.status}`
      return NextResponse.json(
        { error: `MiniMax Image API 错误: ${msg}` },
        { status: response.status }
      )
    }

    const imageUrls: string[] = data?.data?.image_urls ?? []
    if (imageUrls.length === 0) {
      return NextResponse.json({ error: '未返回图片' }, { status: 500 })
    }

    return NextResponse.json({ success: true, imageUrls })
  } catch (err) {
    console.error('[MiniMax Image]', err)
    return NextResponse.json({ error: '图片生成请求失败' }, { status: 500 })
  }
}
