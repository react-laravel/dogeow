import { create } from 'zustand'
import { apiRequest } from '@/lib/api'
import { Item, Category, Tag, ItemFormData, ApiSubmitItemData } from '@/app/thing/types'
import { distributedLock } from '@/lib/utils/distributed-lock'
import { idempotencyTracker } from '@/lib/utils/idempotency'
import {
  assertCategory,
  assertItem,
  assertPaginatedItemsResponse,
  buildThingItemQueryString,
  normalizeCategories,
  type ItemFilters,
  type PaginatedItemsResponse,
  type PaginationMeta,
  prepareThingItemFormData,
} from '@/app/thing/contracts'
import { refreshCategories, refreshItemLists } from '@/app/thing/services/swrCache'

// 统一错误处理
const handleError = (error: unknown, defaultMessage = '未知错误'): string => {
  const message = error instanceof Error ? error.message : defaultMessage
  console.error('ItemStore 错误:', error)
  return message
}

interface ItemState {
  items: Item[]
  categories: Category[]
  tags: Tag[]
  loading: boolean
  error: string | null
  meta: PaginationMeta | null
  filters: ItemFilters

  fetchItems: (params?: ItemFilters) => Promise<{ data: Item[]; meta: PaginationMeta } | undefined>
  fetchCategories: () => Promise<Category[] | undefined>
  fetchTags: () => Promise<Tag[] | undefined>
  createCategory: (data: { name: string; parent_id?: number | null }) => Promise<Category>
  getItem: (id: number) => Promise<Item | null>
  createItem: (data: ApiSubmitItemData) => Promise<Item>
  updateItem: (id: number, data: ItemFormData) => Promise<Item>
  deleteItem: (id: number) => Promise<void>
  saveFilters: (filters: ItemFilters) => void
  clearError: () => void
}

export const useItemStore = create<ItemState>((set, get) => ({
  items: [],
  categories: [],
  tags: [],
  loading: false,
  error: null,
  meta: null,
  filters: {},

  fetchItems: async (params = {}) => {
    const state = get()

    // 防止重复请求
    if (state.loading) {
      return
    }

    set({ loading: true, error: null })

    try {
      // 如果没有传入参数，尝试从持久化 store 获取筛选条件
      let finalParams = params
      if (Object.keys(params).length === 0) {
        // 尝试从 localStorage 获取持久化的筛选条件
        try {
          const persistedFilters = localStorage.getItem('thing-filters-persistence')
          if (persistedFilters) {
            const parsed = JSON.parse(persistedFilters)
            if (parsed.state && parsed.state.savedFilters) {
              finalParams = parsed.state.savedFilters
            }
          }
        } catch (error) {
          console.warn('读取持久化筛选条件失败:', error)
        }

        // 如果持久化筛选条件为空，使用 store 中的筛选条件
        if (Object.keys(finalParams).length === 0) {
          finalParams = state.filters
        }
      }

      const url = `/things/items${buildThingItemQueryString(finalParams)}`
      const data = assertPaginatedItemsResponse(await apiRequest<PaginatedItemsResponse>(url))

      set({
        items: data.data ?? [],
        loading: false,
        meta: data.meta ?? null,
      })

      return data
    } catch (error) {
      const errorMessage = handleError(error, '获取物品列表失败')
      set({ loading: false, error: errorMessage })
    }
  },

  fetchCategories: async () => {
    try {
      const data = normalizeCategories(await apiRequest<Category[]>('/things/categories'))
      set({ categories: data })
      return data
    } catch (error) {
      handleError(error, '获取分类失败')
      return undefined
    }
  },

  fetchTags: async () => {
    try {
      const data = await apiRequest<Tag[]>('/things/tags')
      set({ tags: data })
      return data
    } catch (error) {
      handleError(error, '获取标签失败')
      return undefined
    }
  },

  createCategory: async data => {
    try {
      const category = assertCategory(
        await apiRequest<Category>('/things/categories', 'POST', data)
      )

      // 刷新分类列表（store + SWR）
      await get().fetchCategories()
      void refreshCategories()

      return category
    } catch (error) {
      const errorMessage = handleError(error, '创建分类失败')
      throw new Error(errorMessage)
    }
  },

  getItem: async id => {
    set({ loading: true, error: null })

    try {
      const item = assertItem(await apiRequest<Item>(`/things/items/${id}`))
      set({ loading: false })
      return item
    } catch (error) {
      const errorMessage = handleError(error, '获取物品详情失败')
      set({ loading: false, error: errorMessage })
      return null
    }
  },

  createItem: async data => {
    set({ loading: true, error: null })

    // Generate idempotency key for this create operation
    const idempotencyKey = idempotencyTracker.generateKey('/things/items', 'POST', data)

    // Use distributed lock to prevent concurrent creates of the same item
    const itemName = (data.name as string) || 'unnamed'
    const lockResource = `thing:item:create:${itemName}`

    const lockResult = await distributedLock.withLock(
      lockResource,
      async () => {
        // Check if request already in flight - wait for it to complete
        if (idempotencyTracker.isRequestPending(idempotencyKey)) {
          console.log('[Idempotency] Create item request already in progress, waiting for result')
          const pendingRequest = idempotencyTracker.getPendingRequest<Item>(idempotencyKey)
          if (pendingRequest) {
            return pendingRequest
          }
          // Fall through to make a new request if pending somehow disappeared
          console.warn('[Idempotency] Pending request disappeared, proceeding with new request')
        }

        const formData = prepareThingItemFormData(data)
        return idempotencyTracker.trackRequest(
          idempotencyKey,
          apiRequest<Item>('/things/items', 'POST', formData)
        )
      },
      { ttl: 10000, maxRetries: 3 }
    )

    if (!lockResult.success) {
      const errorMessage = handleError(lockResult.error, '创建物品失败（操作被锁定）')
      set({ loading: false, error: errorMessage })
      throw lockResult.error
    }

    // Guard against null result from lock
    if (!lockResult.result) {
      const errorMessage = '创建物品失败（服务器返回空响应）'
      set({ loading: false, error: errorMessage })
      throw new Error(errorMessage)
    }

    try {
      const item = assertItem(await lockResult.result)
      set({ loading: false })
      void refreshItemLists()

      return item
    } catch (error) {
      const errorMessage = handleError(error, '创建物品失败')
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  updateItem: async (id, data) => {
    set({ loading: true, error: null })

    // Generate idempotency key for this update operation
    const idempotencyKey = idempotencyTracker.generateKey(`/things/items/${id}`, 'PUT', data)

    // Use distributed lock to prevent concurrent updates to the same item
    const lockResource = `thing:item:update:${id}`

    const lockResult = await distributedLock.withLock(
      lockResource,
      async () => {
        // Check if request already in flight - wait for it to complete
        if (idempotencyTracker.isRequestPending(idempotencyKey)) {
          console.log('[Idempotency] Update item request already in progress, waiting for result')
          const pendingRequest = idempotencyTracker.getPendingRequest<Item>(idempotencyKey)
          if (pendingRequest) {
            return pendingRequest
          }
          // Fall through to make a new request if pending somehow disappeared
          console.warn('[Idempotency] Pending request disappeared, proceeding with new request')
        }

        const formData = prepareThingItemFormData(data)
        formData.append('_method', 'PUT')
        return idempotencyTracker.trackRequest(
          idempotencyKey,
          apiRequest<Item>(`/things/items/${id}`, 'POST', formData)
        )
      },
      { ttl: 10000, maxRetries: 3 }
    )

    if (!lockResult.success) {
      const errorMessage = handleError(lockResult.error, '更新物品失败（操作被锁定）')
      set({ loading: false, error: errorMessage })
      throw lockResult.error
    }

    // Guard against null result from lock
    if (!lockResult.result) {
      const errorMessage = '更新物品失败（服务器返回空响应）'
      set({ loading: false, error: errorMessage })
      throw new Error(errorMessage)
    }

    try {
      const item = assertItem(await lockResult.result)
      set({ loading: false })
      void refreshItemLists()

      return item
    } catch (error) {
      const errorMessage = handleError(error, '更新物品失败')
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  deleteItem: async (id: number) => {
    set({ loading: true, error: null })

    // Use distributed lock to prevent concurrent deletes of the same item
    const lockResource = `thing:item:delete:${id}`

    const lockResult = await distributedLock.withLock(
      lockResource,
      async () => {
        await apiRequest(`/things/items/${id}`, 'DELETE')
        return true
      },
      { ttl: 5000, maxRetries: 3 }
    )

    if (!lockResult.success) {
      const errorMessage = handleError(lockResult.error, '删除物品失败（操作被锁定）')
      set({ loading: false, error: errorMessage })
      throw lockResult.error
    }

    try {
      set(state => ({
        items: state.items.filter(item => item.id !== id),
        loading: false,
      }))
      void refreshItemLists()
    } catch (error) {
      const errorMessage = handleError(error, '删除物品失败')
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  saveFilters: filters => {
    set({ filters })
  },

  clearError: () => {
    set({ error: null })
  },
}))
