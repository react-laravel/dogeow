import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryTable } from '../CategoryTable'
import type { Category, CategoryWithChildren } from '../../types'

// Mock child components
vi.mock('../CategoryParentRow', () => ({
  CategoryParentRow: ({ category, isExpanded, onToggle, onDelete }: any) => (
    <div data-testid={`parent-${category.id}`}>
      <span data-testid="parent-name">{category.name}</span>
      <span data-testid="parent-expanded">{isExpanded ? 'yes' : 'no'}</span>
      <button onClick={onToggle}>Toggle</button>
      <button onClick={onDelete}>Delete</button>
    </div>
  ),
}))

vi.mock('../CategoryChildRow', () => ({
  CategoryChildRow: ({ category, onDelete }: any) => (
    <div data-testid={`child-${category.id}`}>
      <span data-testid="child-name">{category.name}</span>
      <button onClick={onDelete}>Delete</button>
    </div>
  ),
}))

vi.mock('../CreateChildRow', () => ({
  CreateChildRow: ({ name }: any) => (
    <div data-testid="create-child-row">
      <span data-testid="new-child-name">{name}</span>
    </div>
  ),
}))

vi.mock('../EmptyState', () => ({
  default: () => <div data-testid="empty-state">暂无分类</div>,
}))

vi.mock('../UncategorizedRow', () => ({
  default: ({ count, isEditMode }: any) => (
    <div data-testid="uncategorized-row">
      <span data-testid="uncategorized-count">{count}</span>
      <span data-testid="uncategorized-edit">{isEditMode ? 'edit' : 'view'}</span>
    </div>
  ),
}))

// Mock buildCategoryTree
vi.mock('../../utils/buildCategoryTree', () => ({
  buildCategoryTree: (categories: any[]) => categories,
}))

const mockCategories: Category[] = [
  { id: 1, name: 'Parent 1', parent_id: null, items_count: 5 },
  { id: 2, name: 'Child 1', parent_id: 1, items_count: 3 },
]

const mockCategoryTree: CategoryWithChildren[] = [
  {
    id: 1,
    name: 'Parent 1',
    parent_id: null,
    items_count: 5,
    children: [{ id: 2, name: 'Child 1', parent_id: 1, items_count: 3 }],
  },
]

const defaultProps = {
  categories: mockCategories,
  categoryTree: mockCategoryTree,
  uncategorizedCount: 2,
  isEditMode: true,
  expandedCategories: new Set<number>(),
  isEditing: (id: number) => false,
  editingValue: '',
  loading: false,
  creatingChildFor: null,
  newChildName: '',
  creatingChild: false,
  onToggleCategory: vi.fn(),
  onStartEdit: vi.fn(),
  onSaveEdit: vi.fn(),
  onCancelEdit: vi.fn(),
  onConfirmDelete: vi.fn(),
  onStartCreateChild: vi.fn(),
  onCancelCreateChild: vi.fn(),
  onSaveChild: vi.fn(),
  onChildKeyDown: vi.fn(),
  onValueChange: vi.fn(),
  onNewChildNameChange: vi.fn(),
  onEditKeyDown: vi.fn(),
  inputRef: { current: null },
}

describe('CategoryTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render empty state when categories is empty', () => {
    render(<CategoryTable {...defaultProps} categories={[]} categoryTree={[]} />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('should render uncategorized row', () => {
    render(<CategoryTable {...defaultProps} />)
    expect(screen.getByTestId('uncategorized-row')).toBeInTheDocument()
    expect(screen.getByTestId('uncategorized-count').textContent).toBe('2')
  })

  it('should render parent category rows', () => {
    render(<CategoryTable {...defaultProps} />)
    expect(screen.getByTestId('parent-1')).toBeInTheDocument()
    expect(screen.getByTestId('parent-name').textContent).toBe('Parent 1')
  })

  it('should render child category rows when parent is expanded', () => {
    render(<CategoryTable {...defaultProps} expandedCategories={new Set([1])} />)
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
    expect(screen.getByTestId('child-name').textContent).toBe('Child 1')
  })

  it('should render create child row when creatingChildFor matches', () => {
    render(
      <CategoryTable
        {...defaultProps}
        creatingChildFor={1}
        expandedCategories={new Set([1])}
        newChildName="New Child"
      />
    )
    expect(screen.getByTestId('create-child-row')).toBeInTheDocument()
    expect(screen.getByTestId('new-child-name').textContent).toBe('New Child')
  })

  it('should render edit mode column headers', () => {
    render(<CategoryTable {...defaultProps} isEditMode={true} />)
    // The table header should show "分类操作" in edit mode
    expect(screen.getByText('分类操作')).toBeInTheDocument()
  })

  it('should render view mode column headers', () => {
    render(<CategoryTable {...defaultProps} isEditMode={false} />)
    // The table header should show "物品数量" in view mode
    expect(screen.getByText('物品数量')).toBeInTheDocument()
  })
})
