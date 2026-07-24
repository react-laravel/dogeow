import { useCallback } from 'react'
import type { AudioControllerOptions } from '../types'

type ActiveAudioOptions = Pick<
  AudioControllerOptions,
  'refs' | 'handoffAudioRef' | 'nativeHandoffActive'
>

export function useActiveAudio({
  refs,
  handoffAudioRef,
  nativeHandoffActive = false,
}: ActiveAudioOptions) {
  const { audioRef } = refs

  const getActiveAudio = useCallback((): HTMLAudioElement | null => {
    if (nativeHandoffActive && handoffAudioRef?.current?.src) {
      return handoffAudioRef.current
    }

    return audioRef.current
  }, [audioRef, handoffAudioRef, nativeHandoffActive])

  return { getActiveAudio }
}
