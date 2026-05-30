export interface AudioPlaybackSnapshot {
  src: string
  trackSrc: string | null
  currentTime: number
  volume: number
  muted: boolean
  wasPlaying: boolean
}

export function capturePlaybackSnapshot(
  audio: HTMLAudioElement,
  wasPlaying: boolean
): AudioPlaybackSnapshot {
  let trackSrc: string | null = null

  try {
    trackSrc = audio.dataset?.trackSrc ?? null
  } catch {
    trackSrc = null
  }

  return {
    src: audio.src,
    trackSrc,
    currentTime: audio.currentTime,
    volume: audio.volume,
    muted: audio.muted,
    wasPlaying,
  }
}

/** 同步写入 src / 音量，避免 remount 后其它 effect 误判为空并 reload。 */
export function applyPlaybackSnapshotSync(
  audio: HTMLAudioElement,
  snapshot: AudioPlaybackSnapshot
): boolean {
  audio.volume = snapshot.volume
  audio.muted = snapshot.muted

  const needsSrcUpdate = Boolean(snapshot.src && audio.src !== snapshot.src)

  if (needsSrcUpdate) {
    audio.src = snapshot.src
    try {
      if (audio.dataset && snapshot.trackSrc) {
        audio.dataset.trackSrc = snapshot.trackSrc
      }
    } catch {
      // ignore
    }
    audio.load()
  }

  return needsSrcUpdate
}

export async function resumePlaybackFromSnapshot(
  audio: HTMLAudioElement,
  snapshot: AudioPlaybackSnapshot,
  needsSrcUpdate: boolean
): Promise<void> {
  const seek = () => {
    if (Number.isFinite(snapshot.currentTime) && snapshot.currentTime >= 0) {
      try {
        audio.currentTime = snapshot.currentTime
      } catch {
        // ignore seek failures before metadata
      }
    }
  }

  if (needsSrcUpdate && audio.readyState < HTMLMediaElement.HAVE_METADATA) {
    await new Promise<void>(resolve => {
      const onReady = () => {
        audio.removeEventListener('loadedmetadata', onReady)
        resolve()
      }
      audio.addEventListener('loadedmetadata', onReady, { once: true })
    })
  }

  seek()

  if (!snapshot.wasPlaying) {
    return
  }

  try {
    await audio.play()
  } catch {
    await new Promise<void>((resolve, reject) => {
      const onCanPlay = () => {
        audio.removeEventListener('canplay', onCanPlay)
        audio
          .play()
          .then(() => resolve())
          .catch(reject)
      }
      audio.addEventListener('canplay', onCanPlay, { once: true })
    })
  }
}

export async function applyPlaybackSnapshot(
  audio: HTMLAudioElement,
  snapshot: AudioPlaybackSnapshot
): Promise<void> {
  const needsSrcUpdate = applyPlaybackSnapshotSync(audio, snapshot)
  await resumePlaybackFromSnapshot(audio, snapshot, needsSrcUpdate)
}
