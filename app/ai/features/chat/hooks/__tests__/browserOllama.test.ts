import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchBrowserLocalOllamaDebugInfo } from '../browserOllama'

describe('browserOllama debug info', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem('browser_ollama_address')
  })

  it('returns raw, filtered and excluded models for the configured address', async () => {
    localStorage.setItem('browser_ollama_address', '100.104.64.84:11434')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          { name: 'qwen3:0.6b' },
          { name: 'qwen3-embedding:0.6b' },
          { name: 'deepseek-r1:cloud' },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchBrowserLocalOllamaDebugInfo()

    expect(fetchMock).toHaveBeenCalledWith('http://100.104.64.84:11434/api/tags', {
      cache: 'no-store',
    })
    expect(result.rawModels.map(model => model.name)).toEqual([
      'qwen3:0.6b',
      'qwen3-embedding:0.6b',
      'deepseek-r1:cloud',
    ])
    expect(result.chatModels.map(model => model.name)).toEqual(['qwen3:0.6b'])
    expect(result.excludedModels).toEqual([
      { name: 'qwen3-embedding:0.6b', reason: 'embedding 特征模型' },
      { name: 'deepseek-r1:cloud', reason: 'cloud 标签模型' },
    ])
  })
})
