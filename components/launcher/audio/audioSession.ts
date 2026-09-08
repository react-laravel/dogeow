type AudioSessionType =
  | 'auto'
  | 'playback'
  | 'ambient'
  | 'transient'
  | 'transient-solo'
  | 'play-and-record'

interface AudioSession {
  type: AudioSessionType
}

function getAudioSession(): AudioSession | undefined {
  if (typeof navigator === 'undefined') return
  return (navigator as Navigator & { audioSession?: AudioSession }).audioSession
}

export function hasPlaybackAudioSession(): boolean {
  try {
    const type = getAudioSession()?.type
    return type === 'playback' || type === 'play-and-record'
  } catch {
    return false
  }
}

/** 在创建有声 AudioContext 前声明音乐播放用途，避免使用默认的 ambient 会话。 */
export function prepareMusicAudioSession(): void {
  try {
    const session = getAudioSession()
    if (session && !hasPlaybackAudioSession()) {
      session.type = 'playback'
    }
  } catch {
    // 不支持或拒绝设置时保留原有兼容路径，不能因此阻止播放。
  }
}
