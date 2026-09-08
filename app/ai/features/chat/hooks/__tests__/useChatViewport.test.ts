import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useChatViewport } from '../useChatViewport'
afterEach(() => vi.unstubAllGlobals())
it('tracks the visible viewport as the keyboard opens and the browser pans', () => {
  const viewport = Object.assign(new EventTarget(), { height: 852, offsetTop: 0 })
  vi.stubGlobal('visualViewport', viewport)
  const { result, unmount } = renderHook(() => useChatViewport())
  expect(result.current).toEqual({ top: 0, height: 852 })
  act(() => {
    viewport.height = 400
    viewport.offsetTop = 50
    viewport.dispatchEvent(new Event('resize'))
  })
  expect(result.current).toEqual({ top: 50, height: 400 })
  act(() => {
    viewport.offsetTop = 0
    viewport.dispatchEvent(new Event('scroll'))
  })
  expect(result.current).toEqual({ top: 0, height: 400 })
  unmount()
})
