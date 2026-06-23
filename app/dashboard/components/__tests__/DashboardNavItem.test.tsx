import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardNavItem } from '../DashboardNavItem'
import { Home } from 'lucide-react'

describe('DashboardNavItem', () => {
  it('renders the label text', () => {
    render(<DashboardNavItem icon={Home} label="Dashboard" onSelect={() => {}} />)
    expect(screen.getByText('Dashboard')).toBeTruthy()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(<DashboardNavItem icon={Home} label="Click Me" onSelect={onSelect} />)

    screen.getByText('Click Me').closest('button')?.click()
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('applies active styles when active is true', () => {
    const { container } = render(
      <DashboardNavItem icon={Home} label="Active" active onSelect={() => {}} />
    )

    const button = container.querySelector('button')
    expect(button?.className).toContain('bg-primary/10')
    expect(button?.className).toContain('text-primary')
    expect(button?.className).toContain('font-medium')
  })

  it('applies inactive styles when active is false or undefined', () => {
    const { container } = render(
      <DashboardNavItem icon={Home} label="Inactive" onSelect={() => {}} />
    )

    const button = container.querySelector('button')
    expect(button?.className).toContain('text-muted-foreground')
  })

  it('renders the icon', () => {
    const { container } = render(<DashboardNavItem icon={Home} label="Home" onSelect={() => {}} />)

    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })
})
