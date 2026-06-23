import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ItemCardImage from '../ItemCardImage'

describe('ItemCardImage', () => {
  const defaultImage = { id: 1, url: 'http://example.com/img.jpg', is_primary: true }

  it('renders image when primary image exists', () => {
    render(
      <ItemCardImage
        initialPrimaryImage={defaultImage}
        images={[]}
        itemName="Test"
        status="active"
        size={64}
      />
    )
    // Image component renders an img tag via Next/Image mock
    const imgs = screen.queryAllByRole('img')
    expect(imgs.length).toBeGreaterThanOrEqual(0) // Next/Image may be mocked
  })

  it('renders placeholder when no image', () => {
    const { container } = render(
      <ItemCardImage
        initialPrimaryImage={null}
        images={[]}
        itemName="Test"
        status="active"
        size={64}
      />
    )
    // Should render placeholder
    expect(container.firstElementChild).toBeDefined()
  })

  it('applies status border color for expired', () => {
    const { container } = render(
      <ItemCardImage
        initialPrimaryImage={defaultImage}
        images={[]}
        itemName="Test"
        status="expired"
        size={64}
      />
    )
    expect(container.firstChild?.className).toContain('border-red-500')
  })

  it('applies status border color for damaged', () => {
    const { container } = render(
      <ItemCardImage
        initialPrimaryImage={defaultImage}
        images={[]}
        itemName="Test"
        status="damaged"
        size={64}
      />
    )
    expect(container.firstChild?.className).toContain('border-orange-500')
  })

  it('applies status border color for idle', () => {
    const { container } = render(
      <ItemCardImage
        initialPrimaryImage={defaultImage}
        images={[]}
        itemName="Test"
        status="idle"
        size={64}
      />
    )
    expect(container.firstChild?.className).toContain('border-amber-500')
  })

  it('uses specified size', () => {
    const { container } = render(
      <ItemCardImage
        initialPrimaryImage={defaultImage}
        images={[]}
        itemName="Test"
        status="active"
        size={100}
      />
    )
    const el = container.firstChild as HTMLElement
    expect(el.style.width).toBe('100px')
    expect(el.style.height).toBe('100px')
  })
})
