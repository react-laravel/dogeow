import { NextRequest, NextResponse } from 'next/server'
import {
  MINIMAX_API_BASE_URL,
  MINIMAX_TOKEN_API_HEADERS,
  MINIMAX_TOKEN_API_KEY,
  MINIMAX_VIDEO_MODEL,
} from '../_lib/config'
import { requireAuth } from '../../_lib/auth-guard'

export interface VideoRequest {
  prompt: string
  model?: string
  firstFrameImage?: string
  duration?: number
  resolution?: string
}

async function pollForVideo(taskId: string, model: string): Promise<string> {
  const maxRetries = model === 'MiniMax-Hailuo-02' ? 60 : 30
  const retryInterval = 20000 // 20 seconds

  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, retryInterval))

    const statusRes = await fetch(
      `${MINIMAX_API_BASE_URL}/v1/query/video_generation?task_id=${taskId}`,
      { headers: MINIMAX_TOKEN_API_HEADERS }
    )
    const statusData = await statusRes.json()
    const status = statusData?.status

    if (status === 'Fail') {
      throw new Error(`视频生成失败: task_id=${taskId}`)
    }

    if (status === 'Success') {
      const fileId: string = statusData?.file_id
      if (!fileId) throw new Error('响应中缺少 file_id')

      const fileRes = await fetch(`${MINIMAX_API_BASE_URL}/v1/files/retrieve?file_id=${fileId}`, {
        headers: MINIMAX_TOKEN_API_HEADERS,
      })
      const fileData = await fileRes.json()
      const downloadUrl: string = fileData?.file?.download_url
      if (!downloadUrl) throw new Error('响应中缺少 download_url')
      return downloadUrl
    }
  }

  throw new Error(`视频生成超时: task_id=${taskId}`)
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

  let body: VideoRequest
  try {
    body = (await request.json()) as VideoRequest
  } catch {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 })
  }

  const { prompt, model = MINIMAX_VIDEO_MODEL, firstFrameImage, duration, resolution } = body

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt 参数不能为空' }, { status: 400 })
  }

  try {
    const payload: Record<string, unknown> = {
      model,
      prompt: prompt.trim(),
    }
    if (firstFrameImage) payload.first_frame_image = firstFrameImage
    if (duration) payload.duration = duration
    if (resolution) payload.resolution = resolution

    const response = await fetch(`${MINIMAX_API_BASE_URL}/v1/video_generation`, {
      method: 'POST',
      headers: {
        ...MINIMAX_TOKEN_API_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      const msg = data?.base_resp?.status_msg ?? data?.error ?? `HTTP ${response.status}`
      return NextResponse.json(
        { error: `MiniMax Video API 错误: ${msg}` },
        { status: response.status }
      )
    }

    const taskId: string = data?.task_id
    if (!taskId) {
      return NextResponse.json({ error: '未返回 task_id' }, { status: 500 })
    }

    // Video generation is async — poll for completion
    const videoUrl = await pollForVideo(taskId, model)

    return NextResponse.json({ success: true, videoUrl, taskId })
  } catch (err) {
    console.error('[MiniMax Video]', err)
    const msg = err instanceof Error ? err.message : '视频生成请求失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
