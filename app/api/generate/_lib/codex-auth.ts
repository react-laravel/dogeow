import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { CODEX_AUTH_URL, CODEX_HOME, CODEX_OAUTH_CLIENT_ID } from './config'
import { codexFetch } from './codex-fetch'

interface CodexTokens {
  id_token?: string
  access_token?: string
  refresh_token?: string
  account_id?: string
}

interface CodexAuthFile {
  auth_mode?: string
  OPENAI_API_KEY?: string | null
  tokens?: CodexTokens
  last_refresh?: string
}

export interface CodexCredentials {
  accessToken: string
  accountId?: string
  authPath: string
}

const REFRESH_SKEW_MS = 60_000

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

function isAccessTokenFresh(accessToken: string): boolean {
  const payload = decodeJwtPayload(accessToken)
  const exp = typeof payload?.exp === 'number' ? payload.exp : null
  if (!exp) return true
  return exp * 1000 - Date.now() > REFRESH_SKEW_MS
}

function extractAccountId(tokens: CodexTokens, accessToken: string): string | undefined {
  if (tokens.account_id?.trim()) return tokens.account_id.trim()

  const payload = decodeJwtPayload(accessToken)
  const authClaim = payload?.['https://api.openai.com/auth']
  if (authClaim && typeof authClaim === 'object') {
    const accountId = (authClaim as Record<string, unknown>).chatgpt_account_id
    if (typeof accountId === 'string' && accountId.trim()) return accountId.trim()
  }

  return undefined
}

function resolveAuthPath(): string {
  const candidates = [
    process.env.CODEX_AUTH_JSON?.trim(),
    join(CODEX_HOME, 'auth.json'),
    join(homedir(), '.codex', 'auth.json'),
  ].filter((value): value is string => Boolean(value))

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }

  return candidates[0] ?? join(homedir(), '.codex', 'auth.json')
}

function readAuthFile(authPath: string): CodexAuthFile {
  if (!existsSync(authPath)) {
    throw new Error(
      `未找到 Codex 登录凭据（${authPath}）。请执行 codex login --device-auth 完成设备登录。`
    )
  }

  try {
    return JSON.parse(readFileSync(authPath, 'utf8')) as CodexAuthFile
  } catch {
    throw new Error(
      `无法解析 Codex 登录凭据（${authPath}）。请重新执行 codex login --device-auth。`
    )
  }
}

function writeAuthFile(authPath: string, auth: CodexAuthFile): void {
  writeFileSync(authPath, `${JSON.stringify(auth, null, 2)}\n`, 'utf8')
}

async function refreshTokens(authPath: string, auth: CodexAuthFile): Promise<CodexAuthFile> {
  const refreshToken = auth.tokens?.refresh_token?.trim()
  if (!refreshToken) {
    throw new Error('Codex 登录已过期且缺少 refresh_token，请重新执行 codex login --device-auth。')
  }

  const body = new URLSearchParams({
    client_id: CODEX_OAUTH_CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const response = await codexFetch(CODEX_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `刷新 Codex 登录失败（${response.status}）${detail ? `：${detail.slice(0, 300)}` : ''}。请重新执行 codex login --device-auth，并检查出站代理。`
    )
  }

  const data = (await response.json()) as {
    access_token?: string
    refresh_token?: string
    id_token?: string
  }

  if (!data.access_token) {
    throw new Error(
      '刷新 Codex 登录失败：响应缺少 access_token。请重新执行 codex login --device-auth。'
    )
  }

  const nextAuth: CodexAuthFile = {
    ...auth,
    tokens: {
      ...auth.tokens,
      access_token: data.access_token,
      refresh_token: data.refresh_token || auth.tokens?.refresh_token,
      id_token: data.id_token || auth.tokens?.id_token,
      account_id: auth.tokens?.account_id || extractAccountId(auth.tokens ?? {}, data.access_token),
    },
    last_refresh: new Date().toISOString(),
  }

  try {
    writeAuthFile(authPath, nextAuth)
  } catch (error) {
    console.warn('[Codex Auth] 无法写回刷新后的凭据:', error)
  }

  return nextAuth
}

export async function getCodexCredentials(): Promise<CodexCredentials> {
  const authPath = resolveAuthPath()
  let auth = readAuthFile(authPath)
  let accessToken = auth.tokens?.access_token?.trim()

  if (!accessToken && auth.OPENAI_API_KEY?.trim()) {
    return {
      accessToken: auth.OPENAI_API_KEY.trim(),
      accountId: auth.tokens?.account_id,
      authPath,
    }
  }

  if (!accessToken) {
    throw new Error(
      `Codex 登录凭据无效（${authPath}）。请执行 codex login --device-auth 完成设备登录。`
    )
  }

  if (!isAccessTokenFresh(accessToken)) {
    auth = await refreshTokens(authPath, auth)
    accessToken = auth.tokens?.access_token?.trim()
    if (!accessToken) {
      throw new Error(
        '刷新 Codex 登录后仍缺少 access_token，请重新执行 codex login --device-auth。'
      )
    }
  }

  return {
    accessToken,
    accountId: extractAccountId(auth.tokens ?? {}, accessToken),
    authPath,
  }
}
