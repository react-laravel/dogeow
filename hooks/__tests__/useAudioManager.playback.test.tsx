import { act, fireEvent, render, screen, cleanup } from '@testing-library/react'
import { createRef, forwardRef, useImperativeHandle } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAudioManager } from '../useAudioManager'
import { useLauncherPlayback } from '@/components/launcher/hooks/useLauncherPlayback'
import { useMusicStore } from '@/stores/musicStore'

vi.mock('@/components/launcher/music/useTrackLyrics', () => ({
  useTrackLyrics: () => ({
    currentLyric: '',
    lyrics: [],
    activeLyricIndex: -1,
    status: 'idle',
    hasLyrics: false,
  }),
}))
vi.mock('@/lib/api', () => ({ apiRequest: vi.fn() }))

interface MediaState {
  paused: boolean
  ended: boolean
  readyState: number
}
let states: WeakMap<HTMLMediaElement, MediaState>
let playedSources: string[]
let playerRef = createRef<ReturnType<typeof useAudioManager>>()
const getState = (audio: HTMLMediaElement) => {
  if (!states.has(audio)) states.set(audio, { paused: true, ended: false, readyState: 0 })
  return states.get(audio)!
}

const Player = forwardRef<ReturnType<typeof useAudioManager>>(function Player(_, ref) {
  const manager = useAudioManager()
  const { audioRef, handleLoadedMetadata, handleTimeUpdate } = manager
  useImperativeHandle(ref, () => manager, [manager])
  const playback = useLauncherPlayback({ audioManager: manager })
  return (
    <>
      <span data-testid="track">{manager.getCurrentTrackName()}</span>
      <button
        onClick={() => {
          manager.markUserInteracted()
          manager.togglePlay()
        }}
      >
        {manager.isPlaying ? '暂停' : '播放'}
      </button>
      <button onClick={() => manager.switchTrack('next')}>下一首</button>
      <audio
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onCanPlay={() => manager.setReadyToPlay(true)}
        onEnded={playback.switchToNextTrack}
      />
    </>
  )
})

beforeEach(() => {
  vi.useFakeTimers()
  playerRef = createRef<ReturnType<typeof useAudioManager>>()
  states = new WeakMap()
  playedSources = []
  useMusicStore.setState({
    currentTrack: '/first.mp3',
    audioPlaybackMode: 'native',
    isPlaying: false,
    playMode: 'all',
    availableTracks: [
      { path: '/first.mp3', name: '第一首', duration: 10 },
      { path: '/second.mp3', name: '第二首', duration: 10 },
    ],
  })
  vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(function (
    this: HTMLMediaElement
  ) {
    return getState(this).paused
  })
  vi.spyOn(HTMLMediaElement.prototype, 'ended', 'get').mockImplementation(function (
    this: HTMLMediaElement
  ) {
    return getState(this).ended
  })
  vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockImplementation(function (
    this: HTMLMediaElement
  ) {
    return getState(this).readyState
  })
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(function (
    this: HTMLMediaElement
  ) {
    const state = getState(this)
    state.paused = true
    state.ended = false
    state.readyState = 0
    this.currentTime = 0
    this.dispatchEvent(new Event('emptied'))
    const src = this.src
    setTimeout(() => {
      if (this.src !== src) return
      state.readyState = 4
      this.dispatchEvent(new Event('loadedmetadata'))
      this.dispatchEvent(new Event('canplay'))
      if (!state.paused) this.dispatchEvent(new Event('playing'))
    }, 10)
  })
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
    this: HTMLMediaElement
  ) {
    const state = getState(this)
    state.paused = false
    state.ended = false
    playedSources.push(this.src)
    this.dispatchEvent(new Event('play'))
    if (state.readyState >= 3) this.dispatchEvent(new Event('playing'))
    return Promise.resolve()
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
    this: HTMLMediaElement
  ) {
    const state = getState(this)
    if (state.paused) return
    state.paused = true
    this.dispatchEvent(new Event('pause'))
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const settle = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(150)
  })
}
const start = async () => {
  render(<Player ref={playerRef} />)
  await settle()
  fireEvent.click(screen.getByRole('button', { name: '播放' }))
  await settle()
  return playerRef.current!.audioRef.current!
}
const endTrack = (audio: HTMLAudioElement) => {
  act(() => {
    Object.assign(getState(audio), { paused: true, ended: true })
    audio.dispatchEvent(new Event('pause'))
    audio.dispatchEvent(new Event('ended'))
  })
}

describe('player source and state integration', () => {
  it('automatically plays the next displayed track and resumes that track after pausing', async () => {
    const audio = await start()
    expect(audio.src).toContain('/api/musics/first.mp3')
    endTrack(audio)
    // 音源在 ended 回调内就更新，不能等歌名已经改变后仍指向上一首。
    expect(audio.src).toContain('/api/musics/second.mp3')
    await settle()
    expect(screen.getByTestId('track')).toHaveTextContent('第二首')
    expect(audio.paused).toBe(false)
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '暂停' }))
    await settle()
    fireEvent.click(screen.getByRole('button', { name: '播放' }))
    await settle()
    expect(playedSources.at(-1)).toContain('/api/musics/second.mp3')
    expect(playerRef.current!.audioRef.current).toBe(audio)
  })

  it('ignores a late pause event from the previous source after the next track starts', async () => {
    const audio = await start()
    fireEvent.click(screen.getByRole('button', { name: '下一首' }))
    await settle()
    act(() => {
      audio.dispatchEvent(new Event('pause'))
    })
    await settle()
    expect(playerRef.current!.isPlaying).toBe(true)
    expect(audio.paused).toBe(false)
    expect(audio.src).toContain('second.mp3')
  })

  it('checks the real source instead of trusting a stale track marker', async () => {
    const audio = await start()
    audio.dataset.trackSrc = '/api/musics/second.mp3'
    endTrack(audio)
    await settle()
    expect(audio.src).toContain('/api/musics/second.mp3')
    expect(playedSources.at(-1)).toContain('/api/musics/second.mp3')
    expect(screen.getByTestId('track')).toHaveTextContent('第二首')
  })

  it('does not mistake slow next-track loading for a user pause', async () => {
    const audio = await start()
    // 模拟换源后还没缓冲好，play 请求仍在等待。
    vi.mocked(audio.play).mockImplementation(function (this: HTMLMediaElement) {
      return new Promise<void>(() => {})
    })
    endTrack(audio)
    act(() => {
      audio.dispatchEvent(new Event('pause'))
    })
    await settle()
    expect(playerRef.current!.isPlaying).toBe(true)
    expect(playerRef.current!.currentTrack).toBe('/second.mp3')
  })

  it('repeats a one-track playlist without waiting for a track-name state change', async () => {
    useMusicStore.setState({
      availableTracks: [{ path: '/first.mp3', name: '第一首', duration: 10 }],
    })
    const audio = await start()
    const plays = playedSources.length
    audio.currentTime = 10
    endTrack(audio)
    await settle()
    expect(audio.currentTime).toBe(0)
    expect(audio.paused).toBe(false)
    expect(playedSources.length).toBeGreaterThan(plays)
  })

  it('keeps the selected visualizer graph through hidden/visible events on iPhone without Audio Session', async () => {
    vi.stubGlobal('navigator', { userAgent: 'iPhone', platform: 'iPhone', maxTouchPoints: 5 })
    useMusicStore.setState({ audioPlaybackMode: 'visualizer' })
    const createSource = vi.fn(() => ({ connect: vi.fn() }))
    const close = vi.fn()
    class Context {
      state = 'running'
      destination = {}
      createAnalyser = () => ({ connect: vi.fn() })
      createGain = () => ({ connect: vi.fn(), gain: { value: 1 } })
      createMediaElementSource = createSource
      resume = vi.fn(() => Promise.resolve())
      close = close
    }
    vi.stubGlobal('AudioContext', Context)
    const audio = await start()
    const analyser = playerRef.current!.analyserNode
    vi.mocked(audio.load).mockClear()
    vi.mocked(audio.pause).mockClear()
    for (const hidden of [true, false, true, false]) {
      vi.spyOn(document, 'hidden', 'get').mockReturnValue(hidden)
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'))
      })
      await settle()
    }
    expect(playerRef.current!.audioRef.current).toBe(audio)
    expect(playerRef.current!.analyserNode).toBe(analyser)
    expect(audio.load).not.toHaveBeenCalled()
    expect(audio.pause).not.toHaveBeenCalled()
    expect(close).not.toHaveBeenCalled()
    expect(createSource).toHaveBeenCalledTimes(1)
    expect(useMusicStore.getState().audioPlaybackMode).toBe('visualizer')
    endTrack(audio)
    await settle()
    expect(audio.src).toContain('second.mp3')
    expect(audio.paused).toBe(false)
    expect(playerRef.current!.analyserNode).toBe(analyser)
  })
})
