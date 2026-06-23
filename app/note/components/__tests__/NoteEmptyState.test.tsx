import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NoteEmptyState from '../NoteEmptyState'

describe('NoteEmptyState', () => {
  it('should render with default title and description', () => {
    render(<NoteEmptyState />)

    expect(screen.getByText('暂无笔记')).toBeInTheDocument()
    expect(screen.getByText('请添加您的第一个笔记')).toBeInTheDocument()
  })

  it('should render with memo display name', () => {
    const { container } = render(<NoteEmptyState />)

    expect(container.firstChild).toBeTruthy()
  })
})
