import {
  getStoredCodexModel,
  getStoredCodexReasoningEffort,
} from '@/app/ai/features/chat/hooks/modelStorage'

export const WORD_AI_DEFAULT_MODEL = 'gpt-5.3-codex-spark'

export function getWordAIRequestConfig() {
  return {
    provider: 'codex' as const,
    model: getStoredCodexModel(WORD_AI_DEFAULT_MODEL),
    codexReasoningEffort: getStoredCodexReasoningEffort(),
  }
}
