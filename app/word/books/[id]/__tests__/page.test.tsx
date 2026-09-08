import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BookDetailPage from '../page'

const mocks = vi.hoisted(() => ({ useBookWords: vi.fn() }))
vi.mock('next/navigation', () => ({ useParams: () => ({ id: '1' }) }))
vi.mock('../../../hooks/useWord', () => ({
  useBook: () => ({ data: { id: 1, name: '词书', total_words: 100 }, isLoading: false }),
  useWordSettings: () => ({ data: { current_book_id: 1 } }),
  useBookWords: mocks.useBookWords,
  updateWordSettings: vi.fn(),
}))
describe('BookDetailPage', () => {
  beforeEach(() => {
    mocks.useBookWords.mockReset().mockImplementation((_id, page, _perPage, filter, keyword) => ({
      data: { data: [], meta: { current_page: page, last_page: keyword ? 2 : 5, total: 100 } },
      isLoading: false,
    }))
  })
  it('searches the whole book from page one, and keeps search pagination', async () => {
    render(<BookDetailPage />)
    fireEvent.click(screen.getByRole('button', { name: '下一页' }))
    expect(mocks.useBookWords).toHaveBeenLastCalledWith(1, 2, 30, 'all', '')
    fireEvent.change(screen.getByRole('searchbox', { name: '搜索本书单词' }), {
      target: { value: 'zebra' },
    })
    await waitFor(() =>
      expect(mocks.useBookWords).toHaveBeenLastCalledWith(1, 1, 30, 'all', 'zebra')
    )
    fireEvent.click(screen.getByRole('button', { name: '下一页' }))
    expect(mocks.useBookWords).toHaveBeenLastCalledWith(1, 2, 30, 'all', 'zebra')
    fireEvent.click(screen.getByRole('button', { name: '困难词' }))
    expect(mocks.useBookWords).toHaveBeenLastCalledWith(1, 1, 30, 'difficult', 'zebra')
  })
  it('jumps to an explicitly selected valid page', async () => {
    render(<BookDetailPage />)
    fireEvent.click(screen.getByRole('button', { name: /跳转页码/ }))
    fireEvent.change(screen.getByRole('spinbutton', { name: '页码' }), { target: { value: '4' } })
    fireEvent.click(screen.getByRole('button', { name: '跳转' }))
    await waitFor(() => expect(mocks.useBookWords).toHaveBeenLastCalledWith(1, 4, 30, 'all', ''))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
