import { useEffect } from 'react'
import type { AudioControllerOptions } from '../types'

type VolumeSyncOptions = Pick<AudioControllerOptions, 'settings' | 'refs'>

export function useVolumeSync({ settings, refs }: VolumeSyncOptions) {
  const { volume, isMuted } = settings
  const { audioRef, gainNodeRef } = refs

  useEffect(() => {
    const targetVolume = isMuted ? 0 : volume

    if (audioRef.current) {
      audioRef.current.volume = targetVolume
      audioRef.current.muted = isMuted
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : 1
    }
  }, [volume, isMuted, audioRef, gainNodeRef])
}
