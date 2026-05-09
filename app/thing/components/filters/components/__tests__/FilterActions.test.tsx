import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterActions } from '../FilterActions'

describe('FilterActions', () => {
  it('disables reset button when no active filters', () => {
    render(<FilterActions hasActiveFilters={false} onClearAll={() => {}} />)

    const resetButton = screen.getByRole('button', { name: '重置' })

    expect(resetButton).toBeDisabled()
  })

  it('enables reset button and triggers callback when active filters exist', async () => {
    const user = userEvent.setup()
    const onClearAll = vi.fn()

    render(<FilterActions hasActiveFilters={true} onClearAll={onClearAll} />)

    const resetButton = screen.getByRole('button', { name: '重置' })

    expect(resetButton).toBeEnabled()

    await user.click(resetButton)

    expect(onClearAll).toHaveBeenCalledTimes(1)
  })
})
