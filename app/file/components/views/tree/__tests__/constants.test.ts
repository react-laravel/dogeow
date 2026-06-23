import { describe, expect, it } from 'vitest'
import { TREE_CONSTANTS } from '../constants'

describe('tree constants', () => {
  it('has correct indent size', () => {
    expect(TREE_CONSTANTS.INDENT_SIZE).toBe(8)
  })

  it('has correct base padding', () => {
    expect(TREE_CONSTANTS.BASE_PADDING).toBe(2)
  })

  it('has icon size as Tailwind classes', () => {
    expect(TREE_CONSTANTS.ICON_SIZE).toBe('h-4 w-4')
  })

  it('has preview size with width and height', () => {
    expect(TREE_CONSTANTS.PREVIEW_SIZE.width).toBe(20)
    expect(TREE_CONSTANTS.PREVIEW_SIZE.height).toBe(20)
  })

  it('has tree height as Tailwind class', () => {
    expect(TREE_CONSTANTS.TREE_HEIGHT).toBe('h-[70vh]')
  })
})
