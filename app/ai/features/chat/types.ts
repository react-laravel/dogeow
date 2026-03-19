export const AI_SYSTEM_PROMPT = '你是一个有用的AI助理，请用中文回答问题，必要时给出步骤和示例。'

export interface ChatMessageImage {
  id?: string
  url?: string
  isPlaceholder?: boolean
}

export interface ChatMessageVideo {
  id?: string
  url?: string
  isPlaceholder?: boolean
}

export interface ChatMessageMusic {
  id?: string
  url?: string
  isPlaceholder?: boolean
}

export interface ChatMessage {
  id?: string
  role: 'system' | 'user' | 'assistant'
  content: string
  images?: ChatMessageImage[]
  videos?: ChatMessageVideo[]
  musics?: ChatMessageMusic[]
  audioUrl?: string
  videoUrl?: string
  musicUrl?: string
  /** 显示生成占位符（生成中时为 true，完成后删除该字段） */
  generatingImage?: boolean
  generatingVideo?: boolean
  generatingMusic?: boolean
}
