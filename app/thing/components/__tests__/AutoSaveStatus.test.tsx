import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AutoSaveStatus from '../item-detail/AutoSaveStatus'

describe('AutoSaveStatus', () => {
  it('shows saving indicator when autoSaving is true', () => {
    render(<AutoSaveStatus autoSaving lastSaved={null} />)
    expect(screen.getByText('正在保存...')).toBeDefined()
  })

  it('shows saved time when not autoSaving and has lastSaved', () => {
    const lastSaved = new Date('2024-01-15T10:30:00')
    render(<AutoSaveStatus autoSaving={false} lastSaved={lastSaved} />)
    expect(screen.getByText(/已保存/)).toBeDefined()
  })

  it('renders nothing when no state', () => {
    const { container } = render(<AutoSaveStatus autoSaving={false} lastSaved={null} />)
    expect(container.innerHTML).toBe('')
  })
})
