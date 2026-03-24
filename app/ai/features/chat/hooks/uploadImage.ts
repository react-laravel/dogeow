import { API_URL } from '@/lib/api'
import useAuthStore from '@/stores/authStore'

export interface UploadImageResult {
  success: boolean
  url?: string
  message?: string
}

/**
 * Upload a single image to the backend server (Upaiyun)
 */
export async function uploadImageToServer(file: File): Promise<string> {
  const token = useAuthStore.getState().token
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(\`\${API_URL}/api/vision/upload\`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
    },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || '图片上传失败')
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.message || '图片上传失败')
  }

  return data.url
}
