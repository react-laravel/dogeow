import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CODEX_MODEL,
  formatCodexModelLabel,
  normalizeCodexModel,
  parseCodexModelsResponse,
  resolveCodexModelSelection,
} from '../codex-models'

describe('codex-models', () => {
  it('formats display labels like the ChatGPT picker', () => {
    expect(formatCodexModelLabel('gpt-5.6-luna')).toBe('5.6 Luna')
    expect(formatCodexModelLabel('gpt-5.6-sol', 'GPT-5.6-Sol')).toBe('5.6 Sol')
    expect(formatCodexModelLabel('gpt-5.4-mini')).toBe('5.4 Mini')
  })

  it('filters hidden and non-api models from Codex payload', () => {
    const models = parseCodexModelsResponse({
      models: [
        { slug: 'gpt-5.6-luna', display_name: 'GPT-5.6-Luna', visibility: 'list' },
        { slug: 'gpt-5.6-sol-wm', visibility: 'hide', supported_in_api: false },
        { slug: 'codex-auto-review', visibility: 'hide' },
        { slug: 'gpt-5.6-terra', display_name: 'GPT-5.6-Terra', visibility: 'list' },
      ],
    })

    expect(models.map(item => item.value)).toEqual(['gpt-5.6-luna', 'gpt-5.6-terra'])
    expect(models[0].label).toBe('5.6 Luna')
  })

  it('migrates deprecated spark model and resolves selection against probed list', () => {
    expect(normalizeCodexModel('gpt-5.3-codex-spark')).toBe(DEFAULT_CODEX_MODEL)

    const available = parseCodexModelsResponse({
      models: [
        { slug: 'gpt-5.6-sol', visibility: 'list' },
        { slug: 'gpt-5.6-luna', visibility: 'list' },
      ],
    })

    expect(resolveCodexModelSelection('gpt-5.3-codex-spark', available)).toBe('gpt-5.6-luna')
    expect(resolveCodexModelSelection('gpt-5.6-sol', available)).toBe('gpt-5.6-sol')
  })
})
