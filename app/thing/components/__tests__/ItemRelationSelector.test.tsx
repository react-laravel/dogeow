import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ItemRelationSelector } from '../ItemRelationSelector'

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => <div data-open={open}>{children}</div>,
  DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange?.('related')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: () => null,
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea data-testid="textarea" {...props} />,
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))

describe('ItemRelationSelector', () => {
  it('renders dialog when open', () => {
    render(
      <ItemRelationSelector
        currentItemId={1}
        open={true}
        onOpenChange={vi.fn()}
        onRelationAdded={vi.fn()}
      />
    )
    expect(screen.getByText('添加物品关联')).toBeDefined()
  })

  it('renders search input', () => {
    render(
      <ItemRelationSelector
        currentItemId={1}
        open={true}
        onOpenChange={vi.fn()}
        onRelationAdded={vi.fn()}
      />
    )
    expect(screen.getByTestId('input')).toBeDefined()
  })

  it('renders relation type options', () => {
    render(
      <ItemRelationSelector
        currentItemId={1}
        open={true}
        onOpenChange={vi.fn()}
        onRelationAdded={vi.fn()}
      />
    )
    expect(screen.getByText('搜索物品')).toBeDefined()
  })
})
