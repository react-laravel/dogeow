import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { configs } from '@/app/configs'
import { getBookCoverSrc } from '../registry'

describe('getBookCoverSrc', () => {
  it('keeps catalog covers on the application origin', () => {
    expect(getBookCoverSrc('hongloumeng')).toBe('/images/books/hongloumeng.jpg')
    expect(getBookCoverSrc('hongloumeng')).not.toContain('upyun')
  })

  it('has a local cover file for every catalog book', () => {
    const coversDir = path.resolve(process.cwd(), 'public/images/books')

    for (const book of configs.books) {
      expect(existsSync(path.join(coversDir, `${book.id}.jpg`)), book.id).toBe(true)
    }
  })
})
