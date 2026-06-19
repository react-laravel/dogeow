import { describe, expect, it } from 'vitest'
import {
  applyReaderJump,
  findPairElement,
  getReadingPosition,
  scrollElementIntoContainer,
} from '../readerScroll'

function mockRect(top: number, height: number): DOMRect {
  return {
    top,
    left: 0,
    right: 0,
    bottom: top + height,
    width: 0,
    height,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect
}

describe('readerScroll', () => {
  it('scrolls container to saved scrollTop when pair index is missing', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'scrollTop', {
      writable: true,
      value: 0,
    })

    applyReaderJump(container, {
      chapterId: 1,
      scrollTop: 240,
      pairIndex: null,
    })

    expect(container.scrollTop).toBe(240)
  })

  it('scrolls container to pair element when pair index exists', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'clientHeight', { value: 400 })
    Object.defineProperty(container, 'scrollTop', { writable: true, value: 0 })

    const pair = document.createElement('section')
    pair.setAttribute('data-pair-index', '12')
    Object.defineProperty(pair, 'clientHeight', { value: 40 })
    container.appendChild(pair)

    pair.getBoundingClientRect = () => mockRect(300, 40)
    container.getBoundingClientRect = () => mockRect(100, 400)

    applyReaderJump(container, {
      chapterId: 1,
      scrollTop: 0,
      pairIndex: 12,
    })

    expect(container.scrollTop).toBe(200)
  })

  it('finds nearest rendered pair when exact index is missing', () => {
    const container = document.createElement('div')
    const pair = document.createElement('section')
    pair.setAttribute('data-pair-index', '10')
    container.appendChild(pair)

    expect(findPairElement(container, 12)?.getAttribute('data-pair-index')).toBe('10')
  })

  it('detects visible pair index from reading position', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'clientHeight', { value: 400 })
    Object.defineProperty(container, 'scrollTop', { writable: true, value: 120 })
    container.getBoundingClientRect = () => mockRect(100, 400)

    const near = document.createElement('section')
    near.setAttribute('data-pair-index', '8')
    near.getBoundingClientRect = () => mockRect(180, 30)

    const far = document.createElement('section')
    far.setAttribute('data-pair-index', '20')
    far.getBoundingClientRect = () => mockRect(420, 30)

    container.append(near, far)

    expect(getReadingPosition(container)).toEqual({
      scrollTop: 120,
      pairIndex: 8,
    })
  })

  it('detects visible pair index from the actual scrolling ancestor', () => {
    const scrollContainer = document.createElement('main')
    scrollContainer.setAttribute('data-scroll-container', '')
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 400 })
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000 })
    Object.defineProperty(scrollContainer, 'scrollTop', { writable: true, value: 320 })
    scrollContainer.getBoundingClientRect = () => mockRect(0, 400)

    const container = document.createElement('div')
    const aboveViewport = document.createElement('section')
    aboveViewport.setAttribute('data-pair-index', '2')
    aboveViewport.getBoundingClientRect = () => mockRect(-80, 30)

    const nearAnchor = document.createElement('section')
    nearAnchor.setAttribute('data-pair-index', '9')
    nearAnchor.getBoundingClientRect = () => mockRect(102, 30)

    container.append(aboveViewport, nearAnchor)
    scrollContainer.appendChild(container)
    document.body.appendChild(scrollContainer)

    expect(getReadingPosition(container)).toEqual({
      scrollTop: 320,
      pairIndex: 9,
    })

    scrollContainer.remove()
  })

  it('centers element within container', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'clientHeight', { value: 200 })
    Object.defineProperty(container, 'scrollTop', { writable: true, value: 50 })

    const element = document.createElement('div')
    Object.defineProperty(element, 'clientHeight', { value: 20 })

    element.getBoundingClientRect = () => mockRect(160, 20)
    container.getBoundingClientRect = () => mockRect(100, 200)

    scrollElementIntoContainer(container, element, 'center')

    expect(container.scrollTop).toBe(20)
  })
})
