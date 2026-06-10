import type { ComponentProps } from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InventoryGrid } from '../InventoryGrid'
import { createItem } from './testUtils'

vi.mock('../GameItemSlot', async () => {
  const { createGameItemSlotMock } = await import('./testComponentMocks')

  return createGameItemSlotMock()
})

type InventoryGridProps = ComponentProps<typeof InventoryGrid>

const createBaseProps = (overrides: Partial<InventoryGridProps> = {}): InventoryGridProps => ({
  displaySlots: [],
  isLoading: false,
  onSelectedItemChange: vi.fn<InventoryGridProps['onSelectedItemChange']>(),
  selectedItemId: null,
  ...overrides,
})

describe('InventoryGrid', () => {
  it('selects and deselects items when clicking slots', async () => {
    const user = userEvent.setup()
    const item = createItem({ id: 11, quantity: 2 })
    const onSelectedItemChange = vi.fn<InventoryGridProps['onSelectedItemChange']>()
    const view = render(
      <InventoryGrid
        displaySlots={[{ item, source: 'inventory' }]}
        isLoading={false}
        onSelectedItemChange={onSelectedItemChange}
        selectedItemId={null}
      />
    )

    await user.click(view.getByRole('button', { name: 'Test Item' }))
    expect(onSelectedItemChange).toHaveBeenCalledWith(item)

    view.rerender(
      <InventoryGrid
        displaySlots={[{ item, source: 'inventory' }]}
        isLoading={false}
        onSelectedItemChange={onSelectedItemChange}
        selectedItemId={item.id}
      />
    )

    await user.click(view.getByRole('button', { name: 'Test Item' }))
    expect(onSelectedItemChange).toHaveBeenCalledWith(null)
  })

  it('marks the selected item slot as selected', () => {
    const item = createItem({ id: 12 })
    const props = createBaseProps({
      displaySlots: [{ item, source: 'inventory' }],
      selectedItemId: item.id,
    })

    const view = render(<InventoryGrid {...props} />)

    expect(view.getByRole('button', { name: 'Test Item' })).toHaveAttribute('data-selected', 'true')
  })
})
