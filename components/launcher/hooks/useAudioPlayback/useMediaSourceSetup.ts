import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import type { AudioControllerOptions } from '../types'

type MediaSourceOptions = Pick<
  AudioControllerOptions,
  'settings' | 'callbacks' | 'currentTrack' | 'refs' | 'buildAudioUrl'
>

export function useMediaSourceSetup({
  settings,
  callbacks,
  currentTrack,
  refs,
  buildAudioUrl,
}: MediaSourceOptions) {
  const { volume, isMuted } = settings
  const { setAudioError, setIsTrackChanging, setReadyToPlay, setCurrentTime, setDuration } =
    callbacks
  const { audioRef, gainNodeRef } = refs
  const sourceRevisionRef = useRef(0)
  const isChangingSourceRef = useRef(false)

  // 切歌事件和 React effect 共用这一个入口。先同步音源，再更新歌名，避免播放旧曲。
  const setupMediaSource = useCallback(
    (track = currentTrack): boolean => {
      const audio = audioRef.current
      if (!audio || !track) return false

      try {
        const audioUrl = buildAudioUrl(track)
        if (!audioUrl) return false
        const resolvedUrl = new URL(audioUrl, document.baseURI).href
        // dataset 只是标记，不能用它代替实际 src，否则旧音源可能被误认为已经更新。
        if (audio.src === resolvedUrl) return true

        sourceRevisionRef.current += 1
        isChangingSourceRef.current = true
        setIsTrackChanging(true)
        setReadyToPlay(false)
        setCurrentTime(0)
        setDuration(0)
        setAudioError(null)

        audio.pause()
        audio.src = audioUrl
        audio.dataset.trackSrc = audioUrl
        audio.volume = isMuted ? 0 : volume
        audio.muted = isMuted
        if (gainNodeRef.current) gainNodeRef.current.gain.value = isMuted ? 0 : 1
        audio.load()
        return true
      } catch (err) {
        isChangingSourceRef.current = false
        setIsTrackChanging(false)
        console.error('setupMediaSource: failed to set audio source', err)
        setAudioError(`Failed to set audio source: ${err}`)
        toast.error('Failed to set audio source', { description: String(err) })
        return false
      }
    },
    [
      currentTrack,
      buildAudioUrl,
      setAudioError,
      setIsTrackChanging,
      setReadyToPlay,
      setCurrentTime,
      setDuration,
      isMuted,
      volume,
      audioRef,
      gainNodeRef,
    ]
  )

  useEffect(() => {
    setupMediaSource()
  }, [setupMediaSource])

  return { setupMediaSource, sourceRevisionRef, isChangingSourceRef }
}
