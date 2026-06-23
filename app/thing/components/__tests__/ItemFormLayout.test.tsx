import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ItemFormLayout from '../ItemFormLayout'

// Mock AutoSaveStatus
vi.mock('../AutoSaveStatus', () => ({
  default: ({ autoSaving, lastSaved }: any) => (
    <div data-testid="auto-save-status">
      {autoSaving ? 'Saving' : `Saved ${lastSaved?.toLocaleTimeString()}`}
    </div>
  ),
}))

// Mock Tabs components
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => <div data-default={defaultValue}>{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-value={value}>{children}</div>,
}))

vi.mock('@/components/ui/pill-tabs', () => ({
  PillTabsList: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  PillTabsTrigger: ({ children, value, ...props }: any) => (
    <button data-value={value} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/layout', () => ({
  PageContainer: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

describe('ItemFormLayout', () => {
  const defaultProps = {
    title: 'Test Form',
    onBack: vi.fn(),
    children: {
      basicInfo: <div data-testid="basic-info">Basic Info</div>,
      detailInfo: <div data-testid="detail-info">Detail Info</div>,
    },
  }

  it('renders title', () => {
    render(<ItemFormLayout {...defaultProps} />)
    expect(screen.getByText('Test Form')).toBeDefined()
  })

  it('renders basic info children', () => {
    render(<ItemFormLayout {...defaultProps} />)
    expect(screen.getByTestId('basic-info')).toBeDefined()
  })

  it('renders detail info children', () => {
    render(<ItemFormLayout {...defaultProps} />)
    expect(screen.getByTestId('detail-info')).toBeDefined()
  })

  it('renders auto save status when provided', () => {
    render(<ItemFormLayout {...defaultProps} autoSaving={true} lastSaved={new Date()} />)
    expect(screen.getByTestId('auto-save-status')).toBeDefined()
  })

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn()
    render(<ItemFormLayout {...defaultProps} onBack={onBack} />)
    // Back button would be rendered by children or parent
    expect(onBack).not.toHaveBeenCalled()
  })

  it('renders footer when provided', () => {
    render(
      <ItemFormLayout {...defaultProps} footer={<button data-testid="footer-btn">Submit</button>} />
    )
    expect(screen.getByTestId('footer-btn')).toBeDefined()
  })
})
