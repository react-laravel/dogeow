'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { OllamaModelListItem } from '@/lib/utils/ollama-models'
import { fetchBrowserLocalOllamaModels, useBrowserOllamaAddress } from './browserOllama'
import { useOllamaAccessMode } from './ollamaAccessMode'

export type { OllamaModelListItem } from '@/lib/utils/ollama-models'

interface UseOllamaModelsOptions {
  enabled?: boolean
}

interface UseOllamaModelsReturn {
  ollamaModels: OllamaModelListItem[]
  isLoadingOllamaModels: boolean
  refetch: () => void
}

async function fetchServerOllamaModels(): Promise<OllamaModelListItem[]> {
  const response = await fetch('/api/ollama/models')
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = (await response.json()) as { models?: OllamaModelListItem[] }
  return Array.isArray(data.models) ? data.models : []
}

export function useOllamaModels(options: UseOllamaModelsOptions = {}): UseOllamaModelsReturn {
  const { enabled = true } = options
  const { effectiveOllamaAccessMode } = useOllamaAccessMode()
  const { browserOllamaAddress } = useBrowserOllamaAddress()

  const [ollamaModels, setOllamaModels] = useState<OllamaModelListItem[]>([])
  const [isLoadingOllamaModels, setIsLoadingOllamaModels] = useState(false)

  const hasLoadedOllamaModelsRef = useRef(false)
  const isOllamaModelsRequestInFlightRef = useRef(false)

  const loadOllamaModels = useCallback(async () => {
    if (hasLoadedOllamaModelsRef.current || isOllamaModelsRequestInFlightRef.current) {
      return
    }

    let cancelled = false

    isOllamaModelsRequestInFlightRef.current = true
    setIsLoadingOllamaModels(true)

    try {
      let models: OllamaModelListItem[]

      if (effectiveOllamaAccessMode === 'browser') {
        models = await fetchBrowserLocalOllamaModels()
      } else if (effectiveOllamaAccessMode === 'server') {
        models = await fetchServerOllamaModels()
      } else {
        try {
          models = await fetchBrowserLocalOllamaModels()
        } catch {
          models = await fetchServerOllamaModels()
        }
      }

      if (!cancelled) {
        setOllamaModels(models)
        hasLoadedOllamaModelsRef.current = true
      }
    } catch (error) {
      if (!cancelled) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to load Ollama models:', error)
        }
        setOllamaModels([])
      }
    } finally {
      isOllamaModelsRequestInFlightRef.current = false
      if (!cancelled) {
        setIsLoadingOllamaModels(false)
      }
    }
  }, [effectiveOllamaAccessMode])

  useEffect(() => {
    if (!enabled) {
      return
    }

    hasLoadedOllamaModelsRef.current = false
    void loadOllamaModels()

    return () => {
      // Note: This doesn't properly cancel the in-flight request,
      // but it prevents state updates after unmount
    }
  }, [browserOllamaAddress, enabled, effectiveOllamaAccessMode, loadOllamaModels])

  const refetch = useCallback(() => {
    hasLoadedOllamaModelsRef.current = false
    void loadOllamaModels()
  }, [loadOllamaModels])

  return {
    ollamaModels,
    isLoadingOllamaModels,
    refetch,
  }
}
