import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatEmptyState } from '../ChatEmptyState'

describe('ChatEmptyState', () => {
  it('renders default (page) variant', () => {
    render(<ChatEmptyState />)
    expect(screen.getByText('有什么想聊的？')).toBeInTheDocument()
  })

  it('renders page variant explicitly', () => {
    render(<ChatEmptyState variant="page" />)
    expect(screen.getByText('有什么想聊的？')).toBeInTheDocument()
  })

  it('renders dialog variant', () => {
    render(<ChatEmptyState variant="dialog" />)
    expect(screen.getByText('有什么想聊的？')).toBeInTheDocument()
  })

  it('renders bot icon', () => {
    const { container } = render(<ChatEmptyState />)
    // Bot icon from lucide-react renders as svg
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })
})
