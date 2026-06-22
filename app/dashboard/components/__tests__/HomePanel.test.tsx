import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { HomePanel } from '../HomePanel'
import type { DashboardHomeLink } from '../../homeLinks'

const dashboardHomeLinks: DashboardHomeLink[] = [
  {
    id: 'mind',
    label: '知识图谱',
    caption: 'mind.dogeow.com',
    href: 'https://mind.dogeow.com/',
    icon: 'network',
    gradientClassName: 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600',
  },
]

vi.mock('swr', () => ({
  default: () => ({ data: dashboardHomeLinks, isLoading: false }),
}))

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

describe('HomePanel', () => {
  it('renders external link cards loaded from the Laravel API', () => {
    render(<HomePanel />)

    dashboardHomeLinks.forEach(item => {
      expect(screen.getByText(item.caption)).toBeInTheDocument()

      const link = screen.getByRole('link', { name: `打开 ${item.label}` })
      expect(link).toHaveAttribute('href', item.href)
      expect(link).toHaveAttribute('target', '_blank')
    })
  })
})
