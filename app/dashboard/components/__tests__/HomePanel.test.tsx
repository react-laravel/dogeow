import { render, screen } from '@testing-library/react'
import { HomePanel } from '../HomePanel'
import { DASHBOARD_HOME_LINKS } from '../../homeLinks'

describe('HomePanel', () => {
  it('renders the configured external link cards', () => {
    render(<HomePanel />)

    expect(screen.getByRole('heading', { name: '首页' })).toBeInTheDocument()

    DASHBOARD_HOME_LINKS.forEach(item => {
      expect(screen.getByText(item.caption)).toBeInTheDocument()

      const link = screen.getByRole('link', { name: `打开 ${item.label}` })
      expect(link).toHaveAttribute('href', item.href)
      expect(link).toHaveAttribute('target', '_blank')
    })
  })
})
