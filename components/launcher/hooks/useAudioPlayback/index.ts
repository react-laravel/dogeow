import { useRef, useEffect, useState } from 'react'
import type { AudioControllerOptions, AudioControllerResult } from '../types'
import { useBackgroundTransition } from './useBackgroundTransition'
import { useActiveAudio } from './useActiveAudio'
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
    suppressPrimaryAudio = false,
    handoffAudioRef,
    nativeHandoffActive = false,
    shouldDeferBackgroundResume,
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

  const { getActiveAudio } = useActiveAudio({
    refs,
    handoffAudioRef,
    nativeHandoffActive,
  })

  const { setupMediaSource } = useMediaSourceSetup({
    playback,
    settings,
    callbacks,
    currentTrack,
    refs,
    buildAudioUrl,
    suppressPrimaryAudio,
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
    handoffAudioRef,
    nativeHandoffActive,
    initAudioContext,
    getActiveAudio,
    setupMediaSource,
  })

  usePlayPauseEffect({
    playback,
    settings,
    refs,
    nativeHandoffActive,
    initAudioContext,
    getActiveAudio,
    reportPlayError,
    isPlayingRef,
    playbackResumeNonce,
  })

  useVolumeSync({ settings, refs, handoffAudioRef })

  usePlaybackEventListeners({
    refs,
    callbacks,
    handoffAudioRef,
    nativeHandoffActive,
    clearBackgroundTransition,
    isDuringBackgroundTransition,
  })

  useVisibilityLifecycle({
    playback,
    shouldDeferBackgroundResume,
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
