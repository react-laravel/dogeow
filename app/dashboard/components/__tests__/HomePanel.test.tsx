import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { HomePanel } from '../HomePanel'
import { DASHBOARD_HOME_LINKS } from '../../homeLinks'

vi.mock('swr', () => ({
  default: () => ({ data: DASHBOARD_HOME_LINKS, isLoading: false }),
}))

describe('HomePanel', () => {
  it('renders the admin API external link cards', () => {
    render(<HomePanel />)

    DASHBOARD_HOME_LINKS.forEach(item => {
      expect(screen.getByText(item.caption)).toBeInTheDocument()

      const link = screen.getByRole('link', { name: `打开 ${item.label}` })
      expect(link).toHaveAttribute('href', item.href)
      expect(link).toHaveAttribute('target', '_blank')
    })
  })
})
