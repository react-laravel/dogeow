'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface OllamaModelListItem {
  name: string
  size?: number
  parameterSize?: string
  supportsVision?: boolean
}

interface UseOllamaModelsOptions {
  enabled?: boolean
}

interface UseOllamaModelsReturn {
  ollamaModels: OllamaModelListItem[]
  isLoadingOllamaModels: boolean
  refetch: () => void
}

export function useOllamaModels(options: UseOllamaModelsOptions = {}): UseOllamaModelsReturn {
  const { enabled = true } = options

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
      const response = await fetch('/api/ollama/models')
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = (await response.json()) as { models?: OllamaModelListItem[] }
      if (!cancelled) {
        setOllamaModels(Array.isArray(data.models) ? data.models : [])
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
  }, [])

  useEffect(() => {
    if (!enabled) {
      return
    }

    void loadOllamaModels()

    return () => {
      // Note: This doesn't properly cancel the in-flight request,
      // but it prevents state updates after unmount
    }
  }, [enabled, loadOllamaModels])

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
