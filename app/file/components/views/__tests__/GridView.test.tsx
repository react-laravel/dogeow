import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GridView from '../GridView'
import useFileStore from '@/app/file/store/useFileStore'
import type { CloudFile } from '@/app/file/types'

vi.mock('@/lib/api', () => ({
  API_URL: 'http://localhost:8000',
  del: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
  uploadFile: vi.fn(),
  handleApiError: vi.fn(),
}))

afterEach(() => {
  act(() => {
    useFileStore.setState({ selectedFiles: [] })
  })
})

const file: CloudFile = {
  id: 1,
  name: '测试文件',
  original_name: 'test.txt',
  description: null,
  path: '/test.txt',
  mime_type: 'text/plain',
  extension: 'txt',
  size: 1,
  parent_id: null,
  user_id: 1,
  is_folder: false,
  created_at: '2026-09-08T00:00:00Z',
  updated_at: '2026-09-08T00:00:00Z',
  type: 'document',
}

describe('file grid selection', () => {
  it('reflects selection and deselection in both the UI and store', () => {
    render(<GridView files={[file]} />)
    const checkbox = screen.getByRole('checkbox', { name: '选择 测试文件' })
    expect(checkbox).not.toBeChecked()
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
    expect(useFileStore.getState().selectedFiles).toEqual([1])
    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
    expect(useFileStore.getState().selectedFiles).toEqual([])
  })
})
