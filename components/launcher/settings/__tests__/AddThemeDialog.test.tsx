import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { AddThemeDialog } from '../AddThemeDialog'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

beforeEach(() => {
  vi.clearAllMocks()
})

async function openDialog(onAddTheme = vi.fn()) {
  const user = userEvent.setup()
  render(<AddThemeDialog onAddTheme={onAddTheme} />)
  await user.click(screen.getByRole('button', { name: '添加主题' }))
  return { user, onAddTheme }
}

describe('settings AddThemeDialog', () => {
  it('exposes the add action without opening the dialog initially', () => {
    render(<AddThemeDialog onAddTheme={vi.fn()} />)
    expect(screen.getByRole('button', { name: '添加主题' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('submits the chosen name and color through the current callback contract', async () => {
    const { user, onAddTheme } = await openDialog()
    await user.type(screen.getByLabelText('名称'), '我的主题')
    fireEvent.change(screen.getByLabelText('颜色'), { target: { value: '#ef4444' } })
    await user.click(screen.getByRole('button', { name: '添加' }))

    expect(onAddTheme).toHaveBeenCalledExactlyOnceWith('我的主题', '#ef4444')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it.each(['', '   '])('rejects an empty or blank theme name (%j)', async name => {
    const { user, onAddTheme } = await openDialog()
    fireEvent.change(screen.getByLabelText('名称'), { target: { value: name } })
    await user.click(screen.getByRole('button', { name: '添加' }))

    expect(onAddTheme).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledOnce()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('resets both fields after a successful submission', async () => {
    const { user } = await openDialog()
    await user.type(screen.getByLabelText('名称'), '红色')
    fireEvent.change(screen.getByLabelText('颜色'), { target: { value: '#ef4444' } })
    await user.click(screen.getByRole('button', { name: '添加' }))
    await user.click(screen.getByRole('button', { name: '添加主题' }))

    expect(screen.getByLabelText('名称')).toHaveValue('')
    expect(screen.getByLabelText('颜色')).toHaveValue('#3b82f6')
  })

  it('closes with Escape without adding the draft', async () => {
    const { user, onAddTheme } = await openDialog()
    await user.type(screen.getByLabelText('名称'), '草稿')
    await user.keyboard('{Escape}')

    expect(onAddTheme).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('supports adding another theme after the first one', async () => {
    const { user, onAddTheme } = await openDialog()
    await user.type(screen.getByLabelText('名称'), '主题一')
    await user.click(screen.getByRole('button', { name: '添加' }))
    await user.click(screen.getByRole('button', { name: '添加主题' }))
    await user.type(screen.getByLabelText('名称'), '主题二')
    await user.click(screen.getByRole('button', { name: '添加' }))

    expect(onAddTheme.mock.calls).toEqual([
      ['主题一', '#3b82f6'],
      ['主题二', '#3b82f6'],
    ])
  })
})
