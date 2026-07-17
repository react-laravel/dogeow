import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReaderSettingsPanel } from '../ReaderSettingsPanel'
import type { ReaderSettings } from '@/app/book/types/reader'

const defaultSettings: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  theme: 'light',
  pairDisplayMode: 'muted',
  contentMode: 'both',
  originalFontFamily: 'yahei',
  translationFontFamily: 'yahei',
  chapterId: 1,
}

describe('ReaderSettingsPanel', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    settings: defaultSettings,
    onPatchSettings: vi.fn(),
  }

  it('renders panel title', () => {
    render(<ReaderSettingsPanel {...defaultProps} />)
    expect(screen.getByText('阅读设置')).toBeInTheDocument()
  })

  it('keeps enough of the reader visible while adjusting settings', () => {
    render(<ReaderSettingsPanel {...defaultProps} />)

    expect(screen.getByRole('dialog')).toHaveStyle({
      width: 'min(18rem, 86vw)',
    })
  })

  it('renders all setting labels', () => {
    render(<ReaderSettingsPanel {...defaultProps} hasDualFonts />)
    expect(screen.getByText('原文字体')).toBeInTheDocument()
    expect(screen.getByText('译文字体')).toBeInTheDocument()
    expect(screen.getByText('字号')).toBeInTheDocument()
    expect(screen.getByText('行距')).toBeInTheDocument()
    expect(screen.getByText('背景模式')).toBeInTheDocument()
    expect(screen.getByText('原文译文区分')).toBeInTheDocument()
    expect(screen.getByText('阅读内容')).toBeInTheDocument()
  })

  it('shows current font size value', () => {
    render(<ReaderSettingsPanel {...defaultProps} />)
    expect(screen.getByText('18px')).toBeInTheDocument()
  })

  it('shows current line height value', () => {
    render(<ReaderSettingsPanel {...defaultProps} />)
    expect(screen.getByText('1.8')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(<ReaderSettingsPanel {...defaultProps} open={false} />)
    expect(screen.queryByText('阅读设置')).not.toBeInTheDocument()
  })

  it('calls onPatchSettings when font size slider changes', () => {
    const onPatchSettings = vi.fn()
    render(<ReaderSettingsPanel {...defaultProps} onPatchSettings={onPatchSettings} />)

    const sliders = screen.getAllByRole('slider')
    expect(sliders[0]).toHaveAttribute('min', '16')
    expect(sliders[0]).toHaveAttribute('max', '64')
    expect(sliders[0]).toHaveAttribute('step', '2')

    fireEvent.change(sliders[0], { target: { value: '20' } })
    expect(onPatchSettings).toHaveBeenCalledWith({ fontSize: 20 })
  })

  it('calls onPatchSettings when line height slider changes', () => {
    const onPatchSettings = vi.fn()
    render(<ReaderSettingsPanel {...defaultProps} onPatchSettings={onPatchSettings} />)

    const sliders = screen.getAllByRole('slider')
    // Second slider is line height
    fireEvent.change(sliders[1], { target: { value: '2.0' } })
    expect(onPatchSettings).toHaveBeenCalledWith({ lineHeight: 2.0 })
  })

  it('renders with dark theme settings', () => {
    const darkSettings: ReaderSettings = {
      ...defaultSettings,
      theme: 'dark',
    }
    render(<ReaderSettingsPanel {...defaultProps} settings={darkSettings} />)
    expect(screen.getByText('阅读设置')).toBeInTheDocument()
  })
})
