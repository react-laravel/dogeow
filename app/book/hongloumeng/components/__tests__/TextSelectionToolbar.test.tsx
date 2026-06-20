import { render, screen, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import { vi } from 'vitest'
import { TextSelectionToolbar } from '../TextSelectionToolbar'

function ToolbarHarness() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef}>
      <section data-pair-index="3">
        <p data-testid="reader-text">选中的正文</p>
      </section>
      <TextSelectionToolbar
        containerRef={containerRef}
        onAddBookmark={vi.fn()}
        onAddCollection={vi.fn()}
        onAskAi={vi.fn()}
        onPlaySelection={vi.fn()}
      />
    </div>
  )
}

function selectReaderText() {
  const node = screen.getByTestId('reader-text').firstChild
  if (!node) throw new Error('reader text node not found')

  const range = document.createRange()
  range.selectNodeContents(node)
  range.getBoundingClientRect = vi.fn(
    () =>
      ({
        top: 120,
        left: 40,
        width: 160,
        height: 24,
        right: 200,
        bottom: 144,
        x: 40,
        y: 120,
        toJSON: () => ({}),
      }) as DOMRect
  )
  range.getClientRects = vi.fn(() => [] as unknown as DOMRectList)

  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

describe('TextSelectionToolbar', () => {
  it('shows actions after mobile-style selection changes', async () => {
    render(<ToolbarHarness />)

    selectReaderText()
    document.dispatchEvent(new Event('selectionchange'))
    document.dispatchEvent(new Event('touchend'))

    await waitFor(() => {
      expect(screen.getByRole('toolbar', { name: '选中文本操作' })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /加书签/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /收藏/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /问 AI/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /播放/ })).toBeInTheDocument()
  })
})
