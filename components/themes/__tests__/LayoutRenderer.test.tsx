import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { LayoutRenderer } from '../LayoutRenderer'

vi.mock('@/components/app/RouteAwareAiLauncher', () => ({
  RouteAwareAiLauncher: () => <div data-testid="app-launcher" />,
}))

vi.mock('@/components/display/ScrollButton', () => ({
  ScrollButton: () => <div data-testid="scroll-button" />,
}))

describe('LayoutRenderer', () => {
  it('renders the default shell on regular routes', () => {
    render(
      <LayoutRenderer>
        <div data-testid="content">content</div>
      </LayoutRenderer>
    )

    expect(screen.getByTestId('app-launcher')).toBeInTheDocument()
    expect(screen.getByTestId('scroll-button')).toBeInTheDocument()
    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(document.getElementById('header-container')).toHaveClass('safe-area-header')
    expect(document.querySelector('[data-theme-layout="unified"]')).toBeInTheDocument()
  })
})
