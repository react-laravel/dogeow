import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NoteErrorState from '../NoteErrorState'

describe('NoteErrorState', () => {
  it('should render error message', () => {
    render(<NoteErrorState message="加载失败" />)

    expect(screen.getByText('加载失败')).toBeInTheDocument()
  })

  it('should render with error variant by default', () => {
    const { container } = render(<NoteErrorState message="错误信息" />)

    const errorDiv = container.querySelector('.border-red-200')
    expect(errorDiv).toBeTruthy()
  })

  it('should render with warning variant', () => {
    const { container } = render(<NoteErrorState message="警告信息" variant="warning" />)

    const warningDiv = container.querySelector('.border-yellow-200')
    expect(warningDiv).toBeTruthy()
  })

  it('should render custom error messages', () => {
    const { rerender } = render(<NoteErrorState message="网络错误" />)

    expect(screen.getByText('网络错误')).toBeInTheDocument()

    rerender(<NoteErrorState message="权限不足" />)

    expect(screen.getByText('权限不足')).toBeInTheDocument()
  })

  it('should apply correct text color for error variant', () => {
    const { container } = render(<NoteErrorState message="error" variant="error" />)

    const errorDiv = container.querySelector('.text-red-700')
    expect(errorDiv).toBeTruthy()
  })

  it('should apply correct text color for warning variant', () => {
    const { container } = render(<NoteErrorState message="warning" variant="warning" />)

    const warningDiv = container.querySelector('.text-yellow-700')
    expect(warningDiv).toBeTruthy()
  })
})
