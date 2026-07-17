import { NextRequest, NextResponse } from 'next/server'
import { requireAiAccess } from '../../_lib/auth-guard'
import {
  buildOllamaModelList,
  type OllamaShowResponse,
  type OllamaTagsResponse,
} from '@/lib/utils/ollama-models'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const OLLAMA_TAGS_URL = `${OLLAMA_BASE_URL}/api/tags`
const OLLAMA_SHOW_URL = `${OLLAMA_BASE_URL}/api/show`

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function GET(request: NextRequest) {
  // Auth guard: require valid Bearer token to prevent model enumeration
  const authError = await requireAiAccess(request)
  if (authError) return authError

  try {
    const tags = await fetchJson<OllamaTagsResponse>(OLLAMA_TAGS_URL)
    const models = tags.models ?? []

    const enriched = await Promise.all(
      models.map(async model => {
        try {
          const show = await fetchJson<OllamaShowResponse>(OLLAMA_SHOW_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: model.name }),
          })

          return { model, show }
        } catch {
          return { model, show: undefined }
        }
      })
    )

    const chatModels = buildOllamaModelList(enriched)

    return NextResponse.json({ models: chatModels })
  } catch (error) {
    const message = error instanceof Error ? error.message : '无法获取 Ollama 模型列表'
    // Ollama 不可用时返回可降级结果，避免前端产生资源加载失败日志。
    return NextResponse.json({ error: message, models: [], available: false })
  }
}
