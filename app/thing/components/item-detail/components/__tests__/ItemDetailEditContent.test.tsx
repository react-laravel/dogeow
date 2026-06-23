import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ItemDetailEditContent } from '../ItemDetailEditContent'

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('../../../ImageUploader', () => ({
  default: ({
    onImagesChange,
    existingImages,
    maxImages,
    removeBgEnabled,
    onRemoveBgChange,
    showRemoveBgToggle,
  }: any) => (
    <div data-testid="image-uploader">
      Images: {existingImages?.length ?? 0}, Max: {maxImages}, Rmbg: {String(removeBgEnabled)}
      <button onClick={() => onImagesChange?.([])}>Clear</button>
    </div>
  ),
}))

vi.mock('../../../ImageUploadHeader', () => ({
  ImageUploadHeader: ({ removeBgEnabled, onRemoveBgChange }: any) => (
    <div data-testid="image-upload-header">
      Rmbg: {String(removeBgEnabled)}
      <button onClick={() => onRemoveBgChange?.(!removeBgEnabled)}>Toggle</button>
    </div>
  ),
}))

vi.mock('../../../forms/components/TagsSection', () => ({
  TagsSection: ({ tags, selectedTags, onToggleTag, onCreateTag }: any) => (
    <div data-testid="tags-section">
      Tags: {tags?.length ?? 0}, Selected: {selectedTags?.length ?? 0}
      <button onClick={onCreateTag}>Create Tag</button>
    </div>
  ),
}))

vi.mock('../../../forms/components/LocationSection', () => ({
  LocationSection: ({
    locationPath,
    selectedLocation,
    onLocationSelect,
    getCurrentValue,
    isCreateMode,
  }: any) => (
    <div data-testid="location-section">
      Path: {locationPath}, Mode: {String(isCreateMode)}
    </div>
  ),
}))

vi.mock('../TimeInfo', () => ({
  TimeInfo: ({ item }: any) => <div data-testid="time-info">TimeInfo for {item?.name}</div>,
}))

vi.mock('../InfoCard', () => ({
  InfoCard: ({ label, value }: any) => (
    <div data-testid="info-card">
      {label}: {String(value)}
    </div>
  ),
}))

describe('ItemDetailEditContent', () => {
  const defaultProps = {
    getCurrentFormValue: vi.fn((field: string) => ''),
    hasDescription: false,
    item: {
      id: 1,
      name: 'Test Item',
      purchase_price: 100,
      purchase_date: '2024-01-01',
    } as any,
    locationPath: 'Area > Room',
    onCreateTag: vi.fn(),
    onImagesChange: vi.fn(),
    onLocationSelect: vi.fn(),
    onRemoveBgChange: vi.fn(),
    onTagsChange: vi.fn(),
    removeBgEnabled: false,
    selectedLocation: undefined,
    selectedTags: [],
    tags: [],
    trimmedDescription: '',
    uploadedImages: [],
  }

  it('renders image uploader', () => {
    render(<ItemDetailEditContent {...defaultProps} />)
    expect(screen.getByTestId('image-uploader')).toBeDefined()
  })

  it('renders tags section', () => {
    render(<ItemDetailEditContent {...defaultProps} />)
    expect(screen.getByTestId('tags-section')).toBeDefined()
  })

  it('renders location section', () => {
    render(<ItemDetailEditContent {...defaultProps} />)
    expect(screen.getByTestId('location-section')).toBeDefined()
  })

  it('renders price info card when purchase_price exists', () => {
    render(<ItemDetailEditContent {...defaultProps} />)
    expect(screen.getByText('价格: ¥100')).toBeDefined()
  })

  it('renders purchase date info card when present', () => {
    render(<ItemDetailEditContent {...defaultProps} />)
    expect(screen.getByText('购买日期: 2024-01-01')).toBeDefined()
  })
})
