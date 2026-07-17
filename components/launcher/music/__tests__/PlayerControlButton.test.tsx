import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PlayerControlButton } from '../PlayerControlButton'

describe('PlayerControlButton', () => {
  it('uses a consistent click target and accessible action name', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <PlayerControlButton
        onClick={onClick}
        title="下一首"
        icon={<span aria-hidden="true">›</span>}
      />
    )

    const button = screen.getByRole('button', { name: '下一首' })
    expect(button).toHaveClass('h-9', 'w-9')
    expect(button).toHaveAttribute('title', '下一首')

    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('keeps disabled controls non-interactive', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <PlayerControlButton
        onClick={onClick}
        title="上一首"
        icon={<span aria-hidden="true">‹</span>}
        disabled
      />
    )

    const button = screen.getByRole('button', { name: '上一首' })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})
