'use client'

import { useCallback, useEffect, useState } from 'react'

export const OLLAMA_ACCESS_MODE_OPTIONS = ['auto', 'browser', 'server'] as const

export type OllamaAccessMode = (typeof OLLAMA_ACCESS_MODE_OPTIONS)[number]
export type OllamaAccessModeSelection = OllamaAccessMode | 'default'

const OLLAMA_ACCESS_MODE_STORAGE_KEY = 'ollama_access_mode_override'
const OLLAMA_ACCESS_MODE_CHANGE_EVENT = 'ollama-access-mode-change'

const DEFAULT_OLLAMA_ACCESS_MODE =
  normalizeOllamaAccessMode(process.env.NEXT_PUBLIC_OLLAMA_ACCESS_MODE) ?? 'auto'

export function normalizeOllamaAccessMode(
  value: string | null | undefined
): OllamaAccessMode | null {
  if (value === 'auto' || value === 'browser' || value === 'server') {
    return value
  }

  return null
}

function normalizeOllamaAccessModeSelection(
  value: string | null | undefined
): OllamaAccessModeSelection | null {
  if (value === 'default') {
    return value
  }

  return normalizeOllamaAccessMode(value)
}

export function getDefaultOllamaAccessMode(): OllamaAccessMode {
  return DEFAULT_OLLAMA_ACCESS_MODE
}

export function getStoredOllamaAccessModeSelection(): OllamaAccessModeSelection {
  if (typeof window === 'undefined') {
    return 'default'
  }

  const stored = localStorage.getItem(OLLAMA_ACCESS_MODE_STORAGE_KEY)
  return normalizeOllamaAccessModeSelection(stored) ?? 'default'
}

export function getEffectiveOllamaAccessMode(): OllamaAccessMode {
  const selection = getStoredOllamaAccessModeSelection()
  return selection === 'default' ? DEFAULT_OLLAMA_ACCESS_MODE : selection
}

export function setStoredOllamaAccessModeSelection(selection: OllamaAccessModeSelection): void {
  if (typeof window === 'undefined') {
    return
  }

  if (selection === 'default') {
    localStorage.removeItem(OLLAMA_ACCESS_MODE_STORAGE_KEY)
  } else {
    localStorage.setItem(OLLAMA_ACCESS_MODE_STORAGE_KEY, selection)
  }

  window.dispatchEvent(new Event(OLLAMA_ACCESS_MODE_CHANGE_EVENT))
}

export function getOllamaAccessModeLabel(mode: OllamaAccessModeSelection): string {
  switch (mode) {
    case 'default':
      return '跟随站点默认'
    case 'auto':
      return '自动'
    case 'browser':
      return '仅本机'
    case 'server':
      return '仅服务器'
  }
}

export function useOllamaAccessMode() {
  const [ollamaAccessModeSelection, setSelection] = useState<OllamaAccessModeSelection>(() =>
    getStoredOllamaAccessModeSelection()
  )

  const setOllamaAccessModeSelection = useCallback((selection: OllamaAccessModeSelection) => {
    setStoredOllamaAccessModeSelection(selection)
    setSelection(selection)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const syncSelection = () => {
      setSelection(getStoredOllamaAccessModeSelection())
    }

    window.addEventListener('storage', syncSelection)
    window.addEventListener(OLLAMA_ACCESS_MODE_CHANGE_EVENT, syncSelection)

    return () => {
      window.removeEventListener('storage', syncSelection)
      window.removeEventListener(OLLAMA_ACCESS_MODE_CHANGE_EVENT, syncSelection)
    }
  }, [])

  return {
    ollamaAccessModeSelection,
    effectiveOllamaAccessMode:
      ollamaAccessModeSelection === 'default'
        ? DEFAULT_OLLAMA_ACCESS_MODE
        : ollamaAccessModeSelection,
    defaultOllamaAccessMode: DEFAULT_OLLAMA_ACCESS_MODE,
    setOllamaAccessModeSelection,
  }
}
