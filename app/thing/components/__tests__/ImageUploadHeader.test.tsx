import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageUploadHeader } from '../ImageUploadHeader'

describe('ImageUploadHeader', () => {
  it('应该渲染物品图片标签和去背景开关', () => {
    render(<ImageUploadHeader removeBgEnabled={false} onRemoveBgChange={vi.fn()} />)

    expect(screen.getByText('物品图片')).toBeInTheDocument()
    expect(screen.getByText('上传时自动去背景')).toBeInTheDocument()
  })

  it('应该在点击说明按钮后显示帮助内容', async () => {
    const user = userEvent.setup()

    render(<ImageUploadHeader removeBgEnabled={false} onRemoveBgChange={vi.fn()} />)

    await user.click(screen.getByLabelText('查看上传说明'))

    expect(await screen.findByText(/支持JPG、PNG、GIF格式/)).toBeInTheDocument()
  })
})
