import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageUploadHeader } from '../ImageUploadHeader'

describe('ImageUploadHeader', () => {
  it('保留图片标签并隐藏已停用的自动去背景开关', () => {
    render(<ImageUploadHeader removeBgEnabled={false} onRemoveBgChange={vi.fn()} />)

    expect(screen.getByText('物品图片')).toBeInTheDocument()
    expect(screen.queryByText('上传时自动去背景')).not.toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })

  it('应该在点击说明按钮后显示帮助内容', async () => {
    const user = userEvent.setup()

    render(<ImageUploadHeader removeBgEnabled={false} onRemoveBgChange={vi.fn()} />)

    await user.click(screen.getByLabelText('查看上传说明'))

    expect(await screen.findByText(/支持JPG、PNG、GIF格式/)).toBeInTheDocument()
    expect(screen.queryByText(/异步去背景/)).not.toBeInTheDocument()
  })
})
