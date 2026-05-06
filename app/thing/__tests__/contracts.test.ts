import { describe, expect, it } from 'vitest'
import {
  buildThingItemQueryString,
  filterBackendItemParams,
  prepareThingItemFormData,
} from '../contracts'

describe('thing contracts', () => {
  it('builds backend query parameters without frontend-only filters', () => {
    const query = buildThingItemQueryString({
      search: 'keyboard',
      category_id: 3,
      tags: [1, 2],
      page: 4,
      include_null_purchase_date: true,
      itemsOnly: true,
    })

    expect(query).toBe(
      '?filter%5Bname%5D=keyboard&filter%5Bcategory_id%5D=3&filter%5Btags%5D=1%2C2&page=4'
    )
  })

  it('filters frontend-only item params', () => {
    expect(
      filterBackendItemParams({
        search: 'camera',
        itemsOnly: true,
        include_null_expiry_date: true,
      })
    ).toEqual({ search: 'camera' })
  })

  it('serializes item form data for Laravel array fields', () => {
    const formData = prepareThingItemFormData({
      name: 'Camera',
      is_public: true,
      tags: [1, 2],
      image_paths: ['uploads/1/a.jpg'],
    } as Record<string, unknown>)

    expect(formData.get('name')).toBe('Camera')
    expect(formData.get('is_public')).toBe('1')
    expect(formData.get('tags[0]')).toBe('1')
    expect(formData.get('tags[1]')).toBe('2')
    expect(formData.get('image_paths[0]')).toBe('uploads/1/a.jpg')
  })
})
