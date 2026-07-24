import { beforeEach, describe, expect, it, vi } from 'vitest'

const uploadFile = vi.fn()

vi.mock('@/lib/api', () => ({
  uploadFile: (...args: unknown[]) => uploadFile(...args),
}))

import { uploadImageToServer } from '../uploadImage'

describe('uploadImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploads image and returns url on success', async () => {
    const url = 'https://example.com/uploaded-image.png'
    uploadFile.mockResolvedValue({ url })

    const file = new File(['image'], 'test.png', { type: 'image/png' })
    const result = await uploadImageToServer(file)

    expect(result).toBe(url)
    expect(uploadFile).toHaveBeenCalledTimes(1)
    const [endpoint, body, options] = uploadFile.mock.calls[0]
    expect(endpoint).toBe('vision/upload')
    expect(body).toBeInstanceOf(FormData)
    expect(options).toEqual({ handleError: false })
  })

  it('throws when url missing', async () => {
    uploadFile.mockResolvedValue({})
    const file = new File(['image'], 'test.png', { type: 'image/png' })
    await expect(uploadImageToServer(file)).rejects.toThrow('图片上传失败')
  })

  it('rethrows upload errors', async () => {
    uploadFile.mockRejectedValue(new Error('Upload failed'))
    const file = new File(['image'], 'test.png', { type: 'image/png' })
    await expect(uploadImageToServer(file)).rejects.toThrow('Upload failed')
  })
})
