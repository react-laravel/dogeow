import { beforeEach, describe, expect, it } from 'vitest'
import { getWordAIRequestConfig, WORD_AI_DEFAULT_MODEL } from '../aiRequest'

describe('getWordAIRequestConfig', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('uses ChatGPT with Codex Spark when no model was selected', () => {
    expect(getWordAIRequestConfig()).toEqual({
      provider: 'codex',
      model: WORD_AI_DEFAULT_MODEL,
      codexReasoningEffort: 'medium',
    })
  })

  it('keeps the Codex model and reasoning effort selected by the user', () => {
    localStorage.setItem('codex_model', 'gpt-5.4')
    localStorage.setItem('codex_reasoning_effort', 'high')

    expect(getWordAIRequestConfig()).toEqual({
      provider: 'codex',
      model: 'gpt-5.4',
      codexReasoningEffort: 'high',
    })
  })
})
