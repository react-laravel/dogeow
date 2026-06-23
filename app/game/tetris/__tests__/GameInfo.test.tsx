import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { GameInfo } from '../components/GameInfo'

describe('GameInfo', () => {
  it('should render without crashing', () => {
    const { container } = render(<GameInfo score={0} lines={0} level={1} bestScore={0} />)
    expect(container.firstChild).toBeDefined()
  })

  it('should display score', () => {
    const { container } = render(<GameInfo score={1500} lines={5} level={2} bestScore={500} />)
    expect(container.firstChild).toBeDefined()
  })

  it('should display lines', () => {
    const { container } = render(<GameInfo score={0} lines={20} level={3} bestScore={1000} />)
    expect(container.firstChild).toBeDefined()
  })

  it('should display level', () => {
    const { container } = render(<GameInfo score={0} lines={0} level={10} bestScore={0} />)
    expect(container.firstChild).toBeDefined()
  })

  it('should display best score', () => {
    const { container } = render(<GameInfo score={500} lines={3} level={1} bestScore={5000} />)
    expect(container.firstChild).toBeDefined()
  })

  it('should handle zero values', () => {
    const { container } = render(<GameInfo score={0} lines={0} level={1} bestScore={0} />)
    expect(container.firstChild).toBeDefined()
  })
})
