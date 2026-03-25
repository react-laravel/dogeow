import { extractTrackFilename } from '../music/lyrics'

// 构建音频URL
export function buildAudioUrl(track: string, _apiUrl: string) {
  const filename = extractTrackFilename(track)
  if (!filename) {
    return ''
  }

  return `/api/musics/${encodeURIComponent(filename)}`
}

// 检测是否为移动设备
export function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  )
}
