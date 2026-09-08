import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BottomNav } from '../BottomNav'

vi.mock('next/navigation', () => ({ usePathname: () => '/files' }))

describe('BottomNav', () => {
  it('renders disabled destinations without an actionable href', () => {
    const onClick = vi.fn()
    render(
      <BottomNav
        items={[
          { href: '/files', label: '文件', icon: null },
          { href: '/disabled', label: '不可用', icon: null, disabled: true },
          { href: '/action', label: '不可用操作', icon: null, disabled: true, onClick },
        ]}
      />
    )
    for (const name of ['不可用', '不可用操作']) {
      const item = screen.getByRole('link', { name })
      expect(item).toHaveAttribute('aria-disabled', 'true')
      expect(item).not.toHaveAttribute('href')
      expect(item).not.toHaveAttribute('tabindex', '0')
      fireEvent.click(item)
      fireEvent.keyDown(item, { key: 'Enter' })
    }
    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: '文件' })).toHaveAttribute('aria-current', 'page')
  })
})
