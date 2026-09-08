import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SuggestionProps } from '@tiptap/suggestion'
import { renderItems, type SuggestionItem } from '../runtime/suggestions'

const mocks = vi.hoisted(() => ({ created: vi.fn(), updated: vi.fn(), destroyed: vi.fn() }))
vi.mock('@tiptap/react', () => ({
  ReactRenderer: class {
    element = document.createElement('div')
    ref = { onKeyDown: () => true }
    constructor(_component: unknown, options: unknown) {
      mocks.created(options)
    }
    updateProps = mocks.updated
    destroy = mocks.destroyed
  },
}))
vi.mock('@floating-ui/dom', () => ({
  computePosition: vi.fn().mockResolvedValue({ x: 8, y: 8 }),
  flip: vi.fn(),
  shift: vi.fn(),
  offset: vi.fn(),
}))

const props = (query: string) =>
  ({
    query,
    editor: { isDestroyed: false, view: { dom: document.createElement('div') } },
    clientRect: () => new DOMRect(0, 0, 1, 1),
  }) as unknown as SuggestionProps<SuggestionItem>
afterEach(() => vi.clearAllMocks())

describe('suggestion menu lifecycle', () => {
  it('defers rendering outside the current React lifecycle and uses the latest query', async () => {
    const menu = renderItems()
    menu.onStart?.(props('h'))
    menu.onUpdate?.(props('heading'))
    expect(mocks.created).not.toHaveBeenCalled()
    await Promise.resolve()
    expect(mocks.created).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ query: 'heading' }) })
    )
    menu.onExit?.(props('heading'))
    await Promise.resolve()
    expect(mocks.destroyed).toHaveBeenCalledOnce()
  })

  it('does not resurrect a menu closed before its scheduled render', async () => {
    const menu = renderItems()
    menu.onStart?.(props('h'))
    menu.onExit?.(props('h'))
    await Promise.resolve()
    expect(mocks.created).not.toHaveBeenCalled()
  })

  it('drops queued updates when the menu closes', async () => {
    const menu = renderItems()
    menu.onStart?.(props('h'))
    await Promise.resolve()
    menu.onUpdate?.(props('heading'))
    menu.onExit?.(props('heading'))
    await Promise.resolve()
    expect(mocks.updated).not.toHaveBeenCalled()
    expect(mocks.destroyed).toHaveBeenCalledOnce()
  })
})
