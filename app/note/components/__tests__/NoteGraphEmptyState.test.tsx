import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NoteGraphEmptyState from '../NoteGraphEmptyState'

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

describe('NoteGraphEmptyState', () => {
  it('should render empty state message', () => {
    render(<NoteGraphEmptyState isAdmin={false} themeColors={createThemeColors()} />)

    expect(screen.getByText('图谱为空')).toBeInTheDocument()
  })

  it('should show no data message for non-admin', () => {
    render(<NoteGraphEmptyState isAdmin={false} themeColors={createThemeColors()} />)

    expect(screen.getByText('暂无数据')).toBeInTheDocument()
  })

  it('should show create node message for admin', () => {
    render(<NoteGraphEmptyState isAdmin={true} themeColors={createThemeColors()} />)

    expect(screen.getByText('点击上方的「新建节点」按钮开始创建知识节点')).toBeInTheDocument()
  })

  it('should render with correct theme color', () => {
    const themeColors = createThemeColors()
    const { container } = render(<NoteGraphEmptyState isAdmin={false} themeColors={themeColors} />)

    const element = container.firstChild as HTMLElement
    expect(element).toHaveStyle({ color: themeColors.mutedForeground })
  })

  it('should be centered on the canvas', () => {
    const { container } = render(
      <NoteGraphEmptyState isAdmin={false} themeColors={createThemeColors()} />
    )

    const element = container.firstChild as HTMLElement
    expect(element.style.position).toBe('absolute')
    expect(element.style.top).toBe('50%')
    expect(element.style.left).toBe('50%')
    expect(element.style.transform).toBe('translate(-50%, -50%)')
  })
})
