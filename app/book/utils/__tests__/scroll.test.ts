import { describe, expect, it } from 'vitest'
import {
  applyBookJump,
  scrollElementIntoContainer,
  scrollNarrationHighlightIntoView,
} from '../scroll'

describe('book scroll helpers', () => {
  it('applyBookJump prefers pairIndex over scrollTop', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'clientHeight', { value: 400 })
    container.style.overflowY = 'auto'
    container.getBoundingClientRect = () =>
      ({ top: 0, bottom: 400, left: 0, right: 300, width: 300, height: 400 }) as DOMRect

    const pair = document.createElement('p')
    pair.setAttribute('data-pair-index', '2')
    pair.getBoundingClientRect = () =>
      ({ top: 200, bottom: 240, left: 0, right: 300, width: 300, height: 40 }) as DOMRect
    container.appendChild(pair)
    document.body.appendChild(container)

    container.scrollTop = 0
    applyBookJump(container, { chapterId: '1', scrollTop: 999, pairIndex: 2 })

    // scrollElementIntoContainer with 'start' adjusts scrollTop by delta
    expect(container.scrollTop).toBe(200)

    container.remove()
  })

  it('scrollElementIntoContainer anchor mode offsets by reading ratio', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'clientHeight', { value: 500 })
    container.getBoundingClientRect = () =>
      ({ top: 0, bottom: 500, left: 0, right: 300, width: 300, height: 500 }) as DOMRect

    const el = document.createElement('div')
    el.getBoundingClientRect = () =>
      ({ top: 300, bottom: 340, left: 0, right: 300, width: 300, height: 40 }) as DOMRect

    container.scrollTop = 0
    scrollElementIntoContainer(container, el, 'anchor')

    // delta 300 - 500 * 0.28 = 160
    expect(container.scrollTop).toBeCloseTo(160, 0)
  })

  it('turns one viewport when narration reaches the last visible line', () => {
    const container = document.createElement('div')
    Object.defineProperties(container, {
      clientHeight: { value: 500 },
      scrollHeight: { value: 1600 },
    })
    container.style.overflowY = 'auto'
    container.getBoundingClientRect = () =>
      ({ top: 0, bottom: 500, left: 0, right: 300, width: 300, height: 500 }) as DOMRect

    const pair = document.createElement('p')
    pair.setAttribute('data-pair-index', '2')
    const highlight = document.createElement('mark')
    highlight.setAttribute('data-narration-highlight', '')
    highlight.getBoundingClientRect = () =>
      ({ top: 470, bottom: 494, left: 0, right: 30, width: 30, height: 24 }) as DOMRect
    pair.appendChild(highlight)
    container.appendChild(pair)
    document.body.appendChild(container)

    container.scrollTop = 100
    scrollNarrationHighlightIntoView(container, 2)

    expect(container.scrollTop).toBe(552)
    container.remove()
  })

  it('keeps the page still while narration highlight remains visible', () => {
    const container = document.createElement('div')
    Object.defineProperties(container, {
      clientHeight: { value: 500 },
      scrollHeight: { value: 1600 },
    })
    container.style.overflowY = 'auto'
    container.getBoundingClientRect = () =>
      ({ top: 0, bottom: 500, left: 0, right: 300, width: 300, height: 500 }) as DOMRect

    const pair = document.createElement('p')
    pair.setAttribute('data-pair-index', '2')
    const highlight = document.createElement('mark')
    highlight.setAttribute('data-narration-highlight', '')
    highlight.getBoundingClientRect = () =>
      ({ top: 240, bottom: 264, left: 0, right: 30, width: 30, height: 24 }) as DOMRect
    pair.appendChild(highlight)
    container.appendChild(pair)
    document.body.appendChild(container)

    container.scrollTop = 100
    scrollNarrationHighlightIntoView(container, 2)

    expect(container.scrollTop).toBe(100)
    container.remove()
  })
})
