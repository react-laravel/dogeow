import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
  vi.resetModules()
  vi.unstubAllGlobals()
})

function makeJwt(expSecondsFromNow: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
      client_id: 'app_test',
      'https://api.openai.com/auth': { chatgpt_account_id: 'acct-from-jwt' },
    })
  ).toString('base64url')
  return `${header}.${payload}.sig`
}

describe('getCodexCredentials', () => {
  it('reads a fresh access token from auth.json', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'codex-auth-'))
    const authPath = join(dir, 'auth.json')
    const accessToken = makeJwt(3600)
    writeFileSync(
      authPath,
      JSON.stringify({
        tokens: {
          access_token: accessToken,
          account_id: 'acct-file',
        },
      })
    )
    process.env.CODEX_AUTH_JSON = authPath

    const { getCodexCredentials } = await import('../codex-auth')
    const credentials = await getCodexCredentials()

    expect(credentials.accessToken).toBe(accessToken)
    expect(credentials.accountId).toBe('acct-file')
    expect(credentials.authPath).toBe(authPath)
  })

  it('refreshes an expired access token', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'codex-auth-'))
    const authPath = join(dir, 'auth.json')
    writeFileSync(
      authPath,
      JSON.stringify({
        tokens: {
          access_token: makeJwt(-120),
          refresh_token: 'refresh-token',
          account_id: 'acct-1',
        },
      })
    )
    process.env.CODEX_AUTH_JSON = authPath
    // Force the non-proxy path so global fetch can be stubbed.
    delete process.env.CODEX_HTTP_PROXY
    delete process.env.WEBPUSH_HTTP_PROXY
    delete process.env.HTTPS_PROXY
    delete process.env.https_proxy
    delete process.env.HTTP_PROXY
    delete process.env.http_proxy

    const nextAccess = makeJwt(3600)
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: nextAccess,
        refresh_token: 'refresh-2',
        id_token: 'id-2',
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { getCodexCredentials } = await import('../codex-auth')
    const credentials = await getCodexCredentials()

    expect(fetchMock).toHaveBeenCalled()
    expect(credentials.accessToken).toBe(nextAccess)
    expect(credentials.accountId).toBe('acct-1')
  })
})
