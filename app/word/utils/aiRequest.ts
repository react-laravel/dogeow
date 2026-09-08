import { DEFAULT_CODEX_MODEL } from '@/lib/utils/codex-models'
import {
  getStoredCodexModel,
  getStoredCodexReasoningEffort,
} from '@/app/ai/features/chat/hooks/modelStorage'

export const WORD_AI_DEFAULT_MODEL = DEFAULT_CODEX_MODEL

export function getWordAIRequestConfig() {
  return {
    provider: 'codex' as const,
    model: getStoredCodexModel(WORD_AI_DEFAULT_MODEL),
    codexReasoningEffort: getStoredCodexReasoningEffort(),
  }
}
