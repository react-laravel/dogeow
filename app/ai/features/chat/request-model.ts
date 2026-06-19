export type AIProvider = 'github' | 'minimax' | 'ollama' | 'zhipuai' | 'codex'

export type CodexReasoningEffort = 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'

export function getRequestModel(provider: AIProvider, model: string): string {
  if (provider === 'github' || provider === 'minimax') {
    return ''
  }

  return model
}
