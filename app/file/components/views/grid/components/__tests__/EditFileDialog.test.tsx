import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EditFileDialog } from '../EditFileDialog'
import type { CloudFile } from '@/app/file/types'

describe('file edit dialog', () => {
  it('waits for successful saving before the owner closes it', () => {
    const onSave = vi.fn()
    const onClose = vi.fn()
    const props = {
      file: { id: 1, is_folder: false } as CloudFile,
      fileName: 'draft',
      fileDescription: '',
      onFileNameChange: vi.fn(),
      onFileDescriptionChange: vi.fn(),
      onSave,
      onClose,
    }
    const { rerender } = render(<EditFileDialog {...props} />)
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    rerender(<EditFileDialog {...props} isSaving />)
    expect(screen.getByRole('button', { name: /保存中/ })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(onClose).not.toHaveBeenCalled()
  })
})
