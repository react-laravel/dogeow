import { useCallback, useRef, useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

interface UseAutoSaveOptions<T> {
  onSave: (data: T, signal: AbortSignal) => Promise<void>
  delay?: number
  initialData?: T
}

interface UseAutoSaveReturn<T> {
  autoSaving: boolean
  lastSaved: Date | null
  triggerAutoSave: () => void
  setInitialData: (data: T) => void
  cancelAutoSave: () => void
}

export function useAutoSave<T>({
  onSave,
  delay = 2000,
  initialData,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const savingRef = useRef(false)
  const initialDataRef = useRef<T | null>(initialData || null)

  const autoSave = useCallback(async () => {
    if (!initialDataRef.current) return

    // Prevent concurrent saves
    if (savingRef.current) return
    savingRef.current = true

    // Cancel any previous save attempt
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setAutoSaving(true)
    try {
      await onSave(initialDataRef.current, abortControllerRef.current.signal)
      setLastSaved(new Date())
    } catch (error) {
      // Only log if not aborted
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.error('自动保存失败:', error)
      }
    } finally {
      setAutoSaving(false)
      savingRef.current = false
      abortControllerRef.current = null
    }
  }, [onSave])

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave()
    }, delay)
  }, [autoSave, delay])

  const setInitialData = useCallback((data: T) => {
    initialDataRef.current = data
  }, [])

  const cancelAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
      autoSaveTimeoutRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    autoSaving,
    lastSaved,
    triggerAutoSave,
    setInitialData,
    cancelAutoSave,
  }
}
