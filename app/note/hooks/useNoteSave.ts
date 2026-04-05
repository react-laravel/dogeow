import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'
import { normalizeNote } from '../utils/api'
import type { Note, NoteFormData } from '../types/note'
import { withTransaction } from '@/lib/utils/transaction'
import { idempotencyTracker, generateRequestId } from '@/lib/utils/idempotency'

interface UseNoteSaveOptions {
  noteId?: number
  isEditing: boolean
  draft: boolean
}

export function useNoteSave({ noteId, isEditing, draft }: UseNoteSaveOptions) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  // 保存笔记内容
  const handleSave = useCallback(
    async (title: string, content: string) => {
      if (!title.trim()) {
        toast.error('请输入笔记标题')
        return
      }

      // Idempotency: Generate a unique request ID for this save operation
      const requestId = generateRequestId()
      const endpoint = isEditing && noteId ? `/notes/${noteId}` : '/notes'
      const method = isEditing && noteId ? 'PUT' : 'POST'
      const idempotencyKey = idempotencyTracker.generateKey(endpoint, method, {
        title,
        content,
        is_draft: draft,
      })

      // Check if this exact request is already in flight
      if (idempotencyTracker.isRequestPending(idempotencyKey)) {
        console.log('[Idempotency] Save request already in progress, waiting for result')
        try {
          const existingRequest = idempotencyTracker.getPendingRequest<Note | { note: Note }>(
            idempotencyKey
          )
          if (existingRequest) {
            await existingRequest
            toast.info('保存请求已在处理中')
            return
          }
        } catch {
          // If waiting fails, proceed with new request
        }
        console.warn('[Idempotency] Pending request disappeared, proceeding with new request')
      }

      setIsSaving(true)

      const data = {
        title,
        content,
        is_draft: draft,
      }

      // Use transaction wrapper for proper state management
      const transactionResult = await withTransaction<{ note: Note }>(
        async ctx => {
          try {
            let result: Note | { note: Note }

            if (isEditing && noteId) {
              result = await idempotencyTracker.trackRequest(
                idempotencyKey,
                apiRequest<Note | { note: Note }>(`/notes/${noteId}`, 'PUT', data)
              )
            } else {
              result = await idempotencyTracker.trackRequest(
                idempotencyKey,
                apiRequest<Note | { note: Note }>('/notes', 'POST', data)
              )
            }

            const normalizedNote = normalizeNote<Note>(result)
            if (!normalizedNote) {
              throw new Error('保存笔记失败')
            }

            // Create checkpoint before committing
            ctx.checkpoint({ note: normalizedNote })

            return { note: normalizedNote }
          } catch (error) {
            console.error('保存笔记错误:', error)
            throw error instanceof Error ? error : new Error(String(error))
          }
        },
        {
          onRollback: error => {
            console.warn('[Transaction] Note save rolled back:', error.message)
          },
        }
      )

      if (!transactionResult.success) {
        toast.error('保存失败')
        return Promise.reject(transactionResult.error)
      }

      if (!transactionResult.result) {
        toast.error('保存失败（服务器返回空响应）')
        return Promise.reject(new Error('保存失败（服务器返回空响应）'))
      }

      const normalizedNote = transactionResult.result.note
      toast.success(isEditing ? '笔记已更新' : '笔记已创建')

      if (!isEditing && normalizedNote.id) {
        router.push(`/note/edit/${normalizedNote.id}`)
        router.refresh()
      }

      setIsSaving(false)
      return Promise.resolve()
    },
    [noteId, draft, isEditing, router]
  )

  // 保存为草稿
  const saveDraft = useCallback(
    async (title: string, content: string) => {
      if (!title.trim()) {
        toast.error('请输入笔记标题')
        return
      }

      // Idempotency check
      const idempotencyKey = idempotencyTracker.generateKey(
        isEditing && noteId ? `/notes/${noteId}` : '/notes',
        isEditing && noteId ? 'PUT' : 'POST',
        { title, content, is_draft: true }
      )

      if (idempotencyTracker.isRequestPending(idempotencyKey)) {
        console.log('[Idempotency] Draft save already in progress')
        const pendingRequest = idempotencyTracker.getPendingRequest<Note | { note: Note }>(
          idempotencyKey
        )
        if (pendingRequest) {
          toast.info('保存请求已在处理中')
          return
        }
        console.warn('[Idempotency] Pending request disappeared, proceeding with new request')
      }

      setIsSaving(true)

      const data = {
        title,
        content,
        is_draft: true,
      }

      try {
        if (isEditing && noteId) {
          await idempotencyTracker.trackRequest(
            idempotencyKey,
            apiRequest<Note | { note: Note }>(`/notes/${noteId}`, 'PUT', data)
          )
        } else {
          await idempotencyTracker.trackRequest(
            idempotencyKey,
            apiRequest<Note | { note: Note }>('/notes', 'POST', data)
          )
        }
        toast.success('已保存为草稿')
      } catch (error) {
        console.error('保存草稿失败:', error)
        toast.error('保存草稿失败')
      } finally {
        setIsSaving(false)
      }
    },
    [isEditing, noteId]
  )

  return { isSaving, handleSave, saveDraft }
}
