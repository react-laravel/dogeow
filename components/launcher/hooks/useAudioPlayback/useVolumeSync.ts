import { useEffect } from 'react'
import type { AudioControllerOptions } from '../types'

type VolumeSyncOptions = Pick<AudioControllerOptions, 'settings' | 'refs' | 'handoffAudioRef'>

export function useVolumeSync({ settings, refs, handoffAudioRef }: VolumeSyncOptions) {
  const { volume, isMuted } = settings
  const { audioRef, gainNodeRef } = refs

  useEffect(() => {
    const targetVolume = isMuted ? 0 : volume

    if (audioRef.current) {
      audioRef.current.volume = targetVolume
      audioRef.current.muted = isMuted
    }

    if (handoffAudioRef?.current) {
      handoffAudioRef.current.volume = targetVolume
      handoffAudioRef.current.muted = isMuted
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : 1
    }
  }, [volume, isMuted, audioRef, handoffAudioRef, gainNodeRef])
}
