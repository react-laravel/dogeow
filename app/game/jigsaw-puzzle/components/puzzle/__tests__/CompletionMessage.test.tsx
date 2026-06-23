import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { CompletionMessage } from '../CompletionMessage'

describe('CompletionMessage', () => {
  it('should render without crashing', () => {
    const onReset = vi.fn()
    const { container } = render(
      <CompletionMessage startTime={new Date()} bestTime={0} onReset={onReset} />
    )
    expect(container).toBeTruthy()
  })

  it('should show congratulations message', () => {
    const onReset = vi.fn()
    const { container } = render(
      <CompletionMessage startTime={new Date(Date.now() - 60000)} bestTime={0} onReset={onReset} />
    )
    expect(container.textContent).toContain('恭喜完成')
  })

  it('should show completion time', () => {
    const onReset = vi.fn()
    const startTime = new Date(Date.now() - 65000)
    const { container } = render(
      <CompletionMessage startTime={startTime} bestTime={0} onReset={onReset} />
    )
    expect(container.textContent).toContain('秒')
  })

  it('should show new record when bestTime matches completion', () => {
    const onReset = vi.fn()
    const startTime = new Date(Date.now() - 120000)
    const { container } = render(
      <CompletionMessage startTime={startTime} bestTime={120} onReset={onReset} />
    )
    expect(container.textContent).toContain('新的最佳时间')
  })

  it('should not show new record when bestTime is 0', () => {
    const onReset = vi.fn()
    const { container } = render(
      <CompletionMessage startTime={new Date()} bestTime={0} onReset={onReset} />
    )
    expect(container.textContent).not.toContain('新的最佳时间')
  })

  it('should not show new record when bestTime does not match', () => {
    const onReset = vi.fn()
    const { container } = render(
      <CompletionMessage startTime={new Date(Date.now() - 60000)} bestTime={90} onReset={onReset} />
    )
    expect(container.textContent).not.toContain('新的最佳时间')
  })

  it('should have reset button', () => {
    const onReset = vi.fn()
    const { container } = render(
      <CompletionMessage startTime={new Date()} bestTime={0} onReset={onReset} />
    )
    expect(container.textContent).toContain('再玩一次')
  })
})
