import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { vi } from 'vitest'
import { LayoutRenderer } from '../LayoutRenderer'
import { useUITheme } from '../UIThemeProvider'
import { useBackgroundStore } from '@/stores/backgroundStore'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}))

vi.mock('../UIThemeProvider', () => ({
  useUITheme: vi.fn(() => null),
}))

vi.mock('@/stores/backgroundStore', () => ({
  useBackgroundStore: vi.fn(() => ({ backgroundImage: null })),
}))

vi.mock('@/components/launcher/LazyAppLauncher', () => ({
  LazyAppLauncher: () => <div data-testid="lazy-app-launcher" />,
}))

vi.mock('@/components/display/ScrollButton', () => ({
  ScrollButton: () => <div data-testid="scroll-button" />,
}))

describe('LayoutRenderer', () => {
  it('renders the default shell on regular routes', () => {
    vi.mocked(usePathname).mockReturnValue('/tool')
    vi.mocked(useUITheme).mockReturnValue(null)
    vi.mocked(useBackgroundStore).mockReturnValue({ backgroundImage: null })

    render(
      <LayoutRenderer>
        <div data-testid="content">content</div>
      </LayoutRenderer>
    )

    expect(screen.getByTestId('lazy-app-launcher')).toBeInTheDocument()
    expect(screen.getByTestId('scroll-button')).toBeInTheDocument()
    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(document.getElementById('header-container')).toHaveClass('safe-area-header')
  })

  it('keeps the shell wide and scrollable on the Monopoly game route', () => {
    vi.mocked(usePathname).mockReturnValue('/game/monopoly')
    vi.mocked(useUITheme).mockReturnValue(null)
    vi.mocked(useBackgroundStore).mockReturnValue({ backgroundImage: null })

    render(
      <LayoutRenderer>
        <div data-testid="content">content</div>
      </LayoutRenderer>
    )

    expect(screen.getByTestId('lazy-app-launcher')).toBeInTheDocument()
    expect(document.getElementById('main-container')).toHaveClass('overflow-y-auto')
    expect(screen.getByTestId('content').parentElement).toHaveClass('max-w-none')
  })
})
