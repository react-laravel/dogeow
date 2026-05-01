/**
 * Audio Controller Types - Value Objects for reducing LongParameterList
 * These types group related audio state into cohesive Value Objects
 */

import type { MusicTrack } from '@/stores/musicStore'

export type AudioVisualizerSourceNode = MediaStreamAudioSourceNode | MediaElementAudioSourceNode

// ============================================
// Playback State Value Object
// ============================================
export interface PlaybackState {
  isPlaying: boolean
  readyToPlay: boolean
  userInteracted: boolean
  isTrackChanging: boolean
  playMode: 'none' | 'all' | 'one' | 'shuffle'
}

// ============================================
// Audio Position Value Object
// ============================================
export interface AudioPosition {
  currentTime: number
  duration: number
}

// ============================================
// Audio Callbacks Value Object
// ============================================
export interface AudioCallbacks {
  setIsPlaying: (isPlaying: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setReadyToPlay: (ready: boolean) => void
  setAudioError: (error: string | null) => void
  setIsTrackChanging: (changing: boolean) => void
  setIsMuted: (isMuted: boolean) => void
}

// ============================================
// Audio Settings Value Object
// ============================================
export interface AudioSettings {
  volume: number
  isMuted: boolean
}

// ============================================
// Audio Refs Value Object
// ============================================
export interface AudioRefs {
  audioRef: React.RefObject<HTMLAudioElement | null>
  audioContextRef: React.MutableRefObject<AudioContext | null>
  analyserRef: React.MutableRefObject<AnalyserNode | null>
  sourceRef: React.MutableRefObject<AudioVisualizerSourceNode | null>
  gainNodeRef: React.MutableRefObject<GainNode | null>
}

// ============================================
// Audio Controller Options - Refactored to use Value Objects
// ============================================
export interface AudioControllerOptions {
  // Playback state
  playback: PlaybackState
  // Audio position
  position: AudioPosition
  // Settings
  settings: AudioSettings
  // Callbacks
  callbacks: AudioCallbacks
  // Music store data
  currentTrack: string
  availableTracks: MusicTrack[]
  // Refs
  refs: AudioRefs
  // Utilities
  buildAudioUrl: (track: string) => string
  initAudioContext: (audioElement: HTMLAudioElement | null) => void
}

// ============================================
// Audio Controller Return Types
// ============================================
export interface AudioControllerResult {
  audioRef: React.RefObject<HTMLAudioElement | null>
  analyserNode: AnalyserNode | null
  togglePlay: () => void
  switchTrack: (direction: 'next' | 'prev') => void
  handleProgressChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleLoadedMetadata: () => void
  handleTimeUpdate: () => void
  handleAudioError: (e: React.SyntheticEvent<HTMLAudioElement, Event>) => void
  setupMediaSource: () => void
  toggleMute: () => void
  resetCurrentTime: () => void
}

// ============================================
// Backwards compatibility type alias
// ============================================

// Re-export UseAudioPlaybackOptions from this file for backwards compatibility
// The refactored interface uses AudioControllerOptions which wraps the original
// 18 individual parameters into cohesive Value Objects
