import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuantityEditor from '../QuantityEditor'

describe('QuantityEditor', () => {
  it('renders badge with quantity', () => {
    render(<QuantityEditor quantity={5} onQuantityChange={vi.fn()} />)
    expect(screen.getByText('× 5')).toBeDefined()
  })

  it('enters edit mode on click', () => {
    render(<QuantityEditor quantity={5} onQuantityChange={vi.fn()} />)
    fireEvent.click(screen.getByText('× 5'))
    expect(screen.getByDisplayValue('5')).toBeDefined()
  })

  it('calls onQuantityChange on save', () => {
    const onQuantityChange = vi.fn()
    render(<QuantityEditor quantity={5} onQuantityChange={onQuantityChange} />)
    fireEvent.click(screen.getByText('× 5'))
    const input = screen.getByDisplayValue('5')
    fireEvent.change(input, { target: { value: '10' } })
    fireEvent.blur(input)
    expect(onQuantityChange).toHaveBeenCalledWith(10)
  })

  it('cancels edit on Escape', () => {
    const onQuantityChange = vi.fn()
    render(<QuantityEditor quantity={5} onQuantityChange={onQuantityChange} />)
    fireEvent.click(screen.getByText('× 5'))
    const input = screen.getByDisplayValue('5')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.getByText('× 5')).toBeDefined()
  })

  it('saves on Enter', () => {
    const onQuantityChange = vi.fn()
    render(<QuantityEditor quantity={5} onQuantityChange={onQuantityChange} />)
    fireEvent.click(screen.getByText('× 5'))
    const input = screen.getByDisplayValue('5')
    fireEvent.change(input, { target: { value: '8' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onQuantityChange).toHaveBeenCalledWith(8)
  })
})
