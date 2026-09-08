import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { put } from '@/lib/api'
import { isCloudFileCacheKey } from '../services/cache'
import { useFormModal } from '@/hooks/useFormModal'
import type { CloudFile } from '../types'

interface UseFileEditReturn {
  open: boolean
  selectedId: number | null
  mode: string
  setOpen: (open: boolean) => void
  setSelectedId: (id: number | null) => void
  openModal: (id: number, mode?: string) => void
  closeModal: () => void
  fileName: string
  fileDescription: string
  setFileName: (name: string) => void
  setFileDescription: (description: string) => void
  updateFile: () => Promise<void>
  isSaving: boolean
  closeEditDialog: () => void
  setEditingFile: (file: CloudFile | null) => void
}

export function useFileEdit(): UseFileEditReturn {
  const { open, selectedId, mode, setOpen, setSelectedId, openModal, closeModal } =
    useFormModal<number>('edit')

  const [fileName, setFileName] = useState('')
  const [fileDescription, setFileDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const savingRef = useRef(false)
  const { mutate } = useSWRConfig()

  const closeEditDialog = useCallback(() => {
    closeModal()
    setSelectedId(null)
    setFileName('')
    setFileDescription('')
  }, [closeModal, setSelectedId])

  const updateFile = useCallback(async () => {
    if (!selectedId || !fileName.trim() || savingRef.current) return
    savingRef.current = true
    setIsSaving(true)
    try {
      await put(
        `/cloud/files/${selectedId}`,
        { name: fileName.trim(), description: fileDescription.trim() },
        { handleError: false }
      )
      void mutate(isCloudFileCacheKey)
      toast.success('更新成功')
      closeEditDialog()
    } catch {
      toast.error('更新失败')
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }, [selectedId, fileName, fileDescription, mutate, closeEditDialog])

  const setEditingFile = useCallback(
    (file: CloudFile | null) => {
      if (file) {
        openModal(file.id)
        setFileName(file.name)
        setFileDescription(file.description || '')
      } else {
        closeEditDialog()
      }
    },
    [openModal, closeEditDialog]
  )

  return {
    open,
    selectedId,
    mode,
    setOpen,
    setSelectedId,
    openModal,
    closeModal,
    fileName,
    fileDescription,
    setFileName,
    setFileDescription,
    updateFile,
    isSaving,
    closeEditDialog,
    setEditingFile,
  }
}
