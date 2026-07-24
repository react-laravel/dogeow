import { mutate } from 'swr'

/** Invalidate all thing item list caches (any query string). */
export const refreshItemLists = (): Promise<unknown[]> =>
  mutate(key => typeof key === 'string' && key.startsWith('/things/items'))

/** Invalidate thing categories cache. */
export const refreshCategories = (): Promise<unknown> => mutate('/things/categories')
