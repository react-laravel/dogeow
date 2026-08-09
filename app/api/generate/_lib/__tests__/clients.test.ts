import { describe, expect, it } from 'vitest'
import { buildCodexRequestPayload } from '../clients'

describe('buildCodexRequestPayload', () => {
  it('maps system messages into instructions and keeps recent turns', () => {
    const payload = buildCodexRequestPayload(
      [
        { role: 'system', content: '你是助手' },
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '你好呀' },
        { role: 'user', content: '继续' },
      ],
      'gpt-5.6-luna',
      'low'
    )

    expect(payload.model).toBe('gpt-5.6-luna')
    expect(payload.instructions).toBe('你是助手')
    expect(payload.store).toBe(false)
    expect(payload.stream).toBe(true)
    expect(payload.reasoning).toEqual({ effort: 'low' })
    expect(payload.input).toEqual([
      { role: 'user', content: [{ type: 'input_text', text: '你好' }] },
      { role: 'assistant', content: [{ type: 'output_text', text: '你好呀' }] },
      { role: 'user', content: [{ type: 'input_text', text: '继续' }] },
    ])
  })

  it('maps minimal to none and ultra to max', () => {
    expect(buildCodexRequestPayload([], 'gpt-5.4', 'minimal').reasoning).toEqual({
      effort: 'none',
    })
    expect(buildCodexRequestPayload([], 'gpt-5.4', 'ultra').reasoning).toEqual({
      effort: 'max',
    })
  })

  it('drops previous ChatGPT failure messages from history', () => {
    const payload = buildCodexRequestPayload(
      [
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'ChatGPT 调用失败：timeout' },
        { role: 'user', content: 'retry' },
      ],
      'gpt-5.4-mini'
    )

    expect(payload.input).toEqual([
      { role: 'user', content: [{ type: 'input_text', text: 'hi' }] },
      { role: 'user', content: [{ type: 'input_text', text: 'retry' }] },
    ])
  })
})
