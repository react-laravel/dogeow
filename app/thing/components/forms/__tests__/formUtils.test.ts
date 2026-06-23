import { describe, expect, it } from 'vitest'
import { transformFormDataForSubmit, transformApiDataToFormData } from '../formUtils'
import type { ItemFormSchemaType } from '../formConstants'

// ─── Factory helpers ───────────────────────────────────────────────────────────

const createFormData = (overrides: Partial<ItemFormSchemaType> = {}): ItemFormSchemaType => ({
  name: '测试物品',
  description: '描述文本',
  quantity: 2,
  status: 'active',
  purchase_date: new Date('2024-01-15'),
  expiry_date: null,
  purchase_price: 499.9,
  category_id: '',
  area_id: '1',
  room_id: '2',
  spot_id: '3',
  is_public: true,
  ...overrides,
})

// ─── transformFormDataForSubmit ───────────────────────────────────────────────

describe('transformFormDataForSubmit', () => {
  it('transforms basic fields correctly', () => {
    const formData = createFormData()
    const result = transformFormDataForSubmit(formData, [], [])

    expect(result.name).toBe('测试物品')
    expect(result.description).toBe('描述文本')
    expect(result.quantity).toBe(2)
    expect(result.status).toBe('active')
    expect(result.is_public).toBe(true)
  })

  it('converts empty category_id to null', () => {
    const formData = createFormData({ category_id: '' })
    const result = transformFormDataForSubmit(formData, [], [])

    expect(result.category_id).toBeNull()
  })

  it('converts category_id "none" to null', () => {
    const formData = createFormData({ category_id: 'none' })
    const result = transformFormDataForSubmit(formData, [], [])

    expect(result.category_id).toBeNull()
  })

  it('converts category_id "0" to null', () => {
    const formData = createFormData({ category_id: '0' })
    const result = transformFormDataForSubmit(formData, [], [])

    expect(result.category_id).toBeNull()
  })

  it('preserves non-empty category_id', () => {
    const formData = createFormData({ category_id: '5' })
    const result = transformFormDataForSubmit(formData, [], [])

    expect(result.category_id).toBe('5')
  })

  it('converts area_id/room_id/spot_id with String() when truthy', () => {
    const formData = createFormData({
      area_id: '10',
      room_id: '20',
      spot_id: '30',
    })
    const result = transformFormDataForSubmit(formData, [], [])

    expect(result.area_id).toBe('10')
    expect(result.room_id).toBe('20')
    expect(result.spot_id).toBe('30')
  })

  it('converts falsy location IDs to empty string', () => {
    const formData = createFormData({
      area_id: '',
      room_id: '',
      spot_id: '',
    })
    const result = transformFormDataForSubmit(formData, [], [])

    expect(result.area_id).toBe('')
    expect(result.room_id).toBe('')
    expect(result.spot_id).toBe('')
  })

  it('maps uploadedImages to image_paths', () => {
    const formData = createFormData()
    const images = [
      { path: '/uploads/img1.jpg', id: 1 },
      { path: '/uploads/img2.jpg', id: 2 },
    ]
    const result = transformFormDataForSubmit(formData, images, [])

    expect(result.image_paths).toEqual(['/uploads/img1.jpg', '/uploads/img2.jpg'])
  })

  it('produces empty image_paths when no uploaded images', () => {
    const formData = createFormData()
    const result = transformFormDataForSubmit(formData, [], [])

    expect(result.image_paths).toEqual([])
  })

  it('converts string tag IDs to numbers when tags are provided', () => {
    const formData = createFormData()
    const result = transformFormDataForSubmit(formData, [], ['1', '2', '3'])

    expect(result.tags).toEqual([1, 2, 3])
  })

  it('omits tags when selectedTags is empty', () => {
    const formData = createFormData()
    const result = transformFormDataForSubmit(formData, [], [])

    expect(result.tags).toBeUndefined()
  })

  it('sets dates to null when null in form', () => {
    const formData = createFormData({
      purchase_date: null,
      expiry_date: null,
    })
    const result = transformFormDataForSubmit(formData, [], [])

    expect(result.purchase_date).toBeNull()
    expect(result.expiry_date).toBeNull()
  })

  it('preserves purchase_price when set', () => {
    const formData = createFormData({ purchase_price: 199.5 })
    const result = transformFormDataForSubmit(formData, [], [])

    expect(result.purchase_price).toBe(199.5)
  })

  it('preserves purchase_price when null', () => {
    const formData = createFormData({ purchase_price: null })
    const result = transformFormDataForSubmit(formData, [], [])

    expect(result.purchase_price).toBeNull()
  })
})

// ─── transformApiDataToFormData ────────────────────────────────────────────────

describe('transformApiDataToFormData', () => {
  it('transforms a complete API response', () => {
    const apiData = {
      name: 'API物品',
      description: 'API描述',
      quantity: 5,
      status: 'inactive',
      purchase_date: '2024-06-01T00:00:00.000Z',
      expiry_date: '2025-06-01T00:00:00.000Z',
      purchase_price: 299.99,
      category_id: '3',
      spot_id: '7',
      spot: {
        room: {
          id: 4,
          area: {
            id: 2,
          },
        },
      },
      is_public: true,
    }

    const result = transformApiDataToFormData(apiData)

    expect(result.name).toBe('API物品')
    expect(result.description).toBe('API描述')
    expect(result.quantity).toBe(5)
    expect(result.status).toBe('inactive')
    expect(result.is_public).toBe(true)
  })

  it('defaults quantity to 1 when missing', () => {
    const apiData = {
      name: 'Test',
      description: '',
      status: 'active',
      purchase_date: null,
      expiry_date: null,
      purchase_price: null,
      category_id: '',
      area_id: '',
      room_id: '',
      spot_id: '',
      is_public: false,
    }

    const result = transformApiDataToFormData(apiData)

    expect(result.quantity).toBe(1)
  })

  it('defaults quantity to 1 when 0 (fallback behavior)', () => {
    // Note: `quantity || 1` means 0 becomes 1 — this documents existing behavior
    const apiData = {
      name: 'Test',
      description: '',
      quantity: 0,
      status: 'active',
      purchase_date: null,
      expiry_date: null,
      purchase_price: null,
      category_id: '',
      area_id: '',
      room_id: '',
      spot_id: '',
      is_public: false,
    }

    const result = transformApiDataToFormData(apiData)

    expect(result.quantity).toBe(1)
  })

  it('defaults status to active when missing', () => {
    const apiData = {
      name: 'Test',
      description: '',
      status: '',
      purchase_date: null,
      expiry_date: null,
      purchase_price: null,
      category_id: '',
      area_id: '',
      room_id: '',
      spot_id: '',
      is_public: false,
    }

    const result = transformApiDataToFormData(apiData)

    expect(result.status).toBe('active')
  })

  it('converts null category_id to empty string', () => {
    const apiData = {
      name: 'Test',
      description: '',
      status: 'active',
      purchase_date: null,
      expiry_date: null,
      purchase_price: null,
      category_id: null,
      area_id: '',
      room_id: '',
      spot_id: '',
      is_public: false,
    }

    const result = transformApiDataToFormData(apiData)

    expect(result.category_id).toBe('')
  })

  it('converts undefined category_id to empty string', () => {
    const apiData = {
      name: 'Test',
      description: '',
      status: 'active',
      purchase_date: null,
      expiry_date: null,
      purchase_price: null,
      area_id: '',
      room_id: '',
      spot_id: '',
      is_public: false,
    }

    const result = transformApiDataToFormData(apiData)

    expect(result.category_id).toBe('')
  })

  it('extracts nested location IDs from spot.room.area', () => {
    const apiData = {
      name: 'Test',
      description: '',
      status: 'active',
      purchase_date: null,
      expiry_date: null,
      purchase_price: null,
      category_id: '',
      spot_id: '7',
      spot: {
        room: {
          id: 4,
          area: {
            id: 2,
          },
        },
      },
      is_public: false,
    }

    const result = transformApiDataToFormData(apiData)

    expect(result.area_id).toBe('2')
    expect(result.room_id).toBe('4')
    expect(result.spot_id).toBe('7')
  })

  it('handles missing intermediate location nodes', () => {
    const apiData = {
      name: 'Test',
      description: '',
      status: 'active',
      purchase_date: null,
      expiry_date: null,
      purchase_price: null,
      category_id: '',
      spot_id: '',
      spot: {},
      is_public: false,
    }

    const result = transformApiDataToFormData(apiData)

    expect(result.area_id).toBe('')
    expect(result.room_id).toBe('')
    expect(result.spot_id).toBe('')
  })

  it('parses date strings to Date objects', () => {
    const apiData = {
      name: 'Test',
      description: '',
      status: 'active',
      purchase_date: '2024-06-15T08:00:00.000Z',
      expiry_date: '2025-06-15T08:00:00.000Z',
      purchase_price: null,
      category_id: '',
      area_id: '',
      room_id: '',
      spot_id: '',
      is_public: false,
    }

    const result = transformApiDataToFormData(apiData)

    expect(result.purchase_date).toBeInstanceOf(Date)
    expect(result.expiry_date).toBeInstanceOf(Date)
  })

  it('keeps null dates as null', () => {
    const apiData = {
      name: 'Test',
      description: '',
      status: 'active',
      purchase_date: null,
      expiry_date: null,
      purchase_price: null,
      category_id: '',
      area_id: '',
      room_id: '',
      spot_id: '',
      is_public: false,
    }

    const result = transformApiDataToFormData(apiData)

    expect(result.purchase_date).toBeNull()
    expect(result.expiry_date).toBeNull()
  })

  it('defaults missing optional fields', () => {
    const apiData = {
      name: '',
      description: '',
      status: '',
      purchase_date: null,
      expiry_date: null,
      purchase_price: null,
      category_id: '',
      area_id: '',
      room_id: '',
      spot_id: '',
      is_public: false,
    }

    const result = transformApiDataToFormData(apiData)

    expect(result.name).toBe('')
    expect(result.description).toBe('')
    expect(result.purchase_price).toBeNull()
    expect(result.is_public).toBe(false)
  })
})
