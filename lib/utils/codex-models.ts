export type CodexModelListItem = {
  value: string
  label: string
  description?: string
}

/** 探测失败时的兜底列表（不含已下线的 spark） */
export const FALLBACK_CODEX_MODELS: CodexModelListItem[] = [
  { value: 'gpt-5.6-sol', label: '5.6 Sol' },
  { value: 'gpt-5.6-terra', label: '5.6 Terra' },
  { value: 'gpt-5.6-luna', label: '5.6 Luna' },
  { value: 'gpt-5.5', label: '5.5' },
  { value: 'gpt-5.4', label: '5.4' },
  { value: 'gpt-5.4-mini', label: '5.4 Mini' },
]

export const DEFAULT_CODEX_MODEL = 'gpt-5.6-luna'
export const DEPRECATED_CODEX_MODELS = ['gpt-5.3-codex-spark'] as const

export const CODEX_ULTRA_MODELS = new Set(['gpt-5.6-sol', 'gpt-5.6-terra'])

export function formatCodexModelLabel(slug: string, displayName?: string): string {
  const source = String(displayName || slug || '').trim()
  if (!source) return slug
  return source
    .replace(/^GPT-?/i, '')
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(part => {
      if (/^\d+(\.\d+)?$/.test(part)) return part
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join(' ')
}

function extractSlug(item: unknown): string {
  if (typeof item === 'string') return item.trim()
  if (!item || typeof item !== 'object') return ''
  const record = item as Record<string, unknown>
  return String(record.slug || record.id || record.name || '').trim()
}

/**
 * 从 Codex /models 响应筛出可选模型。
 */
export function parseCodexModelsResponse(payload: unknown): CodexModelListItem[] {
  const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {}
  const source = Array.isArray(root.models)
    ? root.models
    : Array.isArray(root.data)
      ? root.data
      : Array.isArray(payload)
        ? payload
        : []

  const items: CodexModelListItem[] = []
  const seen = new Set<string>()

  for (const entry of source) {
    const slug = extractSlug(entry)
    if (!slug || seen.has(slug)) continue
    if (typeof entry === 'object' && entry) {
      const visibility = String(
        (entry as { visibility?: string }).visibility || 'list'
      ).toLowerCase()
      if (visibility === 'hide' || visibility === 'hidden') continue
      if ((entry as { supported_in_api?: boolean }).supported_in_api === false) continue
      if (slug === 'codex-auto-review') continue
    }

    const displayName =
      typeof entry === 'object' && entry
        ? String((entry as { display_name?: string }).display_name || '')
        : ''
    const description =
      typeof entry === 'object' && entry
        ? String((entry as { description?: string }).description || '')
        : ''

    seen.add(slug)
    items.push({
      value: slug,
      label: formatCodexModelLabel(slug, displayName),
      description: description || undefined,
    })
  }

  return items
}

export function normalizeCodexModel(model: string | undefined | null): string {
  const value = String(model || '').trim()
  if (!value) return DEFAULT_CODEX_MODEL
  if ((DEPRECATED_CODEX_MODELS as readonly string[]).includes(value)) {
    return DEFAULT_CODEX_MODEL
  }
  return value
}

export function resolveCodexModelSelection(
  currentModel: string,
  availableModels: CodexModelListItem[]
): string {
  const current = normalizeCodexModel(currentModel)
  if (availableModels.length === 0) return current
  if (availableModels.some(item => item.value === current)) return current

  const preferred = availableModels.find(item => item.value === DEFAULT_CODEX_MODEL)
  return preferred?.value || availableModels[0].value
}

export function getCodexModelLabel(
  model: string | undefined,
  availableModels: CodexModelListItem[] = FALLBACK_CODEX_MODELS
): string {
  if (!model) return ''
  const found = availableModels.find(item => item.value === model)
  return found?.label || formatCodexModelLabel(model)
}
