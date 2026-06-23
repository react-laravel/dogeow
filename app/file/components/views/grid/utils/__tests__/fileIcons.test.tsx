import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FileIcon, FILE_TYPE_ICONS } from '../fileIcons'

// Mock next/image - return a plain img element
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    return <img {...props} data-testid="next-image" />
  },
}))

// Mock getFileStorageUrl
vi.mock('@/app/file/services/api', () => ({
  getFileStorageUrl: (path: string) => `http://localhost:8000/storage/${path}`,
}))

const createFile = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 1,
  name: 'test.txt',
  type: 'default',
  is_folder: false,
  path: '/test/test.txt',
  ...overrides,
})

describe('FILE_TYPE_ICONS', () => {
  it('has all expected file type entries', () => {
    expect(FILE_TYPE_ICONS.pdf).toBeDefined()
    expect(FILE_TYPE_ICONS.document).toBeDefined()
    expect(FILE_TYPE_ICONS.spreadsheet).toBeDefined()
    expect(FILE_TYPE_ICONS.archive).toBeDefined()
    expect(FILE_TYPE_ICONS.audio).toBeDefined()
    expect(FILE_TYPE_ICONS.video).toBeDefined()
    expect(FILE_TYPE_ICONS.default).toBeDefined()
  })

  it('has icon component and color string for each type', () => {
    for (const [type, config] of Object.entries(FILE_TYPE_ICONS)) {
      expect(config.icon).toBeDefined()
      expect(typeof config.color).toBe('string')
      expect(config.color).toMatch(/^text-/)
    }
  })

  it('default icon is gray', () => {
    expect(FILE_TYPE_ICONS.default.color).toBe('text-gray-500')
  })
})

describe('FileIcon', () => {
  it('renders an SVG element for folders', () => {
    const file = createFile({ is_folder: true, name: 'My Folder' })
    render(<FileIcon file={file} />)

    const svg = document.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('renders image with correct src for image files', () => {
    const file = createFile({ type: 'image', path: '/uploads/photo.jpg' })
    render(<FileIcon file={file} />)

    const img = screen.getByTestId('next-image')
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toContain('/uploads/photo.jpg')
    expect(img.getAttribute('src')).toContain('?t=')
    expect(img.getAttribute('alt')).toBe('test.txt')
    expect(img.getAttribute('loading')).toBe('lazy')
  })

  it('renders an icon for unknown file types', () => {
    const file = createFile({ type: 'unknown_type' })
    const { container } = render(<FileIcon file={file} />)

    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('applies gray color class for default type', () => {
    const file = createFile({ type: 'default' })
    const { container } = render(<FileIcon file={file} />)

    const iconEl = container.querySelector('.text-gray-500')
    expect(iconEl).toBeTruthy()
  })

  it('applies red color class for pdf type', () => {
    const file = createFile({ type: 'pdf' })
    const { container } = render(<FileIcon file={file} />)

    const iconEl = container.querySelector('.text-red-500')
    expect(iconEl).toBeTruthy()
  })

  it('applies h-12 w-12 size classes', () => {
    const file = createFile({ type: 'default' })
    const { container } = render(<FileIcon file={file} />)

    const iconEl = container.querySelector('.h-12.w-12')
    expect(iconEl).toBeTruthy()
  })

  it('adds cache-busting timestamp to image src', () => {
    const file = createFile({ type: 'image', path: '/uploads/photo.jpg' })
    render(<FileIcon file={file} />)

    const img = screen.getByTestId('next-image')
    const src = img.getAttribute('src') || ''
    expect(src).toMatch(/\?t=\d+$/)
  })
})
