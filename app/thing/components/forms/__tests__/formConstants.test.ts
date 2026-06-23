import { describe, expect, it } from 'vitest'
import { itemFormSchema, defaultFormValues } from '../formConstants'
import { z } from 'zod'

describe('itemFormSchema', () => {
  it('validates a complete valid item', () => {
    const validItem = {
      name: '笔记本电脑',
      description: '工作用笔记本',
      quantity: 2,
      status: 'active',
      purchase_date: new Date('2024-01-15'),
      expiry_date: null,
      purchase_price: 5999,
      category_id: '',
      area_id: '1',
      room_id: '2',
      spot_id: '3',
      is_public: true,
    }

    const result = itemFormSchema.safeParse(validItem)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('笔记本电脑')
      expect(result.data.quantity).toBe(2)
    }
  })

  it('rejects empty name', () => {
    const invalid = {
      name: '',
      description: '',
      quantity: 1,
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

    const result = itemFormSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name'])
      expect(result.error.issues[0].message).toBe('名称不能为空')
    }
  })

  it('rejects quantity of 0', () => {
    const invalid = {
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

    const result = itemFormSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path[0] === 'quantity')).toBe(true)
    }
  })

  it('rejects negative quantity', () => {
    const invalid = {
      name: 'Test',
      description: '',
      quantity: -1,
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

    const result = itemFormSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects decimal quantity', () => {
    const invalid = {
      name: 'Test',
      description: '',
      quantity: 1.5,
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

    const result = itemFormSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('accepts category_id as empty string (unclassified)', () => {
    const valid = {
      name: 'Test',
      description: '',
      quantity: 1,
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

    const result = itemFormSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts purchase_date as Date', () => {
    const valid = {
      name: 'Test',
      description: '',
      quantity: 1,
      status: 'active',
      purchase_date: new Date('2024-01-15'),
      expiry_date: null,
      purchase_price: null,
      category_id: '',
      area_id: '',
      room_id: '',
      spot_id: '',
      is_public: false,
    }

    const result = itemFormSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts purchase_date as null', () => {
    const valid = {
      name: 'Test',
      description: '',
      quantity: 1,
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

    const result = itemFormSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts purchase_price as number', () => {
    const valid = {
      name: 'Test',
      description: '',
      quantity: 1,
      status: 'active',
      purchase_date: null,
      expiry_date: null,
      purchase_price: 99.99,
      category_id: '',
      area_id: '',
      room_id: '',
      spot_id: '',
      is_public: false,
    }

    const result = itemFormSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts purchase_price as null', () => {
    const valid = {
      name: 'Test',
      description: '',
      quantity: 1,
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

    const result = itemFormSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })
})

describe('defaultFormValues', () => {
  it('has the correct shape (note: name is empty string so it intentionally does not pass min(1) validation)', () => {
    // defaultFormValues is the initial empty form state — name is '' on purpose
    // so the validation only triggers after user input. Verify structure instead.
    expect(defaultFormValues.name).toBe('')
    expect(defaultFormValues.quantity).toBe(1)
    expect(defaultFormValues.status).toBe('active')
    expect(defaultFormValues.purchase_date).toBeNull()
    expect(defaultFormValues.expiry_date).toBeNull()
    expect(defaultFormValues.purchase_price).toBeNull()
    expect(defaultFormValues.category_id).toBe('')
    expect(defaultFormValues.area_id).toBe('')
    expect(defaultFormValues.room_id).toBe('')
    expect(defaultFormValues.spot_id).toBe('')
    expect(defaultFormValues.is_public).toBe(false)
  })

  it('has name as empty string', () => {
    expect(defaultFormValues.name).toBe('')
  })

  it('has quantity of 1', () => {
    expect(defaultFormValues.quantity).toBe(1)
  })

  it('has status of active', () => {
    expect(defaultFormValues.status).toBe('active')
  })

  it('has all dates as null', () => {
    expect(defaultFormValues.purchase_date).toBeNull()
    expect(defaultFormValues.expiry_date).toBeNull()
  })

  it('has purchase_price as null', () => {
    expect(defaultFormValues.purchase_price).toBeNull()
  })

  it('has all location IDs as empty string', () => {
    expect(defaultFormValues.category_id).toBe('')
    expect(defaultFormValues.area_id).toBe('')
    expect(defaultFormValues.room_id).toBe('')
    expect(defaultFormValues.spot_id).toBe('')
  })

  it('has is_public as false', () => {
    expect(defaultFormValues.is_public).toBe(false)
  })
})
