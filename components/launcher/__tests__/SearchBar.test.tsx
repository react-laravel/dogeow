import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchBar } from '../SearchBar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/book/luxun',
}))

describe('SearchBar', () => {
  const onToggleSearch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderVisibleSearch() {
    render(
      <SearchBar
        isVisible
        searchTerm=""
        setSearchTerm={vi.fn()}
        onSearch={vi.fn()}
        onToggleSearch={onToggleSearch}
        currentApp="book"
      />
    )
  }

  it('does not close on mousedown inside the search controls', () => {
    renderVisibleSearch()

    fireEvent.mouseDown(screen.getByRole('button', { name: '关闭搜索' }))

    expect(onToggleSearch).not.toHaveBeenCalled()
  })

  it('closes once when the close button is clicked', () => {
    renderVisibleSearch()

    fireEvent.click(screen.getByRole('button', { name: '关闭搜索' }))

    expect(onToggleSearch).toHaveBeenCalledTimes(1)
  })

  it('closes when pressing outside the whole search area', () => {
    renderVisibleSearch()

    fireEvent.mouseDown(document.body)

    expect(onToggleSearch).toHaveBeenCalledTimes(1)
  })
})
