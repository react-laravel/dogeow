import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getSearchScopeLabel, SearchInput } from '../SearchInput'

const defaultProps = {
  searchTerm: '',
  onSearchChange: vi.fn(),
  onClear: vi.fn(),
  onSubmit: vi.fn(),
}

describe('launcher SearchInput', () => {
  it('maps route slugs to clear Chinese search scopes', () => {
    expect(getSearchScopeLabel('book')).toBe('电子书')
    expect(getSearchScopeLabel('thing')).toBe('物品')
    expect(getSearchScopeLabel('unknown')).toBe('当前页面')
    expect(getSearchScopeLabel()).toBe('内容')
  })

  it('uses a localized placeholder and accessible input name on book pages', () => {
    render(<SearchInput {...defaultProps} currentApp="book" />)

    expect(screen.getByRole('textbox', { name: '搜索内容' })).toHaveAttribute(
      'placeholder',
      '搜索电子书…'
    )
  })

  it('labels the clear action consistently', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    render(<SearchInput {...defaultProps} currentApp="book" searchTerm="鲁迅" onClear={onClear} />)

    const clearButton = screen.getByRole('button', { name: '清空搜索' })
    expect(clearButton).toHaveAttribute('title', '清空搜索')
    await user.click(clearButton)
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
