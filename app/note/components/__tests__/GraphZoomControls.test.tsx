import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GraphZoomControls } from '../GraphZoomControls'

const themeColors = {
  background: '#ffffff',
  foreground: '#111827',
  card: '#ffffff',
  cardForeground: '#111827',
  mutedForeground: '#64748b',
  border: '#e5e7eb',
  primary: '#2563eb',
  ring: '#60a5fa',
  accent: '#38bdf8',
}

describe('GraphZoomControls', () => {
  it('renders always-visible zoom affordances including 适应画布 text', () => {
    render(
      <GraphZoomControls
        themeColors={themeColors}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onFit={vi.fn()}
      />
    )

    expect(screen.getByTestId('graph-zoom-controls')).toBeInTheDocument()
    expect(screen.getByTestId('graph-zoom-hint')).toHaveTextContent('滚轮缩放 · 拖拽平移')
    expect(screen.getByRole('button', { name: '放大图谱' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '缩小图谱' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '适应画布' })).toBeInTheDocument()
    expect(screen.getByText('适应画布')).toBeInTheDocument()
  })

  it('shows dot-placeholder hint when labels are LOD-hidden', () => {
    render(
      <GraphZoomControls
        themeColors={themeColors}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onFit={vi.fn()}
        labelsHidden
      />
    )

    expect(screen.getByTestId('graph-zoom-hint')).toHaveTextContent('点位占位 · 点击放大查看标签')
  })

  it('invokes zoom callbacks', () => {
    const onZoomIn = vi.fn()
    const onZoomOut = vi.fn()
    const onFit = vi.fn()

    render(
      <GraphZoomControls
        themeColors={themeColors}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onFit={onFit}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '放大图谱' }))
    fireEvent.click(screen.getByRole('button', { name: '缩小图谱' }))
    fireEvent.click(screen.getByRole('button', { name: '适应画布' }))

    expect(onZoomIn).toHaveBeenCalledTimes(1)
    expect(onZoomOut).toHaveBeenCalledTimes(1)
    expect(onFit).toHaveBeenCalledTimes(1)
  })
})
