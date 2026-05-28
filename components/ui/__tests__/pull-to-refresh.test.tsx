import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PullToRefresh } from '../pull-to-refresh'

describe('PullToRefresh', () => {
  it('下拉超过阈值时触发刷新', async () => {
    const onRefresh = vi.fn(async () => {})
    render(
      <PullToRefresh onRefresh={onRefresh}>
        <div>content</div>
      </PullToRefresh>
    )

    const root = screen.getByTestId('pull-to-refresh-root')

    fireEvent.touchStart(root, { touches: [{ clientY: 0 }] })
    fireEvent.touchMove(root, { touches: [{ clientY: 260 }] })
    fireEvent.touchEnd(root)

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledTimes(1)
    })
  })

  it('页面未到顶部时不触发刷新', async () => {
    const onRefresh = vi.fn(async () => {})
    const originalScrollY = window.scrollY
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true })

    render(
      <PullToRefresh onRefresh={onRefresh}>
        <div>content</div>
      </PullToRefresh>
    )

    const root = screen.getByTestId('pull-to-refresh-root')

    fireEvent.touchStart(root, { touches: [{ clientY: 0 }] })
    fireEvent.touchMove(root, { touches: [{ clientY: 300 }] })
    fireEvent.touchEnd(root)

    await waitFor(() => {
      expect(onRefresh).not.toHaveBeenCalled()
    })

    Object.defineProperty(window, 'scrollY', { value: originalScrollY, configurable: true })
  })
})
