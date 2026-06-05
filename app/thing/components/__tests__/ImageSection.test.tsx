import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ImageSection from '../ImageSection'
import { UploadedImage } from '../../types'

// Mock child components
vi.mock('../ImageUploader', () => ({
  default: ({ onImagesChange, existingImages }: any) => (
    <div data-testid="image-uploader">
      <div>Existing images: {existingImages?.length || 0}</div>
      <button onClick={() => onImagesChange([])}>Change Images</button>
    </div>
  ),
}))

vi.mock('../ImageUploadHeader', () => ({
  ImageUploadHeader: () => <div data-testid="image-upload-header">Image Upload Header</div>,
}))

vi.mock('../../hooks/useRemoveBgPreference', () => ({
  useRemoveBgPreference: () => ({
    removeBgEnabled: false,
    setRemoveBgEnabled: vi.fn(),
  }),
}))

describe('ImageSection', () => {
  const mockSetUploadedImages = vi.fn()
  const mockUploadedImages: UploadedImage[] = [
    {
      id: 1,
      path: '/path/to/image1.jpg',
      thumbnail_path: '/path/to/thumb1.jpg',
      url: 'https://example.com/image1.jpg',
      thumbnail_url: 'https://example.com/thumb1.jpg',
      is_primary: true,
    },
  ]

  describe('渲染', () => {
    it('应该渲染图片区域标题和描述', () => {
      render(<ImageSection uploadedImages={[]} setUploadedImages={mockSetUploadedImages} />)

      expect(screen.getByText('图片')).toBeInTheDocument()
      expect(screen.getByText('编辑物品的图片')).toBeInTheDocument()
    })

    it('应该渲染图片上传头部', () => {
      render(<ImageSection uploadedImages={[]} setUploadedImages={mockSetUploadedImages} />)

      expect(screen.getByTestId('image-upload-header')).toBeInTheDocument()
    })

    it('应该渲染 ImageUploader 组件', () => {
      render(
        <ImageSection
          uploadedImages={mockUploadedImages}
          setUploadedImages={mockSetUploadedImages}
        />
      )

      expect(screen.getByTestId('image-uploader')).toBeInTheDocument()
      expect(screen.getByText('Existing images: 1')).toBeInTheDocument()
    })
  })

  describe('交互', () => {
    it('应该传递正确的 props 给 ImageUploader', () => {
      render(
        <ImageSection
          uploadedImages={mockUploadedImages}
          setUploadedImages={mockSetUploadedImages}
        />
      )

      expect(screen.getByText('Existing images: 1')).toBeInTheDocument()
    })
  })
})
