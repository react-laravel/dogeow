'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { authenticatedInternalFetch } from '@/lib/api/internal-auth'
import { FALLBACK_CODEX_MODELS, type CodexModelListItem } from '@/lib/utils/codex-models'

export type { CodexModelListItem } from '@/lib/utils/codex-models'

interface UseCodexModelsOptions {
  enabled?: boolean
}

interface UseCodexModelsReturn {
  codexModels: CodexModelListItem[]
  isLoadingCodexModels: boolean
  refetch: () => void
}

async function fetchCodexModels(): Promise<CodexModelListItem[]> {
  const response = await authenticatedInternalFetch('/api/codex/models')
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = (await response.json()) as { models?: CodexModelListItem[] }
  if (Array.isArray(data.models) && data.models.length > 0) {
    return data.models
  }
  return [...FALLBACK_CODEX_MODELS]
}

export function useCodexModels(options: UseCodexModelsOptions = {}): UseCodexModelsReturn {
  const { enabled = true } = options
  const [codexModels, setCodexModels] = useState<CodexModelListItem[]>([...FALLBACK_CODEX_MODELS])
  const [isLoadingCodexModels, setIsLoadingCodexModels] = useState(false)
  const hasLoadedRef = useRef(false)
  const inFlightRef = useRef(false)

  const loadCodexModels = useCallback(async () => {
    if (hasLoadedRef.current || inFlightRef.current) return

    inFlightRef.current = true
    setIsLoadingCodexModels(true)
    try {
      const models = await fetchCodexModels()
      setCodexModels(models)
      hasLoadedRef.current = true
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to load ChatGPT models:', error)
      }
      setCodexModels([...FALLBACK_CODEX_MODELS])
    } finally {
      inFlightRef.current = false
      setIsLoadingCodexModels(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    hasLoadedRef.current = false
    void loadCodexModels()
  }, [enabled, loadCodexModels])

  const refetch = useCallback(() => {
    hasLoadedRef.current = false
    void loadCodexModels()
  }, [loadCodexModels])

  return {
    codexModels,
    isLoadingCodexModels,
    refetch,
  }
}
