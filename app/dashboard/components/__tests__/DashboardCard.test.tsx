import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardCard } from '../DashboardCard'
import { Home } from 'lucide-react'

const TestIcon = Home

describe('DashboardCard', () => {
  it('renders title and description', () => {
    render(
      <DashboardCard title="Test Title" description="Test Description" icon={TestIcon}>
        <div>Card Content</div>
      </DashboardCard>
    )

    expect(screen.getByText('Test Title')).toBeTruthy()
    expect(screen.getByText('Test Description')).toBeTruthy()
    expect(screen.getByText('Card Content')).toBeTruthy()
  })

  it('renders the icon component', () => {
    const { container } = render(
      <DashboardCard title="Title" description="Desc" icon={TestIcon}>
        <div>Content</div>
      </DashboardCard>
    )

    // Lucide icons render as SVG
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('applies custom className', () => {
    const { container } = render(
      <DashboardCard title="Title" description="Desc" icon={TestIcon} className="custom-class">
        <div>Content</div>
      </DashboardCard>
    )

    const section = container.querySelector('section')
    expect(section?.className).toContain('custom-class')
  })

  it('renders children content', () => {
    render(
      <DashboardCard title="Title" description="Desc" icon={TestIcon}>
        <button type="button">Action Button</button>
      </DashboardCard>
    )

    expect(screen.getByRole('button', { name: /Action Button/ })).toBeTruthy()
  })

  it('renders without optional className', () => {
    const { container } = render(
      <DashboardCard title="Title" description="Desc" icon={TestIcon}>
        <div>Content</div>
      </DashboardCard>
    )

    const section = container.querySelector('section')
    expect(section).toBeTruthy()
  })
})
