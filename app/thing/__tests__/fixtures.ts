import type { Item, ItemFormData } from '../types'

export const createItemFixture = (overrides: Partial<Item> = {}): Item => ({
  id: 1,
  name: '测试物品',
  description: null,
  quantity: 1,
  status: 'active',
  purchase_date: null,
  expiry_date: null,
  purchase_price: null,
  category_id: null,
  area_id: null,
  room_id: null,
  spot_id: null,
  is_public: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  images: [],
  tags: [],
  ...overrides,
})

export const createItemFormFixture = (overrides: Partial<ItemFormData> = {}): ItemFormData => ({
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
  ...overrides,
})
