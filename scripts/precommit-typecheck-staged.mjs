import { spawnSync } from 'node:child_process'
import path from 'node:path'

const cwd = process.cwd()

const resolvePath = filePath => path.resolve(cwd, filePath)

const normalizePath = filePath => path.normalize(filePath)

const run = (command, args) =>
  spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
  })

const gitDiff = run('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'])

if (gitDiff.status !== 0) {
  process.stderr.write(gitDiff.stderr || 'Failed to read staged files.\n')
  process.exit(gitDiff.status ?? 1)
}

const isTestTypeScriptFile = file =>
  /(^|\/)(__tests__\/|.*\.test\.(ts|tsx)|.*\.spec\.(ts|tsx))/.test(file) ||
  /(^|\/)vitest\.setup\.(ts|tsx)$/.test(file) ||
  /(^|\/)vitest\.config\.(ts|mjs)$/.test(file)

const stagedTypeScriptFiles = gitDiff.stdout
  .split('\n')
  .map(file => file.trim())
  .filter(Boolean)
  .filter(file => /\.(ts|tsx|mts|cts)$/.test(file))
  .filter(file => !isTestTypeScriptFile(file))
  .map(file => normalizePath(resolvePath(file)))

if (stagedTypeScriptFiles.length === 0) {
  process.stdout.write('pre-commit type-check: no staged TypeScript files, skipping.\n')
  process.exit(0)
}

const tsc = run('npm', ['exec', '--', 'tsc', '--noEmit', '--pretty', 'false'])

if (tsc.error) {
  process.stderr.write(`Failed to execute TypeScript compiler: ${tsc.error.message}\n`)
  process.exit(1)
}

if (tsc.status === 0) {
  process.exit(0)
}

const output = `${tsc.stdout ?? ''}${tsc.stderr ?? ''}`
const lines = output.split('\n')
const diagnosticStart = /^(.+)\((\d+),(\d+)\): error TS\d+:/

const diagnosticBlocks = []
const globalLines = []
let currentBlock = null

for (const line of lines) {
  const match = line.match(diagnosticStart)

  if (match) {
    if (currentBlock) {
      diagnosticBlocks.push(currentBlock)
    }

    currentBlock = {
      file: normalizePath(resolvePath(match[1])),
      lines: [line],
    }
    continue
  }

  if (currentBlock) {
    currentBlock.lines.push(line)
  } else if (line.trim()) {
    globalLines.push(line)
  }
}

if (currentBlock) {
  diagnosticBlocks.push(currentBlock)
}

const stagedFileSet = new Set(stagedTypeScriptFiles)
const stagedDiagnostics = diagnosticBlocks.filter(block => stagedFileSet.has(block.file))
const unrelatedDiagnostics = diagnosticBlocks.filter(block => !stagedFileSet.has(block.file))

if (stagedDiagnostics.length > 0 || globalLines.length > 0) {
  process.stderr.write('TypeScript errors in staged changes:\n\n')

  if (globalLines.length > 0) {
    process.stderr.write(`${globalLines.join('\n')}\n\n`)
  }

  for (const block of stagedDiagnostics) {
    process.stderr.write(`${block.lines.join('\n')}\n`)
  }

  process.exit(1)
}

const unrelatedFiles = [...new Set(unrelatedDiagnostics.map(block => path.relative(cwd, block.file)))]
process.stdout.write(
  `pre-commit type-check: ignored ${unrelatedDiagnostics.length} unrelated TypeScript error(s) in ${unrelatedFiles.length} file(s).\n`
)

if (unrelatedFiles.length > 0) {
  process.stdout.write(`Ignored files:\n${unrelatedFiles.map(file => `- ${file}`).join('\n')}\n`)
}

process.exit(0)
