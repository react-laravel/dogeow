import { describe, expect, it } from 'vitest'
import { getRequestModel } from '../request-model'

describe('getRequestModel', () => {
  it('preserves the model for codex requests', () => {
    expect(getRequestModel('codex', 'gpt-5.4')).toBe('gpt-5.4')
  })

  it('preserves the model for ollama requests', () => {
    expect(getRequestModel('ollama', 'qwen3:0.6b')).toBe('qwen3:0.6b')
  })
})
