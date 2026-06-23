import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ThingImage from '../ThingImage'

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))

describe('ThingImage', () => {
  it('renders img element with src', () => {
    render(<ThingImage src="http://example.com/img.jpg" alt="Test" width={100} height={100} />)
    const img = screen.getByRole('img', { name: 'Test' })
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('http://example.com/img.jpg')
  })

  it('passes through all props', () => {
    render(
      <ThingImage
        src="http://example.com/img.jpg"
        alt="Test"
        width={200}
        height={100}
        className="custom-class"
      />
    )
    const img = screen.getByRole('img')
    expect(img.className).toContain('custom-class')
  })
})
