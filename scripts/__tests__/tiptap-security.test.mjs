import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const root = process.cwd()
const lock = JSON.parse(readFileSync(path.join(root, 'package-lock.json'), 'utf8'))
const copies = Object.keys(lock.packages).filter(name => name.endsWith('node_modules/@tiptap/core'))

describe('installed Tiptap security boundaries', () => {
  it('uses only maintained Tiptap 3 core packages', () => {
    expect(copies.length).toBeGreaterThan(0)
    expect(copies.every(name => lock.packages[name].version.startsWith('3.'))).toBe(true)
  })
  it.each(copies)(
    'blocks inherited executable attributes in %s (ESM and CJS)',
    async packagePath => {
      const base = path.join(root, packagePath, 'dist')
      const esm = await import(/* @vite-ignore */ pathToFileURL(path.join(base, 'index.js')).href)
      const cjs = require(path.join(base, 'index.cjs'))
      for (const { mergeAttributes } of [esm, cjs]) {
        const malicious = JSON.parse('{"__proto__":{"onerror":"alert(1)","src":"invalid:"}}')
        const attributes = mergeAttributes({ class: 'first' }, malicious, {
          class: 'second',
          title: 'safe',
        })
        expect(Object.getPrototypeOf(attributes)).toBe(Object.prototype)
        expect(attributes.onerror).toBeUndefined()
        expect(attributes.src).toBeUndefined()
        const image = document.createElement('img')
        for (const key in attributes) image.setAttribute(key, attributes[key])
        expect(image.hasAttribute('onerror')).toBe(false)
        expect(image.getAttribute('class')).toBe('first second')
        expect(image.getAttribute('title')).toBe('safe')
      }
    }
  )
})
