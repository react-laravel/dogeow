import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NoteLoadingState from '../NoteLoadingState'

describe('NoteLoadingState', () => {
  it('should render loading placeholder elements', () => {
    const { container } = render(<NoteLoadingState />)

    const animatedElements = container.querySelectorAll('.animate-pulse > div')
    expect(animatedElements.length).toBeGreaterThanOrEqual(2)
  })

  it('should render title placeholder', () => {
    const { container } = render(<NoteLoadingState />)

    const titlePlaceholder = container.querySelector('.h-8')
    expect(titlePlaceholder).toBeTruthy()
  })

  it('should render content placeholder', () => {
    const { container } = render(<NoteLoadingState />)

    const contentPlaceholder = container.querySelector('.h-64')
    expect(contentPlaceholder).toBeTruthy()
  })

  it('should have gray background for skeleton elements', () => {
    const { container } = render(<NoteLoadingState />)

    const grayElements = container.querySelectorAll('.bg-gray-200')
    expect(grayElements.length).toBeGreaterThanOrEqual(2)
  })
})
