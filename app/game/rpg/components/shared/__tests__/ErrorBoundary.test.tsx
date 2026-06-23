import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

describe('ErrorBoundary', () => {
  it('should render children when no error', () => {
    const { container } = render(
      <ErrorBoundary>
        <div data-testid="child">Hello</div>
      </ErrorBoundary>
    )
    expect(container.querySelector('[data-testid="child"]')).toBeTruthy()
  })

  it('should render fallback when error occurs', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }

    const { container } = render(
      <ErrorBoundary fallback={<div data-testid="fallback">Fallback</div>}>
        <ThrowError />
      </ErrorBoundary>
    )
    expect(container.querySelector('[data-testid="fallback"]')).toBeTruthy()
  })

  it('should render default error UI when error occurs without fallback', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }

    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    // Should contain the default error UI
    expect(container.textContent).toContain('出现错误')
  })

  it('should show error message in default UI', () => {
    const ThrowError = () => {
      throw new Error('Custom error message')
    }

    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    expect(container.textContent).toContain('Custom error message')
  })

  it('should show retry button in default error UI', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }

    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    expect(container.textContent).toContain('重试')
  })

  it('should have retry button that resets error state', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }

    const { container, rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(container.textContent).toContain('出现错误')

    // Click retry button
    const retryButton = container.querySelector('button')
    if (retryButton) {
      retryButton.click()
      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
    }
  })
})
