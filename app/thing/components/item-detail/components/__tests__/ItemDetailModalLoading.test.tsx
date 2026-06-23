import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ItemDetailModalLoading } from '../ItemDetailModalLoading'

describe('ItemDetailModalLoading', () => {
  it('renders loading text', () => {
    render(<ItemDetailModalLoading />)
    expect(screen.getByText('加载中...')).toBeDefined()
  })
})
