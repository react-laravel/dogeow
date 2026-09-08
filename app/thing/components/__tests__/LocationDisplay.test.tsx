import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LocationDisplay } from '../LocationDisplay'

describe('LocationDisplay', () => {
  it('returns null when spot is undefined', () => {
    const { container } = render(<LocationDisplay />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when spot is null', () => {
    const { container } = render(<LocationDisplay spot={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when no location path parts', () => {
    const { container } = render(<LocationDisplay spot={{ name: '', room: null } as any} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders full location path', () => {
    const spot = {
      id: 1,
      room_id: 1,
      name: 'Spot A',
      room: { id: 1, area_id: 1, name: 'Room A', area: { id: 1, name: 'Area A' } },
    }
    render(<LocationDisplay spot={spot} />)
    expect(screen.getByText('Area A > Room A > Spot A')).toBeDefined()
  })

  it('renders partial path with only area and room', () => {
    const spot = {
      id: 1,
      room_id: 1,
      name: '',
      room: { id: 1, area_id: 1, name: 'Room A', area: { id: 1, name: 'Area A' } },
    }
    render(<LocationDisplay spot={spot} />)
    expect(screen.getByText('Area A > Room A')).toBeDefined()
  })

  it('renders partial path with only area', () => {
    const spot = {
      id: 1,
      room_id: 1,
      name: '',
      room: { id: 1, area_id: 1, name: '', area: { id: 1, name: 'Area A' } },
    }
    render(<LocationDisplay spot={spot} />)
    expect(screen.getByText('Area A')).toBeDefined()
  })
})
