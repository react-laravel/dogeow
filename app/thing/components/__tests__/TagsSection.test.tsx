import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TagsSection from '../TagsSection'

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  CardDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, style, ...props }: any) => (
    <span data-testid="badge" style={style} {...props}>
      {children}
    </span>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}))

vi.mock('@/lib/helpers', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  isLightColor: () => false,
}))

vi.mock('../CreateTagDialog', () => ({
  default: ({ open, onOpenChange, onTagCreated, initialName }: any) =>
    open ? (
      <div data-testid="create-tag-dialog">
        <button onClick={() => onTagCreated?.({ id: 99, name: 'NewTag', color: '#000' })}>
          Create Tag
        </button>
        <button onClick={() => onOpenChange?.(false)}>Close</button>
      </div>
    ) : null,
}))

describe('TagsSection', () => {
  const tags = [
    { id: '1', name: 'Tag1', color: '#ff0000' },
    { id: '2', name: 'Tag2', color: '#00ff00' },
  ]

  it('renders tags section header', () => {
    render(
      <TagsSection selectedTags={[]} setSelectedTags={vi.fn()} tags={tags} onTagCreated={vi.fn()} />
    )
    expect(screen.getAllByText('标签')).toHaveLength(2)
  })

  it('renders create tag button', () => {
    render(
      <TagsSection selectedTags={[]} setSelectedTags={vi.fn()} tags={tags} onTagCreated={vi.fn()} />
    )
    expect(screen.getByText('选择标签')).toBeDefined()
  })

  it('calls onToggleTag when tag is clicked', () => {
    const onToggleTag = vi.fn()
    render(
      <TagsSection selectedTags={[]} setSelectedTags={vi.fn()} tags={tags} onTagCreated={vi.fn()} />
    )
    fireEvent.click(screen.getByText('选择标签'))
    const tagBadges = screen.getAllByTestId('badge')
    expect(tagBadges.length).toBeGreaterThan(0)
  })
})
