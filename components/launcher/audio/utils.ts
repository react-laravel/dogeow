import { extractTrackFilename } from '../music/lyrics'

// 构建音频URL
export function buildAudioUrl(track: string, _apiUrl: string) {
  const filename = extractTrackFilename(track)
  if (!filename) {
    return ''
  }

  return `/api/musics/${encodeURIComponent(filename)}`
}
