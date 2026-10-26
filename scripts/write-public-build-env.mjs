import { writeFileSync } from 'node:fs'

// These are the four public build settings previously supplied by A. They are
// deliberately copied as dotenv text, never evaluated by a shell or logged.
const expected = new Set([
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_REVERB_HOST',
  'NEXT_PUBLIC_REVERB_SCHEME',
  'NEXT_PUBLIC_ASSET_BASE_URL',
])
const text = process.env.C_NEXT_PUBLIC_BUILD_ENV
if (!text || Buffer.byteLength(text) > 16384 || /[\0\r]/.test(text)) {
  throw new Error('Configure the approved public build settings in GitHub Secrets.')
}
const found = new Set()
for (const line of text.split('\n')) {
  if (!line.trim() || line.trimStart().startsWith('#')) continue
  const match = /^(NEXT_PUBLIC_[A-Za-z0-9_]+)=(.*)$/.exec(line)
  if (!match || !expected.has(match[1]) || found.has(match[1]) || line.endsWith('\\')) {
    throw new Error('Public build settings must contain each approved assignment exactly once.')
  }
  found.add(match[1])
}
if (found.size !== expected.size) {
  throw new Error('Public build settings are incomplete.')
}
writeFileSync('.env.production.local', text.endsWith('\n') ? text : `${text}\n`, {
  mode: 0o600,
  flag: 'wx',
})
console.log('Wrote four approved public build settings; values are hidden.')
