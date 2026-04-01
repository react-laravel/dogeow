// Shared configuration for MiniMax native API endpoints (TTS, video, image, music)

export const MINIMAX_API_BASE_URL = process.env.MINIMAX_API_BASE_URL ?? 'https://api.minimaxi.com'

export const MINIMAX_TOKEN_API_KEY = process.env.MINIMAX_TOKEN_API_KEY?.trim() ?? ''

const createMiniMaxHeaders = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  'MM-API-Source': 'DogeOW-WebUI',
})

export const MINIMAX_TOKEN_API_HEADERS = createMiniMaxHeaders(MINIMAX_TOKEN_API_KEY)

export const MINIMAX_TTS_MODEL = process.env.MINIMAX_TTS_MODEL ?? 'speech-2.6-hd'
export const MINIMAX_VIDEO_MODEL = process.env.MINIMAX_VIDEO_MODEL ?? 'MiniMax-Hailuo-2.3'
export const MINIMAX_IMAGE_MODEL = process.env.MINIMAX_IMAGE_MODEL ?? 'image-01'
export const MINIMAX_MUSIC_MODEL = process.env.MINIMAX_MUSIC_MODEL ?? 'music-2.0'

export const MINIMAX_DEFAULT_VOICE_ID = process.env.MINIMAX_VOICE_ID ?? 'female-shaonv'
