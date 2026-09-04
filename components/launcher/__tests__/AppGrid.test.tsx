import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppGrid } from '../AppGrid'

const { musicState } = vi.hoisted(() => ({
  musicState: { isPlaying: true },
}))

vi.mock('@/stores/musicStore', () => ({
  useMusicStore: () => musicState,
}))

vi.mock('@/stores/authStore', () => ({
  default: (selector: (state: { user: { id: number; name: string; email: string } }) => unknown) =>
    selector({ user: { id: 1, name: 'Admin', email: 'admin@example.com' } }),
}))

vi.mock('@/lib/ai/access', () => ({
  canUseAi: () => true,
}))

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      if (key === 'appgrid.music') return '音乐'
      if (key === 'appgrid.ai') return 'AI 助理'
      if (key === 'appgrid.search') return '搜索'
      return fallback ?? key
    },
  }),
}))

describe('AppGrid', () => {
  beforeEach(() => {
    musicState.isPlaying = true
  })

  it('provides desktop labels and exposes the active playback status', () => {
    render(<AppGrid toggleDisplayMode={vi.fn()} onOpenAi={vi.fn()} onToggleSearch={vi.fn()} />)

    const musicButton = screen.getByRole('button', { name: '音乐，正在播放' })
    expect(musicButton).toHaveAttribute('title', '音乐')
    expect(musicButton).toHaveAttribute('data-active', 'true')
    expect(screen.getByRole('button', { name: 'AI 助理' })).toHaveAttribute('title', 'AI 助理')
    expect(screen.getByRole('button', { name: '搜索' })).toHaveAttribute('title', '搜索')
  })

  it('routes each launcher action to its explicit handler', async () => {
    const user = userEvent.setup()
    const toggleDisplayMode = vi.fn()
    const onOpenAi = vi.fn()
    const onToggleSearch = vi.fn()

    render(
      <AppGrid
        toggleDisplayMode={toggleDisplayMode}
        onOpenAi={onOpenAi}
        onToggleSearch={onToggleSearch}
      />
    )

    await user.click(screen.getByRole('button', { name: '音乐，正在播放' }))
    await user.click(screen.getByRole('button', { name: 'AI 助理' }))
    await user.click(screen.getByRole('button', { name: '搜索' }))

    expect(toggleDisplayMode).toHaveBeenCalledWith('music')
    expect(onOpenAi).toHaveBeenCalledTimes(1)
    expect(onToggleSearch).toHaveBeenCalledTimes(1)
  })
})
