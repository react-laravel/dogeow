'use client'

import { useCallback, useState } from 'react'
import { getRemoveBgPreference, setRemoveBgPreference } from '../utils/rmbg'

export function useRemoveBgPreference() {
  const [removeBgEnabled, setRemoveBgEnabledState] = useState(() => getRemoveBgPreference())

  const setRemoveBgEnabled = useCallback((enabled: boolean) => {
    setRemoveBgEnabledState(enabled)
    setRemoveBgPreference(enabled)
  }, [])

  return { removeBgEnabled, setRemoveBgEnabled }
}
