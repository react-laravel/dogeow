import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DarkModeToggle } from '../DarkModeToggle'

const mockSetTheme = vi.fn()

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: mockSetTheme }),
}))

describe('DarkModeToggle', () => {
  it('renders theme label', () => {
    render(<DarkModeToggle />)
    expect(screen.getByText('主题:')).toBeDefined()
  })

  it('renders light and dark mode buttons', () => {
    render(<DarkModeToggle />)
    expect(screen.getByText('浅色模式')).toBeDefined()
    expect(screen.getByText('深色模式')).toBeDefined()
  })

  it('shows current mode as light', () => {
    render(<DarkModeToggle />)
    expect(screen.getByText(/当前模式: 浅色/)).toBeDefined()
  })

  it('calls setTheme("dark") when dark button clicked', () => {
    render(<DarkModeToggle />)
    const darkBtn = screen.getByText('深色模式').closest('button')
    if (darkBtn) fireEvent.click(darkBtn)
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })
})
