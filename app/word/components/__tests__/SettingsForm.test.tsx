import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsForm } from '../SettingsForm'
import { useWordStore } from '../../stores/wordStore'
import type { UserWordSetting } from '../../types'

const mocks = vi.hoisted(() => ({ update: vi.fn(), mutate: vi.fn(), useSettings: vi.fn() }))
vi.mock('../../hooks/useWord', () => ({
  useWordSettings: mocks.useSettings,
  updateWordSettings: mocks.update,
}))
const setting: UserWordSetting = {
  id: 1,
  user_id: 1,
  daily_new_words: 10,
  review_multiplier: 2,
  is_auto_pronounce: true,
}
describe('SettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useWordStore.getState().reset()
    mocks.useSettings.mockReturnValue({ data: setting, isLoading: false, mutate: mocks.mutate })
    mocks.update.mockImplementation(async data => ({ setting: { ...setting, ...data } }))
  })
  it('saves the latest fields only after the explicit save action', async () => {
    render(<SettingsForm />)
    expect(mocks.update).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '20 个' }))
    fireEvent.click(screen.getByRole('radio', { name: /加强/ }))
    fireEvent.click(screen.getByLabelText('自动发音'))
    expect(screen.getByRole('status')).toHaveTextContent('有未保存的更改')
    expect(mocks.update).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '保存设置' }))
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith({
        daily_new_words: 20,
        review_multiplier: 3,
        is_auto_pronounce: false,
      })
    )
    await waitFor(() => expect(screen.getByRole('button', { name: '保存设置' })).toBeDisabled())
    expect(useWordStore.getState().settings?.is_auto_pronounce).toBe(false)
    expect(mocks.mutate).toHaveBeenCalledWith(expect.objectContaining({ daily_new_words: 20 }), {
      revalidate: false,
    })
  })
  it('preserves the edited values after failure and lets the user retry', async () => {
    mocks.update.mockRejectedValueOnce(new Error('offline'))
    render(<SettingsForm />)
    fireEvent.click(screen.getByRole('button', { name: '30 个' }))
    fireEvent.click(screen.getByRole('button', { name: '保存设置' }))
    expect(await screen.findByText('保存失败，更改已保留')).toBeInTheDocument()
    expect(screen.getByLabelText('每日新词')).toHaveValue(30)
    expect(mocks.mutate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '保存设置' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('已保存'))
    expect(mocks.update).toHaveBeenCalledTimes(2)
  })
  it.each(['', '0', '101', '1.5'])('does not save invalid daily amount %s', async value => {
    render(<SettingsForm />)
    fireEvent.change(screen.getByLabelText('每日新词'), { target: { value } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '保存设置' }))
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('does not replace an unsaved draft when settings revalidate', () => {
    const { rerender } = render(<SettingsForm />)
    fireEvent.click(screen.getByRole('button', { name: '20 个' }))
    mocks.useSettings.mockReturnValue({
      data: { ...setting },
      isLoading: false,
      mutate: mocks.mutate,
    })
    rerender(<SettingsForm />)
    expect(screen.getByLabelText('每日新词')).toHaveValue(20)
  })
  it('invalidates the previous group only after changed learning quantities are saved', async () => {
    useWordStore
      .getState()
      .setCurrentWords([{ id: 1, content: 'old', difficulty: 1, frequency: 1 }])
    useWordStore.getState().startStudy('learning', '0:10:2')
    render(<SettingsForm />)
    fireEvent.click(screen.getByRole('button', { name: '20 个' }))
    expect(useWordStore.getState().studyQueue).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '保存设置' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '保存设置' })).toBeDisabled())
    expect(useWordStore.getState().studyQueue).toHaveLength(0)
    expect(useWordStore.getState().sessionPlanKey).toBeNull()
  })
  it('keeps the active group when only pronunciation is changed', async () => {
    useWordStore
      .getState()
      .setCurrentWords([{ id: 1, content: 'ongoing', difficulty: 1, frequency: 1 }])
    useWordStore.getState().startStudy('learning', '0:10:2')
    render(<SettingsForm />)
    fireEvent.click(screen.getByLabelText('自动发音'))
    fireEvent.click(screen.getByRole('button', { name: '保存设置' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '保存设置' })).toBeDisabled())
    expect(useWordStore.getState().getCurrentWord()?.content).toBe('ongoing')
  })
})
