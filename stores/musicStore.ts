import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MusicTrack {
  path: string
  name: string
  duration: number
  hasLyrics?: boolean
}

// 播放模式类型
export type PlayMode = 'none' | 'all' | 'one' | 'shuffle'
export type AudioPlaybackMode = 'auto' | 'visualizer' | 'native'

interface PersistedMusicState {
  currentTrack: string
  volume: number
  playMode: PlayMode
  audioPlaybackMode: AudioPlaybackMode
}

interface MusicState {
  currentTrack: string
  volume: number
  availableTracks: MusicTrack[]
  isPlaying: boolean
  playMode: PlayMode
  audioPlaybackMode: AudioPlaybackMode
  setCurrentTrack: (track: string) => void
  setVolume: (volume: number) => void
  setAvailableTracks: (tracks: MusicTrack[]) => void
  setIsPlaying: (isPlaying: boolean) => void
  setPlayMode: (mode: PlayMode) => void
  setAudioPlaybackMode: (mode: AudioPlaybackMode) => void
}

const normalizePlayMode = (value: unknown): PlayMode => {
  if (value === 'none' || value === 'all' || value === 'one' || value === 'shuffle') {
    return value
  }

  return 'all'
}

const normalizeAudioPlaybackMode = (value: unknown): AudioPlaybackMode => {
  if (value === 'auto' || value === 'visualizer' || value === 'native') {
    return value
  }

  return 'auto'
}

export const useMusicStore = create<MusicState>()(
  persist(
    set => ({
      currentTrack: '',
      volume: 0.5,
      availableTracks: [],
      isPlaying: false,
      playMode: 'all',
      audioPlaybackMode: 'auto',
      setCurrentTrack: (track: string) => set({ currentTrack: track }),
      setVolume: (volume: number) => set({ volume }),
      setAvailableTracks: (tracks: MusicTrack[]) => set({ availableTracks: tracks }),
      setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
      setPlayMode: (mode: PlayMode) => set({ playMode: mode }),
      setAudioPlaybackMode: (audioPlaybackMode: AudioPlaybackMode) => set({ audioPlaybackMode }),
    }),
    {
      name: 'music-storage',
      version: 2,
      partialize: state => ({
        currentTrack: state.currentTrack,
        volume: state.volume,
        playMode: state.playMode,
        audioPlaybackMode: state.audioPlaybackMode,
      }),
      migrate: persistedState => {
        const state = persistedState as Partial<MusicState> | undefined

        return {
          currentTrack: typeof state?.currentTrack === 'string' ? state.currentTrack : '',
          volume: typeof state?.volume === 'number' ? state.volume : 0.5,
          playMode: normalizePlayMode(state?.playMode),
          audioPlaybackMode: normalizeAudioPlaybackMode(state?.audioPlaybackMode),
        } satisfies PersistedMusicState
      },
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<PersistedMusicState> | undefined

        return {
          ...currentState,
          currentTrack:
            typeof state?.currentTrack === 'string'
              ? state.currentTrack
              : currentState.currentTrack,
          volume: typeof state?.volume === 'number' ? state.volume : currentState.volume,
          playMode: normalizePlayMode(state?.playMode ?? currentState.playMode),
          audioPlaybackMode: normalizeAudioPlaybackMode(
            state?.audioPlaybackMode ?? currentState.audioPlaybackMode
          ),
          availableTracks: [],
          isPlaying: false,
        }
      },
    }
  )
)
