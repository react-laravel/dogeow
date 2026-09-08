'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PageContainer } from '@/components/layout'
import { WordPageHeader } from '../components/WordPageHeader'
import { WordToolsNav } from '../components/WordToolsNav'
import { toast } from 'sonner'
import { translateEnToZh } from '@/app/word/utils/translate'

const VIDEO_WIDTH = 1280
const VIDEO_HEIGHT = 720

export default function WordScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cameraRequest = useRef(0)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [recognizedText, setRecognizedText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [ocrProgress, setOcrProgress] = useState('')

  const startCamera = useCallback(async () => {
    const request = ++cameraRequest.current
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('当前浏览器不支持摄像头')
      setHasCameraPermission(false)
      return
    }
    setIsStartingCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT, facingMode: 'environment' },
      })
      if (request !== cameraRequest.current) {
        stream.getTracks().forEach(track => track.stop())
        return
      }
      streamRef.current?.getTracks().forEach(track => track.stop())
      streamRef.current = stream
      setHasCameraPermission(true)
    } catch {
      if (request !== cameraRequest.current) return
      toast.error('无法访问摄像头，请检查权限')
      setHasCameraPermission(false)
    } finally {
      if (request === cameraRequest.current) setIsStartingCamera(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    cameraRequest.current += 1
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  useEffect(() => {
    // The video mounts only after permission is granted.
    if (hasCameraPermission && videoRef.current) videoRef.current.srcObject = streamRef.current
  }, [hasCameraPermission])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopCamera()
        setHasCameraPermission(null)
        setIsStartingCamera(false)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      stopCamera()
    }
  }, [stopCamera])

  const handleCapture = useCallback(async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth || isCapturing) return

    setIsCapturing(true)
    setOcrProgress('识别中…')
    setRecognizedText('')
    setTranslatedText('')

    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')
      ctx.drawImage(video, 0, 0)

      setOcrProgress('正在识别英文…')
      const Tesseract = (await import('tesseract.js')).default
      const {
        data: { text },
      } = await Tesseract.recognize(canvas.toDataURL('image/jpeg', 0.9), 'eng', {
        logger: (m: { status: string; progress?: number }) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(`识别中 ${Math.round((m.progress ?? 0) * 100)}%`)
          }
        },
      })

      const cleaned = text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
      setRecognizedText(cleaned)

      if (!cleaned) {
        setOcrProgress('')
        toast.info('未识别到文字，请对准英文再拍')
        setIsCapturing(false)
        return
      }

      setOcrProgress('翻译中…')
      const translation = await translateEnToZh(cleaned)
      setTranslatedText(translation)
      setOcrProgress('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '识别或翻译失败')
      setOcrProgress('')
    } finally {
      setIsCapturing(false)
    }
  }, [isCapturing])

  return (
    <PageContainer maxWidth="3xl" className="space-y-6">
      <div className="mb-5 space-y-5">
        <WordPageHeader
          title="拍照识词"
          description="对准英文文字拍照，识别后查看中文翻译。"
          backHref="/word"
        />
        <WordToolsNav />
      </div>

      {/* 摄像头预览 */}
      <Card className="gap-0 rounded-2xl py-0 shadow-none">
        <CardHeader className="p-5 pb-3">
          <span className="text-sm font-medium">实时预览</span>
        </CardHeader>
        <CardContent className="space-y-4 p-5 pt-0">
          {hasCameraPermission === false && (
            <div className="bg-muted/50 flex aspect-video items-center justify-center rounded-lg border border-dashed">
              <div className="text-muted-foreground text-center text-sm">
                <p className="mb-2">无法使用摄像头</p>
                <Button variant="outline" onClick={startCamera} disabled={isStartingCamera}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {isStartingCamera ? '正在打开…' : '重试'}
                </Button>
              </div>
            </div>
          )}
          {hasCameraPermission === true && (
            <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <div className="absolute right-0 bottom-3 left-0 flex justify-center">
                <Button size="lg" onClick={handleCapture} disabled={isCapturing} className="gap-2">
                  {isCapturing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {ocrProgress || '处理中…'}
                    </>
                  ) : (
                    <>
                      <Camera className="h-5 w-5" />
                      拍照识别
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          {hasCameraPermission === null && (
            <div className="bg-muted/50 flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-4 text-center">
              <Camera className="text-muted-foreground size-8" />
              <p className="text-muted-foreground text-sm">打开摄像头，对准清晰的英文文字。</p>
              <Button onClick={startCamera} disabled={isStartingCamera}>
                {isStartingCamera ? '正在打开…' : '打开摄像头'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 识别与翻译结果 */}
      {(recognizedText || translatedText) && (
        <Card className="gap-0 rounded-2xl py-0 shadow-none">
          <CardHeader className="p-5 pb-3">
            <span className="text-sm font-medium">识别与翻译</span>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            {recognizedText && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">识别英文</p>
                <p className="bg-muted/30 rounded-md border p-3 text-sm whitespace-pre-wrap">
                  {recognizedText}
                </p>
              </div>
            )}
            {translatedText && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">中文翻译</p>
                <p className="bg-muted/30 rounded-md border p-3 text-sm whitespace-pre-wrap">
                  {translatedText}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}
