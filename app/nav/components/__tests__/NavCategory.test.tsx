import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NavCategory } from '../NavCategory'

const makeItem = (overrides = {}) => ({
  id: 1,
  nav_category_id: 1,
  name: 'Test Item',
  url: 'https://example.com',
  icon: null,
  description: 'Test description',
  sort_order: 1,
  is_visible: true,
  is_new_window: false,
  clicks: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
  ...overrides,
})

describe('NavCategory', () => {
  it('should render category name', () => {
    const category = {
      name: 'Development',
      items: [makeItem()],
    }
    render(<NavCategory category={category} />)
    expect(screen.getByText('Development')).toBeInTheDocument()
  })

  it('should render category items', () => {
    const items = [makeItem({ id: 1, name: 'GitHub' }), makeItem({ id: 2, name: 'MDN' })]
    render(<NavCategory category={{ name: 'Dev', items }} />)
    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('MDN')).toBeInTheDocument()
  })

  it('should render category description', () => {
    const category = {
      name: 'Learning',
      description: 'Resources for learning',
      items: [makeItem()],
    }
    render(<NavCategory category={category} />)
    expect(screen.getByText('Resources for learning')).toBeInTheDocument()
  })

  it('should return null when items array is empty', () => {
    const { container } = render(<NavCategory category={{ name: 'Empty', items: [] }} />)
    expect(container.firstChild).toBeNull()
  })

  it('should return null when items is undefined', () => {
    const { container } = render(<NavCategory category={{ name: 'No Items' } as any} />)
    expect(container.firstChild).toBeNull()
  })

  it('should render icon when provided', () => {
    const category = {
      name: 'With Icon',
      icon: '/icon.png',
      items: [makeItem()],
    }
    render(<NavCategory category={category} />)
    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThan(0)
  })

  it('should not render icon when not provided', () => {
    const category = {
      name: 'No Icon',
      icon: null,
      items: [makeItem()],
    }
    const { container } = render(<NavCategory category={category} />)
    const images = container.querySelectorAll('img')
    expect(images.length).toBe(0)
  })

  it('should render multiple categories with items', () => {
    const cat1 = { name: 'Cat1', items: [makeItem({ id: 1 })] }
    const cat2 = { name: 'Cat2', items: [makeItem({ id: 2 })] }

    render(
      <>
        <NavCategory category={cat1} />
        <NavCategory category={cat2} />
      </>
    )
    expect(screen.getByText('Cat1')).toBeInTheDocument()
    expect(screen.getByText('Cat2')).toBeInTheDocument()
  })
})
