import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimeInfo } from '../TimeInfo'

vi.mock('../../utils/dateUtils', () => ({
  formatDate: (v: any) => v || 'N/A',
  formatDateTime: (v: any) => v || 'N/A',
  calculateDaysDifference: () => 30,
}))

vi.mock('./InfoCard', () => ({
  InfoCard: ({ label, value }: any) => (
    <div data-testid="info-card">
      <span data-label={label}>
        {label}: {value}
      </span>
    </div>
  ),
}))

describe('TimeInfo', () => {
  const item = {
    expiry_date: '2024-12-31',
    created_at: '2024-01-01',
    updated_at: '2024-06-01',
  }

  it('renders expiry date when present', () => {
    render(<TimeInfo item={item} />)
    expect(screen.getByText(/过期日期/)).toBeDefined()
  })

  it('renders creation time', () => {
    render(<TimeInfo item={item} />)
    expect(screen.getByText(/创建时间/)).toBeDefined()
  })

  it('renders update time', () => {
    render(<TimeInfo item={item} />)
    expect(screen.getByText(/更新时间/)).toBeDefined()
  })

  it('does not render expiry date when absent', () => {
    const itemNoExpiry = { ...item, expiry_date: null }
    render(<TimeInfo item={itemNoExpiry} />)
    expect(screen.queryByText(/过期日期/)).toBeNull()
  })
})
