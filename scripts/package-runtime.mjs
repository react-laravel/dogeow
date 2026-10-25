import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'

const root = process.cwd()
const output = resolve(root, '.deploy-runtime')
const standalone = resolve(root, '.next/standalone')
if (!existsSync(resolve(standalone, 'server.js'))) {
  throw new Error('Run npm run build with output=standalone before packaging.')
}
rmSync(output, { recursive: true, force: true })
cpSync(standalone, output, { recursive: true, verbatimSymlinks: true })
mkdirSync(resolve(output, '.next'), { recursive: true })
cpSync(resolve(root, '.next/static'), resolve(output, '.next/static'), {
  recursive: true,
  dereference: true,
})
if (existsSync(resolve(root, 'public'))) {
  cpSync(resolve(root, 'public'), resolve(output, 'public'), { recursive: true, dereference: true })
}

// Runtime credentials and mutable knowledge/cache data are configured separately
// on C. Never upload a build machine's environment or Codex authentication.
const forbidden = name =>
  name === '.env' ||
  name.startsWith('.env.') ||
  ['.npmrc', '.codex', 'auth.json', '.knowledge', '.cache', 'logs'].includes(name)
function sanitize(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const target = resolve(dir, entry.name)
    if (forbidden(entry.name)) {
      rmSync(target, { recursive: true, force: true })
      continue
    }
    if (entry.isDirectory()) sanitize(target)
  }
}
sanitize(output)
rmSync(resolve(output, '.next/cache'), { recursive: true, force: true })

// A standalone package must not refer back to A's workspace or node_modules.
function verifyLinks(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const target = resolve(dir, entry.name)
    if (lstatSync(target).isSymbolicLink()) {
      const resolved = realpathSync(target)
      const rel = relative(output, resolved)
      if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)) {
        throw new Error(`Runtime contains an external symlink: ${relative(output, target)}`)
      }
    } else if (entry.isDirectory()) verifyLinks(target)
  }
}
verifyLinks(output)
writeFileSync(
  resolve(output, 'DEPLOYMENT.json'),
  JSON.stringify(
    {
      revision: process.env.GITHUB_SHA || null,
      application: 'dogeow-next',
      entry: 'server.js',
      node: process.version,
    },
    null,
    2
  ) + '\n'
)
console.log('Packaged standalone runtime without environment, credentials or mutable data.')
