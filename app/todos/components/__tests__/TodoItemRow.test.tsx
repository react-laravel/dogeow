import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TodoItemRow } from '../TodoItemRow'
import type { TodoTask } from '../types'

// Mock @dnd-kit/sortable
const mockSetNodeRef = vi.fn()
const mockUseSortable = vi.fn(() => ({
  attributes: { role: 'button' },
  listeners: { onPointerDown: vi.fn() },
  setNodeRef: mockSetNodeRef,
  transform: null,
  transition: undefined,
  isDragging: false,
}))

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: (...args: unknown[]) => mockUseSortable(...args),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: (transform: unknown) => JSON.stringify(transform),
    },
  },
}))

const createTask = (overrides: Partial<TodoTask> = {}): TodoTask => ({
  id: 1,
  title: 'Test Todo',
  is_completed: false,
  sort_order: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('TodoItemRow', () => {
  const defaultProps = {
    task: createTask(),
    isCompleted: false,
    onToggle: vi.fn(),
    onTitleBlur: vi.fn(),
    isEditing: false,
    onStartEdit: vi.fn(),
    editTitle: '',
    onEditTitleChange: vi.fn(),
  }

  it('renders task title', () => {
    render(<TodoItemRow {...defaultProps} />)
    expect(screen.getByText('Test Todo')).toBeTruthy()
  })

  it('renders "未命名" when title is empty', () => {
    render(<TodoItemRow {...defaultProps} task={createTask({ title: '' })} />)
    expect(screen.getByText('未命名')).toBeTruthy()
  })

  it('calls onToggle when checkbox button is clicked', () => {
    const onToggle = vi.fn()
    render(<TodoItemRow {...defaultProps} onToggle={onToggle} />)

    const toggleBtn = screen.getByRole('button', { name: '标记完成' })
    fireEvent.click(toggleBtn)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('shows completed state with Check icon and line-through', () => {
    render(<TodoItemRow {...defaultProps} isCompleted={true} />)

    expect(screen.getByRole('button', { name: '标记未完成' })).toBeTruthy()
    const titleBtn = screen.getByText('Test Todo')
    expect(titleBtn.className).toContain('line-through')
  })

  it('calls onStartEdit when clicking the title in view mode', () => {
    const onStartEdit = vi.fn()
    render(<TodoItemRow {...defaultProps} onStartEdit={onStartEdit} />)

    fireEvent.click(screen.getByText('Test Todo'))
    expect(onStartEdit).toHaveBeenCalledTimes(1)
  })

  it('renders input in edit mode', () => {
    render(<TodoItemRow {...defaultProps} isEditing={true} editTitle="Editing..." />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('Editing...')
  })

  it('calls onEditTitleChange when typing in edit mode', () => {
    const onEditTitleChange = vi.fn()
    render(
      <TodoItemRow
        {...defaultProps}
        isEditing={true}
        editTitle=""
        onEditTitleChange={onEditTitleChange}
      />
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'new title' } })
    expect(onEditTitleChange).toHaveBeenCalledWith('new title')
  })

  it('calls onTitleBlur when input loses focus', () => {
    const onTitleBlur = vi.fn()
    render(
      <TodoItemRow {...defaultProps} isEditing={true} editTitle="test" onTitleBlur={onTitleBlur} />
    )

    const input = screen.getByRole('textbox')
    fireEvent.blur(input)
    expect(onTitleBlur).toHaveBeenCalledTimes(1)
  })

  it('calls onTitleBlur when Enter is pressed in edit mode', () => {
    const onTitleBlur = vi.fn()
    render(
      <TodoItemRow {...defaultProps} isEditing={true} editTitle="test" onTitleBlur={onTitleBlur} />
    )

    const input = screen.getByRole('textbox')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onTitleBlur).toHaveBeenCalledTimes(1)
  })

  it('renders drag handle button', () => {
    render(<TodoItemRow {...defaultProps} />)

    const dragBtn = screen.getByRole('button', { name: '拖动排序' })
    expect(dragBtn).toBeTruthy()
  })

  it('applies dragging class when isDragging is true', () => {
    mockUseSortable.mockReturnValueOnce({
      attributes: {},
      listeners: {},
      setNodeRef: mockSetNodeRef,
      transform: null,
      transition: undefined,
      isDragging: true,
    })

    const { container } = render(<TodoItemRow {...defaultProps} />)

    const row = container.querySelector('.opacity-60')
    expect(row).toBeTruthy()
  })
})
