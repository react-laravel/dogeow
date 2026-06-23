import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NoteGraphLoadingState from '../NoteGraphLoadingState'

const createThemeColors = () => ({
  background: '#ffffff',
  foreground: '#111827',
  card: '#ffffff',
  cardForeground: '#111827',
  mutedForeground: '#64748b',
  border: '#e5e7eb',
  primary: '#2563eb',
  ring: '#60a5fa',
  accent: '#38bdf8',
})

describe('NoteGraphLoadingState', () => {
  it('should render loading text', () => {
    render(<NoteGraphLoadingState themeColors={createThemeColors()} isDark={false} />)

    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('should render with correct positioning', () => {
    const { container } = render(
      <NoteGraphLoadingState themeColors={createThemeColors()} isDark={false} />
    )

    const element = container.firstChild as HTMLElement
    expect(element.style.position).toBe('absolute')
    expect(element.style.top).toBe('50%')
    expect(element.style.left).toBe('50%')
    expect(element.style.transform).toBe('translate(-50%, -50%)')
  })

  it('should apply theme colors', () => {
    const themeColors = createThemeColors()
    const { container } = render(<NoteGraphLoadingState themeColors={themeColors} isDark={false} />)

    const element = container.firstChild as HTMLElement
    expect(element.style.background).toBe('rgb(255, 255, 255)')
    expect(element.style.border).toContain('rgb(229, 231, 235)')
  })

  it('should render with light shadow when isDark is false', () => {
    const { container } = render(
      <NoteGraphLoadingState themeColors={createThemeColors()} isDark={false} />
    )

    const element = container.firstChild as HTMLElement
    expect(element.style.boxShadow).toContain('rgba(0,0,0,0.1)')
  })

  it('should render with dark shadow when isDark is true', () => {
    const { container } = render(
      <NoteGraphLoadingState themeColors={createThemeColors()} isDark={true} />
    )

    const element = container.firstChild as HTMLElement
    expect(element.style.boxShadow).toContain('rgba(0,0,0,0.45)')
  })

  it('should have high z-index', () => {
    const { container } = render(
      <NoteGraphLoadingState themeColors={createThemeColors()} isDark={false} />
    )

    const element = container.firstChild as HTMLElement
    expect(element.style.zIndex).toBe('100')
  })
})
