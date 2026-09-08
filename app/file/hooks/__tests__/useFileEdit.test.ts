import { renderHook, act } from '@testing-library/react'
import type { CloudFile } from '../../types'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFileEdit } from '../useFileEdit'

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }))

// mock swr mutate and api put
vi.mock('swr', () => ({
  useSWRConfig: () => ({ mutate: mocks.mutate }),
}))

vi.mock('@/lib/api', () => ({ put: vi.fn() }))

describe('useFileEdit', () => {
  beforeEach(() => vi.clearAllMocks())
  it('opens and closes via modal helpers', () => {
    const { result } = renderHook(() => useFileEdit())

    expect(result.current.open).toBe(false)
    expect(result.current.selectedId).toBeNull()

    act(() => {
      result.current.openModal(5)
    })

    expect(result.current.open).toBe(true)
    expect(result.current.selectedId).toBe(5)

    act(() => {
      result.current.closeEditDialog()
    })

    expect(result.current.open).toBe(false)
    expect(result.current.selectedId).toBeNull()
  })

  it('setEditingFile populates name/description and opens', () => {
    const { result } = renderHook(() => useFileEdit())

    const fakeFile = { id: 7, name: 'foo', description: 'bar' }
    act(() => {
      result.current.setEditingFile(fakeFile as CloudFile)
    })

    expect(result.current.open).toBe(true)
    expect(result.current.selectedId).toBe(7)
    expect(result.current.fileName).toBe('foo')
    expect(result.current.fileDescription).toBe('bar')
  })
})

describe('file editing requests', () => {
  const file = { id: 7, name: '原始名称', description: '原始说明' } as CloudFile

  it('keeps the draft open after a failed save', async () => {
    const { put } = await import('@/lib/api')
    vi.mocked(put).mockRejectedValueOnce(new Error('failed'))
    const { result } = renderHook(() => useFileEdit())
    act(() => {
      result.current.setEditingFile(file)
    })
    act(() => {
      result.current.setFileName('待重试的名称')
    })
    await act(async () => {
      await result.current.updateFile()
    })
    expect(result.current.open).toBe(true)
    expect(result.current.selectedId).toBe(7)
    expect(result.current.fileName).toBe('待重试的名称')
    expect(result.current.isSaving).toBe(false)
  })

  it('prevents duplicate saves and refreshes every affected file view', async () => {
    const { put } = await import('@/lib/api')
    vi.mocked(put).mockReset()
    let finish: (() => void) | undefined
    vi.mocked(put).mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          finish = resolve
        })
    )
    const { result } = renderHook(() => useFileEdit())
    act(() => {
      result.current.setEditingFile(file)
    })
    let pending: Promise<void> | undefined
    act(() => {
      pending = result.current.updateFile()
      void result.current.updateFile()
    })
    expect(put).toHaveBeenCalledTimes(1)
    expect(result.current.isSaving).toBe(true)
    await act(async () => {
      finish?.()
      await pending
    })
    expect(result.current.open).toBe(false)
    const matches = mocks.mutate.mock.lastCall?.[0] as (key: unknown) => boolean
    for (const key of [
      '/cloud/files',
      '/cloud/files?search=a',
      '/cloud/files/7',
      '/cloud/tree',
      '/cloud/statistics',
    ]) {
      expect(matches(key)).toBe(true)
    }
    expect(matches('/notes')).toBe(false)
    expect(matches('/cloud/files-other')).toBe(false)
  })
})
