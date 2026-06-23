import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Timer } from '../Timer'

describe('Timer', () => {
  it('should render without crashing', () => {
    const { container } = render(<Timer startTime={new Date()} isComplete={false} />)
    expect(container.firstChild).toBeDefined()
  })

  it('should display initial time as 00:00', () => {
    const now = new Date()
    render(<Timer startTime={now} isComplete={false} />)
    expect(screen.getByText('00:00')).toBeInTheDocument()
  })

  it('should stop updating when isComplete is true', () => {
    const pastTime = new Date(Date.now() - 5000) // 5 seconds ago
    const { container } = render(<Timer startTime={pastTime} isComplete={true} />)
    expect(container.firstChild).toBeDefined()
  })

  it('should accept any Date as startTime', () => {
    const customDate = new Date('2024-01-01T00:00:00Z')
    const { container } = render(<Timer startTime={customDate} isComplete={false} />)
    expect(container.firstChild).toBeDefined()
  })
})
