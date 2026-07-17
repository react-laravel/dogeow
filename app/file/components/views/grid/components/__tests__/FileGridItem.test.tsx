import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FileGridItem } from '../FileGridItem'
import type { CloudFile } from '@/app/file/types'

const folder: CloudFile = {
  id: 1,
  name: '资料',
  original_name: null,
  path: '/资料',
  mime_type: null,
  extension: null,
  size: 0,
  parent_id: null,
  user_id: 1,
  is_folder: true,
  description: null,
  created_at: '2026-07-16T00:00:00Z',
  updated_at: '2026-07-16T00:00:00Z',
  type: 'folder',
}

function renderItem(overrides: Partial<React.ComponentProps<typeof FileGridItem>> = {}) {
  const props: React.ComponentProps<typeof FileGridItem> = {
    file: folder,
    isSelected: false,
    onSelect: vi.fn(),
    onClick: vi.fn(),
    onDownload: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }

  render(<FileGridItem {...props} />)
  return props
}

describe('FileGridItem', () => {
  it('uses readable labels for the primary, selection, and overflow actions', () => {
    renderItem()

    expect(screen.getByRole('button', { name: '打开文件夹：资料' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '选择 资料' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '资料 的更多操作' })).toBeInTheDocument()
  })

  it('opens the item from the keyboard-accessible primary action', () => {
    const props = renderItem()

    fireEvent.click(screen.getByRole('button', { name: '打开文件夹：资料' }))

    expect(props.onClick).toHaveBeenCalledWith(folder)
  })
})
