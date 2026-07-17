import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SettingsDialogSidebar } from '../SettingsDialogSidebar'

describe('SettingsDialogSidebar', () => {
  it('exposes the responsive setting navigation with a current item', () => {
    const onSelect = vi.fn()
    render(<SettingsDialogSidebar activeSection="color" isMdScreen={false} onSelect={onSelect} />)

    expect(screen.getByRole('navigation', { name: '设置分类' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '颜色' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('button', { name: '全屏' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '语言' }))
    expect(onSelect).toHaveBeenCalledWith('language')
  })
})
