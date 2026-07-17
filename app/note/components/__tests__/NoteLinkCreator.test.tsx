import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteLinkCreator from '../NoteLinkCreator'

// Mock Combobox
vi.mock('@/components/ui/combobox', () => ({
  Combobox: ({
    options,
    value,
    onChange,
    placeholder,
    searchText,
    emptyText,
  }: {
    options: { value: string; label: string }[]
    value: string
    onChange: (value: string) => void
    placeholder: string
    searchText: string
    emptyText: string
  }) => (
    <div data-testid="combobox">
      <input
        data-testid="combobox-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <div data-testid="combobox-options">
        {options.map(opt => (
          <div
            key={opt.value}
            data-testid={`option-${opt.value}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  ),
}))

// Mock API
const mockCreateLink = vi.fn()
vi.mock('@/lib/api/wiki', () => ({
  createLink: (...args: unknown[]) => mockCreateLink(...args),
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

describe('NoteLinkCreator', () => {
  const defaultProps = {
    nodes: [
      { id: 1, title: 'Node A', slug: 'node-a', tags: [], summary: '' },
      { id: 2, title: 'Node B', slug: 'node-b', tags: [], summary: '' },
      { id: 3, title: 'Node C', slug: 'node-c', tags: [], summary: '' },
    ],
    open: true,
    onOpenChange: vi.fn(),
    onSuccess: vi.fn(),
    sourceNodeId: undefined,
    onSelectTargetFromGraph: undefined,
    onCancelSelectFromGraph: undefined,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateLink.mockResolvedValue({})
  })

  it('should render dialog with title', () => {
    render(<NoteLinkCreator {...defaultProps} />)

    expect(screen.getByRole('heading', { name: '创建链接' })).toBeInTheDocument()
  })

  it('should render source node selector', () => {
    render(<NoteLinkCreator {...defaultProps} />)

    expect(screen.getByPlaceholderText('请选择源节点')).toBeInTheDocument()
  })

  it('should render target node selector', () => {
    render(<NoteLinkCreator {...defaultProps} />)

    expect(screen.getByPlaceholderText('请选择目标节点')).toBeInTheDocument()
  })

  it('should render link type input', () => {
    render(<NoteLinkCreator {...defaultProps} />)

    expect(screen.getByPlaceholderText('例如：相关、依赖、包含')).toBeInTheDocument()
  })

  it('should show source node as read-only when sourceNodeId is provided', () => {
    render(<NoteLinkCreator {...defaultProps} sourceNodeId={1} />)

    expect(screen.getByText('Node A')).toBeInTheDocument()
    // Should not show combobox for source when sourceNodeId is provided
    expect(screen.queryByPlaceholderText('请选择源节点')).not.toBeInTheDocument()
  })

  it('should show create button', () => {
    render(<NoteLinkCreator {...defaultProps} />)

    expect(screen.getByRole('button', { name: /创建链接/ })).toBeInTheDocument()
  })

  it('should show cancel button', () => {
    render(<NoteLinkCreator {...defaultProps} />)

    expect(screen.getByText('取消')).toBeInTheDocument()
  })

  it('should keep create button disabled without source and target', async () => {
    render(<NoteLinkCreator {...defaultProps} />)

    const createButton = screen.getByRole('button', { name: /创建链接/ })
    await userEvent.click(createButton)

    expect(createButton).toBeDisabled()
    expect(screen.queryByText('请选择源节点和目标节点')).not.toBeInTheDocument()
  })

  it('should call onOpenChange with false when dialog closes', async () => {
    const onOpenChange = vi.fn()
    render(<NoteLinkCreator {...defaultProps} onOpenChange={onOpenChange} />)

    const closeButton = screen.getByLabelText('关闭')
    await userEvent.click(closeButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should show graph selection button', () => {
    render(<NoteLinkCreator {...defaultProps} />)

    expect(screen.getByTitle('从图谱中选择节点')).toBeInTheDocument()
  })

  it('should call onOpenChange with false when clicking graph selection button', async () => {
    const onOpenChange = vi.fn()
    render(<NoteLinkCreator {...defaultProps} onOpenChange={onOpenChange} />)

    const graphButton = screen.getByTitle('从图谱中选择节点')
    await userEvent.click(graphButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should filter out source node from target options', () => {
    render(<NoteLinkCreator {...defaultProps} sourceNodeId={1} />)

    // Node A (id=1) should not appear as target option
    expect(screen.queryByTestId('option-1')).not.toBeInTheDocument()
    // Node B and C should still be available
    expect(screen.getByTestId('option-2')).toBeInTheDocument()
    expect(screen.getByTestId('option-3')).toBeInTheDocument()
  })

  it('should disable create button when source or target is missing', () => {
    render(<NoteLinkCreator {...defaultProps} />)

    const createButton = screen.getByRole('button', { name: /创建链接/ })
    expect(createButton).toBeDisabled()
  })
})
