import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import About from '../page'

vi.unmock('@/components/ui/popover')

const STORAGE_KEY = 'dogeow:about-reading-settings'

describe('About Page', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('should render about page with correct content', () => {
    render(<About />)

    expect(screen.getByText('自言自语')).toBeInTheDocument()
    expect(screen.queryByText('红楼梦对照阅读')).not.toBeInTheDocument()
  })

  it('keeps the route shell fixed and horizontal quote overflow inside the list', () => {
    const { container } = render(<About />)
    const routeShell = container.firstChild
    const quoteList = screen.getByLabelText('自言自语内容')

    expect(routeShell).toHaveClass('mx-auto', 'h-full', 'min-h-0', 'overflow-hidden')
    expect(quoteList).toHaveClass('min-h-0', 'flex-1', 'overflow-x-hidden', 'overflow-y-auto')
    expect(quoteList).not.toHaveClass('h-[calc(100dvh-14rem)]', 'min-h-[28rem]')
  })

  it('shows the reading controls in a compact accessible popover', () => {
    render(<About />)

    const trigger = screen.getByRole('button', { name: '阅读设置' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByLabelText('字体大小')).not.toBeInTheDocument()

    fireEvent.click(trigger)

    const settingsDialog = screen.getByRole('dialog', { name: '阅读设置' })
    expect(settingsDialog).toHaveClass('w-[min(calc(100vw-2rem),20rem)]')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('字体大小')).toBeInTheDocument()
    expect(screen.getByLabelText('文字颜色')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '切换为竖排' })).toBeInTheDocument()
  })

  it('adjusts font size and text color and persists the settings', async () => {
    render(<About />)
    fireEvent.click(screen.getByRole('button', { name: '阅读设置' }))

    fireEvent.change(screen.getByLabelText('字体大小'), { target: { value: '32' } })
    fireEvent.change(screen.getByLabelText('文字颜色'), { target: { value: '#ff0000' } })

    expect(screen.getByLabelText('自言自语内容')).toHaveStyle({
      color: '#ff0000',
      fontSize: '32px',
    })
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
        fontSize: 32,
        color: '#ff0000',
        direction: 'horizontal',
      })
    )
  })

  it('switches vertical text to horizontal-only overflow and persists the direction', async () => {
    render(<About />)
    fireEvent.click(screen.getByRole('button', { name: '阅读设置' }))

    fireEvent.click(screen.getByRole('button', { name: '切换为竖排' }))

    const quoteList = screen.getByLabelText('自言自语内容')
    const firstQuote = screen.getByText(/世界需要更多的英雄/)

    expect(quoteList).not.toHaveStyle({ writingMode: 'vertical-rl' })
    expect(quoteList).toHaveClass('overflow-x-auto', 'overflow-y-hidden')
    expect(quoteList).not.toHaveClass('overflow-y-auto')
    expect(firstQuote).toHaveClass('h-full', 'shrink-0')
    expect(firstQuote).toHaveStyle({ writingMode: 'vertical-rl' })
    expect(screen.getByRole('button', { name: '切换为横排' })).toBeInTheDocument()
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
        direction: 'vertical',
      })
    )
  })

  it('restores saved reading settings from localStorage', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        fontSize: 36,
        color: '#123abc',
        direction: 'vertical',
      })
    )

    render(<About />)

    const quoteList = screen.getByLabelText('自言自语内容')
    expect(quoteList).toHaveStyle({ color: '#123abc', fontSize: '36px' })
    expect(quoteList).toHaveClass('overflow-x-auto', 'overflow-y-hidden')

    fireEvent.click(screen.getByRole('button', { name: '阅读设置' }))
    expect(screen.getByRole('button', { name: '切换为横排' })).toBeInTheDocument()
  })
})
