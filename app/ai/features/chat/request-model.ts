export type AIProvider = 'ollama' | 'codex'

export type CodexReasoningEffort = 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'ultra'

export function getRequestModel(provider: AIProvider, model: string): string {
  return model
}
