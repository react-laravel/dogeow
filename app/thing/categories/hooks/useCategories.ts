import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useCategories as useCategoriesSWR } from '@/app/thing/services/api'
import { put, del } from '@/lib/api'
import { refreshCategories as invalidateCategoriesCache } from '@/app/thing/services/swrCache'
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants'

export const useCategories = () => {
  const { data: categories = [], isLoading, mutate } = useCategoriesSWR()
  const [loading, setLoading] = useState(false)

  const updateCategory = useCallback(
    async (id: number, name: string) => {
      if (!name.trim()) {
        toast.error(ERROR_MESSAGES.CATEGORY_NAME_EMPTY)
        return false
      }

      setLoading(true)
      try {
        await put(`${API_ENDPOINTS.CATEGORIES}/${id}`, { name })
        toast.success(SUCCESS_MESSAGES.CATEGORY_UPDATED)
        await mutate()
        void invalidateCategoriesCache()
        return true
      } catch (error) {
        toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.UPDATE_FAILED)
        return false
      } finally {
        setLoading(false)
      }
    },
    [mutate]
  )

  const deleteCategory = useCallback(
    async (id: number) => {
      setLoading(true)
      try {
        await del(`${API_ENDPOINTS.CATEGORIES}/${id}`)
        toast.success(SUCCESS_MESSAGES.CATEGORY_DELETED)
        await mutate()
        void invalidateCategoriesCache()
        return true
      } catch (error) {
        toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.DELETE_FAILED)
        return false
      } finally {
        setLoading(false)
      }
    },
    [mutate]
  )

  const refreshCategories = useCallback(async () => {
    await mutate()
  }, [mutate])

  return {
    categories,
    loading: loading || isLoading,
    updateCategory,
    deleteCategory,
    refreshCategories,
  }
}
