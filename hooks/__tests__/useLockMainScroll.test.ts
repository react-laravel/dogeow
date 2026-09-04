import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLockMainScroll } from '../useLockMainScroll'

describe('useLockMainScroll', () => {
  let scroller: HTMLDivElement

  beforeEach(() => {
    scroller = document.createElement('div')
    scroller.id = 'main-scroll'
    scroller.style.overflowY = 'auto'
    document.body.appendChild(scroller)
  })

  afterEach(() => {
    scroller.remove()
  })

  it('locks #main-scroll overflow while open and restores on close', () => {
    const { rerender, unmount } = renderHook(
      ({ locked }: { locked: boolean }) => useLockMainScroll(locked),
      { initialProps: { locked: true } }
    )

    expect(scroller.style.overflowY).toBe('hidden')
    expect(scroller.style.overscrollBehavior).toBe('none')

    rerender({ locked: false })
    expect(scroller.style.overflowY).toBe('auto')

    unmount()
  })

  it('prevents background touchmove but allows sheet content touches', () => {
    renderHook(() => useLockMainScroll(true))

    const backgroundEvent = new TouchEvent('touchmove', { cancelable: true, bubbles: true })
    const preventSpy = vi.spyOn(backgroundEvent, 'preventDefault')
    scroller.dispatchEvent(backgroundEvent)
    expect(preventSpy).toHaveBeenCalled()

    const sheet = document.createElement('div')
    sheet.setAttribute('data-slot', 'sheet-content')
    scroller.appendChild(sheet)

    const sheetEvent = new TouchEvent('touchmove', { cancelable: true, bubbles: true })
    Object.defineProperty(sheetEvent, 'target', { value: sheet })
    const sheetPrevent = vi.spyOn(sheetEvent, 'preventDefault')
    scroller.dispatchEvent(sheetEvent)
    expect(sheetPrevent).not.toHaveBeenCalled()
  })
})
