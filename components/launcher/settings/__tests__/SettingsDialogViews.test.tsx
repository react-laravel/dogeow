import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppsListView } from '../SettingsDialogViews'

describe('AppsListView', () => {
  it('labels both setting groups and exposes the selected choices', () => {
    render(
      <AppsListView
        siteLayout="icon"
        setSiteLayout={vi.fn()}
        projectCoverMode="image"
        setProjectCoverMode={vi.fn()}
      />
    )

    expect(screen.getByRole('group', { name: '首页布局' })).toBeInTheDocument()
    expect(screen.getByText('控制首页应用入口的排列方式')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '图标' })).toHaveAttribute('aria-pressed', 'true')

    expect(screen.getByRole('group', { name: '封面样式' })).toBeInTheDocument()
    expect(screen.getByText('控制应用卡片使用图片、纯色或无封面')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '图片' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('updates layout and cover choices', () => {
    const setSiteLayout = vi.fn()
    const setProjectCoverMode = vi.fn()

    render(
      <AppsListView
        siteLayout="icon"
        setSiteLayout={setSiteLayout}
        projectCoverMode="image"
        setProjectCoverMode={setProjectCoverMode}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '网格' }))
    fireEvent.click(screen.getByRole('button', { name: '纯色' }))

    expect(setSiteLayout).toHaveBeenCalledWith('grid')
    expect(setProjectCoverMode).toHaveBeenCalledWith('color')
  })
})
