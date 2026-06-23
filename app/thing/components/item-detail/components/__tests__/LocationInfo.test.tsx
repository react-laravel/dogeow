import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LocationInfo } from '../LocationInfo'

vi.mock('./InfoCard', () => ({
  InfoCard: ({ label, value }: any) => (
    <div data-testid="info-card">
      {label}: {value}
    </div>
  ),
}))

describe('LocationInfo', () => {
  it('shows no location message when no location data', () => {
    render(<LocationInfo item={{ area_id: null, room_id: null, spot_id: null } as any} />)
    expect(screen.getByText('未指定存放位置')).toBeDefined()
  })

  it('renders area, room, and spot info', () => {
    const item = {
      spot: {
        name: 'Spot A',
        room: { name: 'Room A', area: { name: 'Area A' } },
      },
    }
    render(<LocationInfo item={item} />)
    expect(screen.getByText('Area A')).toBeDefined()
    expect(screen.getByText('Room A')).toBeDefined()
    expect(screen.getByText('Spot A')).toBeDefined()
  })

  it('renders only area when room and spot absent', () => {
    const item = {
      spot: null,
      area_id: 1,
      room_id: null,
      spot_id: null,
    }
    render(<LocationInfo item={item} />)
    expect(screen.getByText('未指定存放位置')).toBeDefined()
  })
})
