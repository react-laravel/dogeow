import { format } from 'date-fns'
import type { ApiSubmitItemData, Category, Item } from './types'

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from?: number
  to?: number
}

export interface PaginatedItemsResponse {
  data: Item[]
  meta: PaginationMeta
}

export interface ItemFilters {
  search?: string
  category_id?: number | string
  tag_id?: number
  area_id?: number
  room_id?: number
  spot_id?: number
  is_public?: boolean
  purchase_date?: Date
  expiry_date?: Date
  page?: number
  itemsOnly?: boolean
  include_null_purchase_date?: boolean
  include_null_expiry_date?: boolean
  exclude_null_purchase_date?: boolean
  exclude_null_expiry_date?: boolean
  tags?: string[] | number[] | string
  [key: string]: unknown
}

const FRONTEND_ONLY_FILTERS = [
  'include_null_purchase_date',
  'include_null_expiry_date',
  'exclude_null_purchase_date',
  'exclude_null_expiry_date',
] as const

const SPECIAL_FORM_FIELDS = ['images', 'image_paths', 'image_ids', 'tags'] as const

export function prepareThingItemFormData(
  data: Record<string, unknown> | ApiSubmitItemData
): FormData {
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    if (
      !SPECIAL_FORM_FIELDS.includes(key as (typeof SPECIAL_FORM_FIELDS)[number]) &&
      value != null
    ) {
      formData.append(key, key === 'is_public' ? (value ? '1' : '0') : String(value))
    }
  })

  const dataRecord = data as Record<string, unknown>
  const arrayFields = {
    images: dataRecord.images,
    image_paths: dataRecord.image_paths,
    image_ids: dataRecord.image_ids,
    tags: dataRecord.tags,
  }

  Object.entries(arrayFields).forEach(([fieldName, fieldValue]) => {
    if (!Array.isArray(fieldValue)) return

    fieldValue.forEach((item, index) => {
      const value = fieldName === 'image_ids' || fieldName === 'tags' ? String(item) : item
      formData.append(`${fieldName}[${index}]`, value)
    })
  })

  return formData
}

export function buildThingItemQueryString(params: ItemFilters): string {
  const queryParams = new URLSearchParams()

  Object.entries(filterBackendItemParams(params)).forEach(([key, value]) => {
    if (value == null || value === '') return

    let paramValue: string
    if (value instanceof Date) {
      paramValue = format(value, 'yyyy-MM-dd')
    } else if (Array.isArray(value)) {
      paramValue = value.join(',')
    } else {
      paramValue = String(value)
    }

    if (key === 'page') {
      queryParams.append('page', paramValue)
      return
    }

    const paramKey = key === 'search' ? 'filter[name]' : `filter[${key}]`
    queryParams.append(paramKey, paramValue)
  })

  const queryString = queryParams.toString()
  return queryString ? `?${queryString}` : ''
}

export function filterBackendItemParams(params: ItemFilters): ItemFilters {
  const filtered = { ...params }

  ;['itemsOnly', ...FRONTEND_ONLY_FILTERS].forEach(key => {
    delete filtered[key]
  })

  return filtered
}

export function assertPaginatedItemsResponse(
  value: PaginatedItemsResponse
): PaginatedItemsResponse {
  return value
}

export function assertItem(value: Item): Item {
  return value
}

type RawCategory = Omit<Category, 'id' | 'parent_id' | 'user_id' | 'items_count'> & {
  id: number | string
  parent_id?: number | string | null
  user_id?: number | string
  items_count?: number | string
}

const normalizeRequiredNumber = (value: number | string): number =>
  typeof value === 'number' ? value : Number.parseInt(value, 10)

const normalizeOptionalNumber = (
  value: number | string | null | undefined
): number | null | undefined => {
  if (value == null) {
    return value
  }

  return normalizeRequiredNumber(value)
}

export function normalizeCategory(value: Category | RawCategory): Category {
  const parentId = normalizeOptionalNumber(value.parent_id)
  const userId = normalizeOptionalNumber(value.user_id)
  const itemsCount = normalizeOptionalNumber(value.items_count)

  return {
    ...value,
    id: normalizeRequiredNumber(value.id),
    parent_id: parentId ?? null,
    user_id: userId ?? undefined,
    items_count: itemsCount ?? undefined,
  }
}

export function normalizeCategories(values: Array<Category | RawCategory>): Category[] {
  return values.map(normalizeCategory)
}

export function assertCategory(value: Category | RawCategory): Category {
  return normalizeCategory(value)
}
