import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ItemFormWrapper from '../ItemFormWrapper'

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} type={type} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/layout', () => ({
  PageContainer: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('../../ItemFormLayout', () => ({
  default: ({ children, title, onBack, footer, actionButton, autoSaving, lastSaved }: any) => (
    <div data-testid="item-form-layout">
      {title}
      {actionButton}
      {children.basicInfo}
      {children.detailInfo}
      {footer}
    </div>
  ),
}))

vi.mock('../UnifiedBasicInfoForm', () => ({
  default: () => <div data-testid="unified-basic">BasicInfoForm</div>,
}))

vi.mock('../UnifiedDetailInfoForm', () => ({
  default: () => <div data-testid="unified-detail">DetailInfoForm</div>,
}))

vi.mock('../../CreateTagDialog', () => ({
  default: ({ open, onOpenChange, onTagCreated }: any) =>
    open ? <div data-testid="create-tag-dialog">CreateTagDialog</div> : null,
}))

vi.mock('@/app/thing/stores/itemStore', () => ({
  useItemStore: () => ({
    categories: [],
    tags: [],
    fetchCategories: vi.fn(),
    fetchTags: vi.fn(),
  }),
}))

describe('ItemFormWrapper', () => {
  it('renders form layout with title', () => {
    render(<ItemFormWrapper mode="create" title="Create Item" onSubmit={vi.fn()} />)
    expect(screen.getByText('Create Item')).toBeDefined()
  })

  it('renders basic and detail info forms', () => {
    render(<ItemFormWrapper mode="create" title="Create Item" onSubmit={vi.fn()} />)
    expect(screen.getByTestId('unified-basic')).toBeDefined()
    expect(screen.getByTestId('unified-detail')).toBeDefined()
  })

  it('renders create button in footer for create mode', () => {
    render(<ItemFormWrapper mode="create" title="Create Item" onSubmit={vi.fn()} />)
    expect(screen.getByText('创建物品')).toBeDefined()
  })

  it('renders with autoSaving status', () => {
    render(
      <ItemFormWrapper
        mode="create"
        title="Create Item"
        onSubmit={vi.fn()}
        autoSaving
        lastSaved={new Date()}
      />
    )
    expect(screen.getByTestId('item-form-layout')).toBeDefined()
  })
})
