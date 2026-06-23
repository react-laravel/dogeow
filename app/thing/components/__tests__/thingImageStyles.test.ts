import { describe, expect, it } from 'vitest'
import { THING_IMAGE_FRAME_CLASS, THING_IMAGE_CLASS } from '../thingImageStyles'

describe('thingImageStyles', () => {
  it('THING_IMAGE_FRAME_CLASS contains expected classes', () => {
    expect(THING_IMAGE_FRAME_CLASS).toContain('flex')
    expect(THING_IMAGE_FRAME_CLASS).toContain('items-center')
    expect(THING_IMAGE_FRAME_CLASS).toContain('justify-center')
    expect(THING_IMAGE_FRAME_CLASS).toContain('overflow-hidden')
    expect(THING_IMAGE_FRAME_CLASS).toContain('bg-transparent')
  })

  it('THING_IMAGE_CLASS contains expected classes', () => {
    expect(THING_IMAGE_CLASS).toContain('max-h-full')
    expect(THING_IMAGE_CLASS).toContain('max-w-full')
    expect(THING_IMAGE_CLASS).toContain('bg-transparent')
    expect(THING_IMAGE_CLASS).toContain('object-contain')
    expect(THING_IMAGE_CLASS).toContain('object-center')
  })

  it('both have bg-transparent for transparent background', () => {
    expect(THING_IMAGE_FRAME_CLASS).toContain('bg-transparent')
    expect(THING_IMAGE_CLASS).toContain('bg-transparent')
  })
})
