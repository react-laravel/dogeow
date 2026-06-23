import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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
    })
  })

  it('each link has href, target, and aria-label', () => {
    render(<HomePanel />)
    const links = screen.getAllByRole('link')

    links.forEach(link => {
      expect(link.hasAttribute('href')).toBe(true)
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.hasAttribute('aria-label')).toBe(true)
    })
  })

  it('each link has an icon', () => {
    const { container } = render(<HomePanel />)
    const links = container.querySelectorAll('a')

    links.forEach(link => {
      expect(link.querySelector('svg')).toBeTruthy()
    })
  })

  it('renders the ExternalLink icon on each card', () => {
    const { container } = render(<HomePanel />)
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)
  })
})
