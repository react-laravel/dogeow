import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SearchResultsList } from '../components/SearchResultsList'

vi.mock('../components/SearchResultItem', () => ({
  SearchResultItem: ({ result }: { result: { title: string } }) => <div>{result.title}</div>,
}))

describe('SearchResultsList', () => {
  const baseProps = {
    categories: [],
    isAuthenticated: false,
    imageErrors: {},
    onImageError: vi.fn(),
    onResultClick: vi.fn(),
  }

  it('shows an interim searching state while waiting for the first response', () => {
    render(
      <SearchResultsList
        {...baseProps}
        loading={false}
        searchTerm="笔记"
        filteredResults={[]}
        hasSearched={false}
      />
    )

    expect(screen.getByText('正在搜索...')).toBeInTheDocument()
  })

  it('shows an empty state after the search finishes with no matches', () => {
    render(
      <SearchResultsList
        {...baseProps}
        loading={false}
        searchTerm="不存在"
        filteredResults={[]}
        hasSearched={true}
      />
    )

    expect(screen.getByText('未找到相关结果')).toBeInTheDocument()
  })
})
