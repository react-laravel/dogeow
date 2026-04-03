import { NextRequest, NextResponse } from 'next/server'
import {
  MINIMAX_API_BASE_URL,
  MINIMAX_TOKEN_API_HEADERS,
  MINIMAX_TOKEN_API_KEY,
  MINIMAX_VIDEO_MODEL,
} from '../_lib/config'
import { requireAuth } from '../../_lib/auth-guard'
import { logger } from '@/lib/logger'

export interface VideoRequest {
  prompt: string
  model?: string
  firstFrameImage?: string
  duration?: number
  resolution?: string
}

const VALID_VIDEO_MODELS = [
  'MiniMax-Hailuo-2.3',
  'MiniMax-Hailuo-02',
  'T2V-01-Director',
  'T2V-01',
] as const

const VIDEO_MODEL_ALIASES: Record<string, string> = {
  'MiniMax-Hailuo-2.3-6s-768p': 'MiniMax-Hailuo-2.3',
  'MiniMax-Hailuo-2.3-Fast-6s-768p': 'MiniMax-Hailuo-2.3',
  'MiniMax-Hailuo-02-6s-768p': 'MiniMax-Hailuo-02',
}

const VIDEO_MODEL_FALLBACKS = [
  'MiniMax-Hailuo-2.3',
  'MiniMax-Hailuo-02',
  'T2V-01-Director',
  'T2V-01',
] as const

function shouldRetryWithFallbackModel(msg: string): boolean {
  return /not\s+support\s+model|incorrect\s+model\s+param\s+input/i.test(msg)
}

function normalizeModelInput(model: unknown): string {
  if (typeof model !== 'string') return ''

  const normalized = model.trim()
  if (!normalized || normalized.includes('*')) return ''

  const aliasedModel = VIDEO_MODEL_ALIASES[normalized] ?? normalized
  return (VALID_VIDEO_MODELS as readonly string[]).includes(aliasedModel) ? aliasedModel : ''
}

function normalizeResolutionInput(resolution: unknown): string {
  if (typeof resolution !== 'string') return ''
  const normalized = resolution.trim().toUpperCase()
  return ['720P', '768P', '1080P'].includes(normalized) ? normalized : ''
}

function buildCandidateModels(requestModel: unknown): string[] {
  const candidates = new Set<string>()
  const normalizedRequestModel = normalizeModelInput(requestModel)
  const normalizedDefaultModel = normalizeModelInput(MINIMAX_VIDEO_MODEL)

  if (normalizedRequestModel) candidates.add(normalizedRequestModel)
  if (normalizedDefaultModel) candidates.add(normalizedDefaultModel)

  for (const fallbackModel of VIDEO_MODEL_FALLBACKS) {
    candidates.add(fallbackModel)
  }

  return Array.from(candidates)
}

function extractTaskId(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''

  const data = payload as {
    task_id?: unknown
    taskId?: unknown
    data?: {
      task_id?: unknown
      taskId?: unknown
      task?: {
        id?: unknown
      }
    }
  }

  const candidate =
    data.task_id ?? data.taskId ?? data.data?.task_id ?? data.data?.taskId ?? data.data?.task?.id

  return typeof candidate === 'string' ? candidate.trim() : ''
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
    const status = statusData?.status ?? statusData?.data?.status

    if (status === 'Fail') {
      throw new Error(`视频生成失败: task_id=${taskId}`)
    }

    if (status === 'Success') {
      const fileId: string = statusData?.file_id ?? statusData?.data?.file_id
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

  const { prompt, model, firstFrameImage, duration, resolution } = body

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt 参数不能为空' }, { status: 400 })
  }

  try {
    const requestVideo = async (selectedModel: string) => {
      const payload: Record<string, unknown> = {
        model: selectedModel,
        prompt: prompt.trim(),
      }
      if (firstFrameImage) payload.first_frame_image = firstFrameImage
      if (duration) payload.duration = duration
      const normalizedResolution = normalizeResolutionInput(resolution)
      if (normalizedResolution) payload.resolution = normalizedResolution

      const response = await fetch(`${MINIMAX_API_BASE_URL}/v1/video_generation`, {
        method: 'POST',
        headers: {
          ...MINIMAX_TOKEN_API_HEADERS,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      return { response, data }
    }

    const candidateModels = buildCandidateModels(model)
    let selectedModel = candidateModels[0]
    let { response, data } = await requestVideo(selectedModel)

    if (!response.ok) {
      let msg: string = data?.base_resp?.status_msg ?? data?.error ?? `HTTP ${response.status}`

      if (shouldRetryWithFallbackModel(msg)) {
        for (const fallbackModel of candidateModels) {
          if (fallbackModel === selectedModel) {
            continue
          }

          const retryResult = await requestVideo(fallbackModel)
          response = retryResult.response
          data = retryResult.data
          selectedModel = fallbackModel

          if (response.ok) break

          msg = data?.base_resp?.status_msg ?? data?.error ?? `HTTP ${response.status}`
          if (!shouldRetryWithFallbackModel(msg)) {
            break
          }
        }
      }
    }

    if (!response.ok) {
      const msg = data?.base_resp?.status_msg ?? data?.error ?? `HTTP ${response.status}`
      return NextResponse.json(
        { error: `MiniMax Video API 错误: ${msg}` },
        { status: response.status }
      )
    }

    const taskId = extractTaskId(data)
    if (!taskId) {
      return NextResponse.json(
        { error: '未返回 task_id', message: data?.base_resp?.status_msg ?? data?.error },
        { status: 500 }
      )
    }

    // Video generation is async — poll for completion
    const videoUrl = await pollForVideo(taskId, selectedModel)

    return NextResponse.json({ success: true, videoUrl, taskId, model: selectedModel })
  } catch (err) {
    logger.error('[MiniMax Video]', err)
    const msg = err instanceof Error ? err.message : '视频生成请求失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
