import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UnifiedBasicInfoForm from '../UnifiedBasicInfoForm'

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
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
      Existing: {existingImages?.length ?? 0}, Max: {maxImages}
    </div>
  ),
}))

vi.mock('../../../ImageUploadHeader', () => ({
  ImageUploadHeader: ({ removeBgEnabled, onRemoveBgChange }: any) => (
    <div data-testid="image-upload-header" />
  ),
}))

vi.mock('../../../CategoryTreeSelect', () => ({
  default: ({ onSelect, selectedCategory }: any) => (
    <div data-testid="category-tree-select">
      <button onClick={() => onSelect('parent', 1)}>Cat</button>
    </div>
  ),
}))

vi.mock('../../../forms/components/TagsSection', () => ({
  TagsSection: ({ tags, selectedTags, onToggleTag, onCreateTag }: any) => (
    <div data-testid="tags-section">TagsSection</div>
  ),
}))

vi.mock('../../../forms/components/LocationSection', () => ({
  LocationSection: ({
    locationPath,
    selectedLocation,
    onLocationSelect,
    getCurrentValue,
    isCreateMode,
  }: any) => <div data-testid="location-section">LocationSection</div>,
}))

vi.mock('../../../forms/components/QuantityDialog', () => ({
  QuantityDialog: ({ open, quantity, onQuantityChange, onConfirm }: any) =>
    open ? (
      <div data-testid="quantity-dialog">
        <span>{quantity}</span>
        <button onClick={() => onQuantityChange?.(5)}>Set 5</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    ) : null,
}))

vi.mock('@/hooks/useRemoveBgPreference', () => ({
  useRemoveBgPreference: () => ({ removeBgEnabled: false, setRemoveBgEnabled: vi.fn() }),
}))

describe('UnifiedBasicInfoForm', () => {
  it('renders in edit mode with formData', () => {
    render(
      <UnifiedBasicInfoForm
        formData={
          {
            name: 'Test',
            category_id: '1',
            description: '',
            quantity: 1,
            status: 'active',
            purchase_date: null,
            expiry_date: null,
            purchase_price: null,
            area_id: '',
            room_id: '',
            spot_id: '',
            is_public: false,
          } as any
        }
        setFormData={vi.fn()}
        tags={[]}
        selectedTags={[]}
        setSelectedTags={vi.fn()}
        setCreateTagDialogOpen={vi.fn()}
        categories={[]}
        uploadedImages={[]}
        setUploadedImages={vi.fn()}
      />
    )
    expect(screen.getByTestId('image-uploader')).toBeDefined()
    expect(screen.getByTestId('tags-section')).toBeDefined()
    expect(screen.getByTestId('location-section')).toBeDefined()
  })
})
