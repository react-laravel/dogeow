import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppsView } from '../AppsView'
import { useFilterPersistenceStore } from '@/app/thing/stores/filterPersistenceStore'

vi.mock('next/image', () => ({
  default: ({ alt, onClick, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={alt} onClick={onClick} {...props} />
  ),
}))

vi.mock('../AppGrid', () => ({
  AppGrid: () => <div>AppGrid</div>,
}))

vi.mock('../SearchBar', () => ({
  SearchBar: () => <div>SearchBar</div>,
}))

vi.mock('./UserButton', () => ({
  UserButton: () => <button type="button">用户菜单</button>,
}))

vi.mock('@/components/app/NotificationDropdown', () => ({
  NotificationDropdown: () => <div>通知</div>,
}))

vi.mock('@/app/thing/stores/filterPersistenceStore', () => ({
  useFilterPersistenceStore: vi.fn(),
}))

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    currentLanguage: 'zh-CN',
  }),
}))

describe('AppsView', () => {
  const originalLocation = Object.getOwnPropertyDescriptor(window, 'location')
  const clearFilters = vi.fn()
  const routerPush = vi.fn()
  const toggleDisplayMode = vi.fn()
  const defaultSearchManager = {
    isSearchVisible: false,
    searchTerm: '',
    setSearchTerm: vi.fn(),
    handleSearch: vi.fn(),
    toggleSearch: vi.fn(),
    currentApp: 'files',
    isHomePage: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useFilterPersistenceStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      clearFilters,
    })
  })

  afterEach(() => {
    if (originalLocation) {
      Object.defineProperty(window, 'location', originalLocation)
    }
  })

  it('uses Next router when clicking the logo away from home', async () => {
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { assign },
      configurable: true,
    })

    const user = userEvent.setup()
    const { getByRole } = render(
      <AppsView
        router={{ push: routerPush }}
        searchManager={defaultSearchManager}
        isAuthenticated
        toggleDisplayMode={toggleDisplayMode}
      />
    )

    await user.click(getByRole('button', { name: '返回首页' }))

    expect(clearFilters).toHaveBeenCalledTimes(1)
    expect(routerPush).toHaveBeenCalledWith('/')
    expect(assign).not.toHaveBeenCalled()
  })

  it('does not navigate when clicking the logo on home', async () => {
    const user = userEvent.setup()
    const { getByRole } = render(
      <AppsView
        router={{ push: routerPush }}
        searchManager={{ ...defaultSearchManager, isHomePage: true }}
        isAuthenticated
        toggleDisplayMode={toggleDisplayMode}
      />
    )

    await user.click(getByRole('button', { name: '返回首页' }))

    expect(clearFilters).toHaveBeenCalledTimes(1)
    expect(routerPush).not.toHaveBeenCalled()
  })

  it('closes ai before navigating home', async () => {
    const assign = vi.fn()
    const onCloseAi = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { assign },
      configurable: true,
    })

    const user = userEvent.setup()
    const { getByRole } = render(
      <AppsView
        router={{ push: routerPush }}
        searchManager={defaultSearchManager}
        isAuthenticated
        toggleDisplayMode={toggleDisplayMode}
        isAiOpen
        onCloseAi={onCloseAi}
      />
    )

    await user.click(getByRole('button', { name: '返回首页' }))

    expect(onCloseAi).toHaveBeenCalledTimes(1)
    expect(clearFilters).toHaveBeenCalledTimes(1)
    expect(routerPush).toHaveBeenCalledWith('/')
    expect(assign).not.toHaveBeenCalled()
  })

  it('gives search the full action area on the home page', () => {
    const { getByRole, queryByRole } = render(
      <AppsView
        router={{ push: routerPush }}
        searchManager={{ ...defaultSearchManager, isHomePage: true, isSearchVisible: true }}
        isAuthenticated
        toggleDisplayMode={toggleDisplayMode}
      />
    )

    expect(getByRole('textbox')).toBeInTheDocument()
    expect(queryByRole('button', { name: '通知' })).not.toBeInTheDocument()
    expect(queryByRole('button', { name: /用户菜单/ })).not.toBeInTheDocument()
  })
})
