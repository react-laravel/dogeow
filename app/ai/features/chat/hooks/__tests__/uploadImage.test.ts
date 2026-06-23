import { beforeEach, describe, expect, it, vi } from 'vitest'
import { uploadImageToServer } from '../uploadImage'

let mockAuthToken: string | null = null

vi.mock('@/stores/authStore', () => {
  const mockStore = (() => null) as unknown as {
    getState: () => { token: string | null }
  }
  mockStore.getState = () => ({ token: mockAuthToken })
  return { default: mockStore }
})

describe('uploadImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    mockAuthToken = null
  })

  it('uploads image and returns url on success', async () => {
    const url = 'https://example.com/uploaded-image.png'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, url }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const file = new File(['image'], 'test.png', { type: 'image/png' })
    const result = await uploadImageToServer(file)

    expect(result).toBe(url)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [calledUrl, init] = fetchMock.mock.calls[0]
    expect(calledUrl).toBe('http://localhost:8000/api/vision/upload')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)
  })

  it('includes Authorization header when token exists', async () => {
    mockAuthToken = 'test-token'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, url: 'https://example.com/img.png' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const file = new File(['image'], 'test.png', { type: 'image/png' })
    await uploadImageToServer(file)

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer test-token')
  })

  it('does not include Authorization header when no token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, url: 'https://example.com/img.png' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const file = new File(['image'], 'test.png', { type: 'image/png' })
    await uploadImageToServer(file)

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
  })

  it('throws on non-ok response with message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Upload failed' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const file = new File(['image'], 'test.png', { type: 'image/png' })
    await expect(uploadImageToServer(file)).rejects.toThrow('Upload failed')
  })

  it('throws generic message when response json fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })
    vi.stubGlobal('fetch', fetchMock)

    const file = new File(['image'], 'test.png', { type: 'image/png' })
    await expect(uploadImageToServer(file)).rejects.toThrow('图片上传失败')
  })

  it('throws when success is false', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, message: 'Server error' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const file = new File(['image'], 'test.png', { type: 'image/png' })
    await expect(uploadImageToServer(file)).rejects.toThrow('Server error')
  })
})
