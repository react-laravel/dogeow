export type GenerateOption = 'improve' | 'fix' | 'shorter' | 'longer' | 'continue' | 'zap'

export type AIProvider = 'ollama' | 'codex'

export type CodexReasoningEffort = 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GenerateRequestBody {
  option: GenerateOption
  command?: string
  text?: string
  messages?: ChatMessage[]
  useChat?: boolean
  model?: string
  provider?: AIProvider
  codexReasoningEffort?: CodexReasoningEffort
  images?: string[]
  imageUrl?: string
}

export interface OllamaResponse {
  response?: string
  message?: {
    role: string
    content: string
  }
  done?: boolean
}
