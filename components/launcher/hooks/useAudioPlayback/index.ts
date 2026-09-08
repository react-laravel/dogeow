import { useRef, useEffect, useState, useCallback } from 'react'
import type { AudioControllerOptions, AudioControllerResult } from '../types'
import { useBackgroundTransition } from './useBackgroundTransition'
import { useMediaSourceSetup } from './useMediaSourceSetup'
import { usePlaybackControls } from './usePlaybackControls'
import { usePlayPauseEffect } from './usePlayPauseEffect'
import { useVolumeSync } from './useVolumeSync'
import { usePlaybackEventListeners } from './usePlaybackEventListeners'
import { useVisibilityLifecycle } from './useVisibilityLifecycle'

export function useAudioPlayback(options: AudioControllerOptions): AudioControllerResult {
  const {
    playback,
    settings,
    callbacks,
    currentTrack,
    availableTracks,
    refs,
    buildAudioUrl,
    initAudioContext,
  } = options

  const { isPlaying } = playback
  const { audioRef } = refs
  const isPlayingRef = useRef(isPlaying)
  const [playbackResumeNonce, setPlaybackResumeNonce] = useState(0)

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  const { markBackgroundTransition, clearBackgroundTransition, isDuringBackgroundTransition } =
    useBackgroundTransition()

  const getActiveAudio = useCallback(() => audioRef.current, [audioRef])

  const { setupMediaSource, sourceRevisionRef, isChangingSourceRef } = useMediaSourceSetup({
    settings,
    callbacks,
    currentTrack,
    refs,
    buildAudioUrl,
  })

  const {
    reportPlayError,
    togglePlay,
    switchTrack,
    handleProgressChange,
    toggleMute,
    resetCurrentTime,
    handleLoadedMetadata,
    handleAudioError,
    handleTimeUpdate,
  } = usePlaybackControls({
    playback,
    settings,
    callbacks,
    currentTrack,
    availableTracks,
    refs,
    initAudioContext,
    getActiveAudio,
    setupMediaSource,
    sourceRevisionRef,
    isPlayingRef,
  })

  usePlayPauseEffect({
    playback,
    currentTrack,
    sourceRevisionRef,
    settings,
    refs,
    initAudioContext,
    reportPlayError,
    isPlayingRef,
    playbackResumeNonce,
  })

  useVolumeSync({ settings, refs })

  usePlaybackEventListeners({
    refs,
    sourceRevisionRef,
    isChangingSourceRef,
    callbacks,
    clearBackgroundTransition,
    isDuringBackgroundTransition,
  })

  useVisibilityLifecycle({
    playback,
    refs,
    getActiveAudio,
    markBackgroundTransition,
    setPlaybackResumeNonce,
  })

  return {
    audioRef,
    analyserNode: null,
    togglePlay,
    switchTrack,
    handleProgressChange,
    handleLoadedMetadata,
    handleTimeUpdate,
    handleAudioError,
    setupMediaSource,
    toggleMute,
    resetCurrentTime,
  }
}
