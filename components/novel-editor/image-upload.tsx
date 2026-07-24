import { createImageUpload } from 'novel'
import { toast } from 'sonner'
import { uploadImageToServer } from '@/app/ai/features/chat/hooks/uploadImage'

const onUpload = (file: File) => {
  const promise = uploadImageToServer(file)

  return new Promise<string>((resolve, reject) => {
    toast.promise(
      promise.then(url => {
        resolve(url)
        return url
      }),
      {
        loading: '正在上传图片…',
        success: '图片上传成功',
        error: (error: Error) => {
          reject(error)
          return error.message || '图片上传失败，请重试'
        },
      }
    )
  })
}

export const uploadFn = createImageUpload({
  onUpload,
  validateFn: file => {
    if (!file.type.includes('image/')) {
      toast.error('不支持的文件类型')
      return false
    }
    if (file.size / 1024 / 1024 > 20) {
      toast.error('图片过大（最大 20MB）')
      return false
    }
    return true
  },
})
