import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MusicPlayer } from '../MusicPlayer'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

vi.mock('@/app/thing/stores/filterPersistenceStore', () => ({
  useFilterPersistenceStore: () => ({ clearFilters: vi.fn() }),
}))

vi.mock('../common/LogoButton', () => ({
  LogoButton: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      logo
    </button>
  ),
}))

vi.mock('@/components/ui/back-button', () => ({
  BackButton: ({ onClick, title }: { onClick: () => void; title?: string }) => (
    <button type="button" onClick={onClick} title={title}>
      back
    </button>
  ),
}))

vi.mock('../music/PlayerControlButton', () => ({
  PlayerControlButton: ({ onClick, title }: { onClick: () => void; title: string }) => (
    <button type="button" onClick={onClick} title={title}>
      {title}
    </button>
  ),
}))

vi.mock('../music/TrackInfo', () => ({
  TrackInfo: () => <div>track-info</div>,
}))

vi.mock('../music/ProgressBar', () => ({
  ProgressBar: () => <div>progress-bar</div>,
}))

function createProps(
  overrides: Partial<React.ComponentProps<typeof MusicPlayer>> = {}
): React.ComponentProps<typeof MusicPlayer> {
  return {
    isPlaying: true,
    audioError: null,
    currentTime: 10,
    duration: 120,
    volume: 0.5,
    isMuted: false,
    availableTracks: [{ path: 'song.mp3', name: 'Song', duration: 120 }],
    currentTrack: 'song.mp3',
    playMode: 'all',
    readyToPlay: true,
    isLoadingTracks: false,
    toggleMute: vi.fn(),
    switchToPrevTrack: vi.fn(),
    switchToNextTrack: vi.fn(),
    handleProgressChange: vi.fn(),
    getCurrentTrackName: () => 'Song',
    currentLyric: '',
    hasLyrics: false,
    formatTime: (time: number) => `${time}`,
    togglePlay: vi.fn(),
    toggleDisplayMode: vi.fn(),
    onTrackSelect: vi.fn(),
    onSetPlayMode: vi.fn(),
    onOpenFullscreen: vi.fn(),
    ...overrides,
  }
}

describe('MusicPlayer', () => {
  it('keeps the pause button visible while refreshing the playlist for an already ready track', () => {
    render(<MusicPlayer {...createProps({ isLoadingTracks: true, readyToPlay: true })} />)

    expect(screen.getByTitle('暂停')).toBeInTheDocument()
    expect(screen.queryByTestId('music-player-loading')).not.toBeInTheDocument()
  })

  it('shows the loading indicator when the current track is not ready yet', () => {
    render(<MusicPlayer {...createProps({ readyToPlay: false, isLoadingTracks: false })} />)

    expect(screen.getByTestId('music-player-loading')).toBeInTheDocument()
    expect(screen.queryByTitle('暂停')).not.toBeInTheDocument()
  })
})
