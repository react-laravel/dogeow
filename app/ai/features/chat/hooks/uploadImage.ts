import { uploadFile } from '@/lib/api'

/**
 * Upload a single image to the backend server (Upaiyun) via authenticated API client.
 * Expects `{ success: true, data: { url } }` which unwrapApiPayload reduces to `{ url }`.
 */
export async function uploadImageToServer(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('image', file)

  const result = await uploadFile<{ url: string }>('vision/upload', formData, {
    handleError: false,
  })

  if (!result?.url) {
    throw new Error('图片上传失败')
  }

  return result.url
}
