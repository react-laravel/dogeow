'use client'

import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { useFilePreview } from './grid/hooks/useFilePreview'
import { logger } from '@/lib/logger'
import { useGridViewActions } from '@/app/file/hooks/useGridViewActions'
import { logger } from '@/lib/logger'
import { useFileEdit } from '@/app/file/hooks/useFileEdit'
import { logger } from '@/lib/logger'
import { useMoveFiles } from '@/app/file/hooks/useFileOperations'
import { logger } from '@/lib/logger'
import { FileGridItem } from './grid/components/FileGridItem'
import { logger } from '@/lib/logger'
import { EditFileDialog } from './grid/components/EditFileDialog'
import { logger } from '@/lib/logger'
import { FilePreviewDialog } from './grid/components/FilePreviewDialog'
import { logger } from '@/lib/logger'
import useFileStore from '@/app/file/store/useFileStore'
import { logger } from '@/lib/logger'
import type { CloudFile } from '@/app/file/types'
import { logger } from '@/lib/logger'

interface GridViewProps {
  files: CloudFile[]
}

export default function GridView({ files }: GridViewProps) {
  const { currentFolderId } = useFileStore()
  const { previewFile, previewType, previewUrl, previewContent, previewItem, closePreview } =
    useFilePreview()
  const { getSWRKey, toggleSelection, handleItemClick, downloadFile, deleteFile } =
    useGridViewActions({ currentFolderId })
  const { moveFiles } = useMoveFiles()
  const {
    selectedId: editingId,
    setEditingFile,
    fileName,
    fileDescription,
    setFileName,
    setFileDescription,
    updateFile,
    closeEditDialog,
  } = useFileEdit()

  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null)

  const handleDragStart = useCallback((file: CloudFile, event: React.DragEvent) => {
    logger.debug('DragStart - file:', file.id, file.name, 'is_folder:', file.is_folder)
    event.dataTransfer.setData('text/plain', file.id.toString())
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDragEnter = useCallback((folderId: number) => {
    setDragOverFolderId(folderId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverFolderId(null)
  }, [])

  const handleDrop = useCallback(
    async (targetFolder: CloudFile, event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      setDragOverFolderId(null)

      const fileId = parseInt(event.dataTransfer.getData('text/plain'), 10)
      logger.debug('Drop event - fileId:', fileId, 'targetFolder:', targetFolder.id)

      if (isNaN(fileId)) {
        logger.debug('Invalid fileId, no action taken')
        return
      }

      // 不能将文件夹移动到自身
      if (fileId === targetFolder.id) {
        logger.debug('Cannot move folder to itself')
        return
      }

      logger.debug('Calling moveFiles with:', fileId, targetFolder.id)
      // 移动文件到目标文件夹
      await moveFiles([fileId], targetFolder.id)
    },
    [moveFiles]
  )

  const handleItemClickWithPreview = (file: CloudFile) => {
    if (file.is_folder) {
      handleItemClick(file)
    } else {
      previewItem(file)
    }
  }

  const handleEdit = (file: CloudFile, event: React.MouseEvent) => {
    event.stopPropagation()
    setEditingFile(file)
  }

  const handleDelete = (file: CloudFile, event: React.MouseEvent) => {
    event.stopPropagation()
    deleteFile(file)
  }

  const handleFileDragOver = useCallback(
    (folderId: number) => (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'move'
      handleDragEnter(folderId)
    },
    [handleDragEnter]
  )

  const handleFileDragLeave = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      // 只有当真正离开文件夹时才重置
      const relatedTarget = event.relatedTarget as HTMLElement
      if (!relatedTarget || !event.currentTarget.contains(relatedTarget)) {
        handleDragLeave()
      }
    },
    [handleDragLeave]
  )

  const handleFileDrop = useCallback(
    (folder: CloudFile) => (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      handleDrop(folder, event)
    },
    [handleDrop]
  )

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {files.map(file => (
          <div
            key={file.id}
            onDragOver={file.is_folder ? handleFileDragOver(file.id) : undefined}
            onDragEnter={file.is_folder ? () => handleDragEnter(file.id) : undefined}
            onDragLeave={file.is_folder ? handleFileDragLeave : undefined}
            onDrop={file.is_folder ? handleFileDrop(file) : undefined}
            className={
              file.is_folder && dragOverFolderId === file.id
                ? 'ring-2 ring-primary ring-offset-2 rounded-lg'
                : ''
            }
          >
            <FileGridItem
              key={file.id}
              file={file}
              isSelected={false}
              onSelect={toggleSelection}
              onClick={handleItemClickWithPreview}
              onDownload={downloadFile}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
            />
          </div>
        ))}
      </div>

      <EditFileDialog
        file={editingId != null ? (files.find(f => f.id === editingId) ?? null) : null}
        fileName={fileName}
        fileDescription={fileDescription}
        onFileNameChange={setFileName}
        onFileDescriptionChange={setFileDescription}
        onSave={updateFile}
        onClose={closeEditDialog}
      />

      <FilePreviewDialog
        file={previewFile}
        previewType={previewType}
        previewUrl={previewUrl}
        previewContent={previewContent}
        onClose={closePreview}
        onDownload={downloadFile}
      />
    </>
  )
}
