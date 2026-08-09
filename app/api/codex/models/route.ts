import { NextRequest, NextResponse } from 'next/server'
import { requireAiAccess } from '../../_lib/auth-guard'
import { getCodexCredentials } from '../../generate/_lib/codex-auth'
import { codexFetch } from '../../generate/_lib/codex-fetch'
import { CODEX_BACKEND_BASE_URL } from '../../generate/_lib/config'
import { FALLBACK_CODEX_MODELS, parseCodexModelsResponse } from '@/lib/utils/codex-models'

const CODEX_CLIENT_VERSION = process.env.CODEX_CLIENT_VERSION?.trim() || '0.147.0'

function buildModelsUrl(): string {
  const base = CODEX_BACKEND_BASE_URL.replace(/\/$/, '')
  return `${base}/models?client_version=${encodeURIComponent(CODEX_CLIENT_VERSION)}`
}

export async function GET(request: NextRequest) {
  const authError = await requireAiAccess(request)
  if (authError) return authError

  try {
    const credentials = await getCodexCredentials()
    const headers: Record<string, string> = {
      Authorization: `Bearer ${credentials.accessToken}`,
      Accept: 'application/json',
      originator: 'dogeow',
    }
    if (credentials.accountId) {
      headers['chatgpt-account-id'] = credentials.accountId
    }

    const response = await codexFetch(buildModelsUrl(), {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      return NextResponse.json(
        {
          error: `ChatGPT 模型列表不可用（HTTP ${response.status}）${detail ? `：${detail.slice(0, 200)}` : ''}`,
          models: FALLBACK_CODEX_MODELS,
          available: false,
          source: 'fallback',
        },
        { status: 200 }
      )
    }

    const payload = await response.json().catch(() => null)
    const models = parseCodexModelsResponse(payload)
    if (models.length === 0) {
      return NextResponse.json({
        models: FALLBACK_CODEX_MODELS,
        available: false,
        source: 'fallback',
      })
    }

    return NextResponse.json({
      models,
      available: true,
      source: 'codex',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '无法获取 ChatGPT 模型列表'
    return NextResponse.json({
      error: message,
      models: FALLBACK_CODEX_MODELS,
      available: false,
      source: 'fallback',
    })
  }
}
