import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import type { AudioControllerOptions } from '../types'

type MediaSourceOptions = Pick<
  AudioControllerOptions,
  | 'playback'
  | 'settings'
  | 'callbacks'
  | 'currentTrack'
  | 'refs'
  | 'buildAudioUrl'
  | 'suppressPrimaryAudio'
>

export function useMediaSourceSetup({
  playback,
  settings,
  callbacks,
  currentTrack,
  refs,
  buildAudioUrl,
  suppressPrimaryAudio = false,
}: MediaSourceOptions) {
  const { isMuted } = settings
  const { volume } = settings
  const { setAudioError, setIsTrackChanging, setReadyToPlay } = callbacks
  const { audioRef, gainNodeRef } = refs

  const setupMediaSource = useCallback(() => {
    if (suppressPrimaryAudio) return
    if (!audioRef.current || !currentTrack) return

    try {
      const audioUrl = buildAudioUrl(currentTrack)

      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = audioUrl

      try {
        if (audioRef.current.dataset) {
          audioRef.current.dataset.trackSrc = audioUrl
        }
      } catch {
        // ignore
      }

      audioRef.current.volume = isMuted ? 0 : volume
      audioRef.current.muted = isMuted
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = isMuted ? 0 : 1
      }
      audioRef.current.load()

      setAudioError(null)
      setIsTrackChanging(true)
      setReadyToPlay(false)
    } catch (err) {
      console.error('setupMediaSource: failed to set audio source', err)
      setAudioError(`Failed to set audio source: ${err}`)
      toast.error('Failed to set audio source', { description: String(err) })
    }
  }, [
    currentTrack,
    buildAudioUrl,
    setAudioError,
    setIsTrackChanging,
    setReadyToPlay,
    isMuted,
    volume,
    audioRef,
    gainNodeRef,
    suppressPrimaryAudio,
  ])

  useEffect(() => {
    if (suppressPrimaryAudio) return
    if (!currentTrack || !audioRef.current) return

    const desiredUrl = buildAudioUrl(currentTrack)
    let currentMarkedSrc: string | null = null

    try {
      currentMarkedSrc = audioRef.current.dataset?.trackSrc ?? null
    } catch {
      currentMarkedSrc = null
    }

    const currentElementSrc = audioRef.current.src
    const isSameByMark = currentMarkedSrc === desiredUrl
    const isSameByElement = !!currentElementSrc && currentElementSrc === desiredUrl

    if (!isSameByMark && !isSameByElement) {
      setupMediaSource()
    }
  }, [currentTrack, buildAudioUrl, setupMediaSource, audioRef, suppressPrimaryAudio])

  return { setupMediaSource }
}
