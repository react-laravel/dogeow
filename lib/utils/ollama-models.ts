export interface OllamaTagModel {
  name: string
  model?: string
  size?: number
  modified_at?: string
  details?: {
    family?: string
    families?: string[]
    parameter_size?: string
    quantization_level?: string
    format?: string
  }
}

export interface OllamaTagsResponse {
  models?: OllamaTagModel[]
}

export interface OllamaShowResponse {
  capabilities?: string[]
  details?: {
    family?: string
    families?: string[]
    parent_model?: string
    parameter_size?: string
    quantization_level?: string
    format?: string
  }
  model_info?: Record<string, unknown>
}

export interface OllamaModelListItem {
  name: string
  size?: number
  modifiedAt?: string
  family?: string
  parameterSize?: string
  quantizationLevel?: string
  supportsVision: boolean
}

interface EnrichedOllamaModel {
  model: OllamaTagModel
  show?: OllamaShowResponse
}

const EMBEDDING_NAME_PATTERNS = [
  /^embeddinggemma(?::|$)/i,
  /^nomic-embed-text(?::|$)/i,
  /^qwen\d*(?:\.\d+)?-embedding(?::|$)/i,
  /^all-minilm(?::|$)/i,
  /^mxbai-embed-large(?::|$)/i,
  /^bge-/i,
  /^snowflake-arctic-embed/i,
]

const EMBEDDING_FAMILY_PATTERNS = [/embed/i, /^bert$/i, /bert/i]
const VISION_NAME_PATTERNS = [/^llava(?::|$)/i, /vision/i, /vl(?::|$)/i, /minicpm-v/i]
const CLOUD_NAME_PATTERN = /:cloud$/i

export function isCloudModel(model: OllamaTagModel): boolean {
  return [model.name, model.model].some(
    value => typeof value === 'string' && CLOUD_NAME_PATTERN.test(value)
  )
}

export function isEmbeddingByHeuristic(model: OllamaTagModel, show?: OllamaShowResponse): boolean {
  const name = model.name ?? ''
  const families = [
    model.details?.family,
    ...(model.details?.families ?? []),
    show?.details?.family,
    ...(show?.details?.families ?? []),
  ]
    .filter(Boolean)
    .join(' ')

  if (EMBEDDING_NAME_PATTERNS.some(pattern => pattern.test(name))) {
    return true
  }

  return EMBEDDING_FAMILY_PATTERNS.some(pattern => pattern.test(families))
}

export function isChatCapableModel(model: OllamaTagModel, show?: OllamaShowResponse): boolean {
  if (isCloudModel(model)) {
    return false
  }

  const capabilities = show?.capabilities ?? []
  if (capabilities.length > 0) {
    if (capabilities.includes('completion')) {
      return true
    }

    if (capabilities.includes('embedding')) {
      return false
    }
  }

  return !isEmbeddingByHeuristic(model, show)
}

export function supportsVision(model: OllamaTagModel, show?: OllamaShowResponse): boolean {
  const capabilities = show?.capabilities ?? []
  if (capabilities.length > 0) {
    return capabilities.includes('vision')
  }

  return VISION_NAME_PATTERNS.some(pattern => pattern.test(model.name ?? ''))
}

export function buildOllamaModelList(enriched: EnrichedOllamaModel[]): OllamaModelListItem[] {
  return enriched
    .filter(({ model, show }) => isChatCapableModel(model, show))
    .map(({ model, show }) => ({
      name: model.name,
      size: model.size,
      modifiedAt: model.modified_at,
      family: show?.details?.family ?? model.details?.family,
      parameterSize: show?.details?.parameter_size ?? model.details?.parameter_size,
      quantizationLevel: show?.details?.quantization_level ?? model.details?.quantization_level,
      supportsVision: supportsVision(model, show),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
