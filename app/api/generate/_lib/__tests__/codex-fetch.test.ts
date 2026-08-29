import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetCodexProxyAgentForTests, resolveCodexProxyUrl } from '../codex-fetch'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
  resetCodexProxyAgentForTests()
  vi.resetModules()
  vi.unstubAllGlobals()
})

describe('resolveCodexProxyUrl', () => {
  it('prefers CODEX_HTTP_PROXY over WEBPUSH_HTTP_PROXY', () => {
    process.env.CODEX_HTTP_PROXY = 'http://codex-proxy:1'
    process.env.WEBPUSH_HTTP_PROXY = 'http://webpush-proxy:1'
    process.env.HTTPS_PROXY = 'http://https-proxy:1'

    expect(resolveCodexProxyUrl()).toBe('http://codex-proxy:1')
  })

  it('falls back to WEBPUSH_HTTP_PROXY for Squid', () => {
    delete process.env.CODEX_HTTP_PROXY
    process.env.WEBPUSH_HTTP_PROXY = 'http://runner_proxy:Sir2026Proxy@127.0.0.1:3129'
    delete process.env.HTTPS_PROXY
    delete process.env.HTTP_PROXY

    expect(resolveCodexProxyUrl()).toBe('http://runner_proxy:Sir2026Proxy@127.0.0.1:3129')
  })

  it('returns undefined when no proxy env is set', () => {
    delete process.env.CODEX_HTTP_PROXY
    delete process.env.WEBPUSH_HTTP_PROXY
    delete process.env.HTTPS_PROXY
    delete process.env.https_proxy
    delete process.env.HTTP_PROXY
    delete process.env.http_proxy

    expect(resolveCodexProxyUrl()).toBeUndefined()
  })
})

describe('codexFetch', () => {
  it('uses global fetch when no proxy is configured', async () => {
    delete process.env.CODEX_HTTP_PROXY
    delete process.env.WEBPUSH_HTTP_PROXY
    delete process.env.HTTPS_PROXY
    delete process.env.https_proxy
    delete process.env.HTTP_PROXY
    delete process.env.http_proxy

    const fetchMock = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const { codexFetch } = await import('../codex-fetch')
    await codexFetch('https://example.com', { method: 'GET' })

    expect(fetchMock).toHaveBeenCalledWith('https://example.com', { method: 'GET' })
  })

  it('surfaces network failures with a clear Chinese message', async () => {
    delete process.env.CODEX_HTTP_PROXY
    delete process.env.WEBPUSH_HTTP_PROXY
    delete process.env.HTTPS_PROXY
    delete process.env.https_proxy
    delete process.env.HTTP_PROXY
    delete process.env.http_proxy

    const fetchMock = vi.fn().mockRejectedValue(new Error('fetch failed'))
    vi.stubGlobal('fetch', fetchMock)

    const { codexFetch } = await import('../codex-fetch')
    await expect(codexFetch('https://chatgpt.com/backend-api/codex/responses')).rejects.toThrow(
      /ChatGPT 网络请求失败/
    )
  })
})
