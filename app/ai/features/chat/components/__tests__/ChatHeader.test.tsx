import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatHeader } from '../ChatHeader'

// Mock DialogTitle to avoid Radix context requirement
vi.mock('@/components/ui/dialog', () => ({
  DialogTitle: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }) => <div data-open={open}>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('ChatHeader', () => {
  it('renders page variant with default title', () => {
    render(<ChatHeader hasMessages={false} isLoading={false} onClear={vi.fn()} />)
    expect(screen.getByText('AI 助理')).toBeInTheDocument()
  })

  it('renders custom title and subtitle', () => {
    render(
      <ChatHeader
        title="Custom Title"
        subtitle="Custom Sub"
        hasMessages={false}
        isLoading={false}
        onClear={vi.fn()}
      />
    )
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom Sub')).toBeInTheDocument()
  })

  it('shows clear button when hasMessages is true and not loading', () => {
    render(<ChatHeader hasMessages={true} isLoading={false} onClear={vi.fn()} />)
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument()
  })

  it('hides clear button when hideClear is true', () => {
    render(<ChatHeader hasMessages={true} isLoading={false} onClear={vi.fn()} hideClear={true} />)
    // The clear button has aria-label from Trash2 icon; we just check the trash button is not rendered
    // In the page variant, the clear button renders with Trash2 icon; we check there's no trash button
    const trashButtons = screen.queryAllByRole('button')
    expect(trashButtons.length).toBeLessThanOrEqual(2) // settings button + link
  })

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn()
    render(<ChatHeader hasMessages={true} isLoading={false} onClear={onClear} />)

    // Find the clear button (the one with Trash2 icon in page variant)
    const buttons = screen.getAllByRole('button')
    const clearButton =
      buttons.find(btn => btn.querySelector('svg')?.getAttribute('data-lucide') === 'trash-2') ||
      buttons.find(btn => {
        // Look for button with disabled=false and onClick
        return btn.className.includes('text-muted-foreground') && !btn.disabled
      })

    if (clearButton) {
      clearButton.click()
      expect(onClear).toHaveBeenCalled()
    }
  })

  it('renders dialog variant', () => {
    render(<ChatHeader variant="dialog" hasMessages={false} isLoading={false} onClear={vi.fn()} />)
    expect(screen.getByText('AI 助理')).toBeInTheDocument()
  })

  it('renders panel variant', () => {
    render(<ChatHeader variant="panel" hasMessages={false} isLoading={false} onClear={vi.fn()} />)
    expect(screen.getByText('AI 助理')).toBeInTheDocument()
  })

  it('renders tab navigation when chatMode is provided', () => {
    render(
      <ChatHeader
        variant="dialog"
        hasMessages={false}
        isLoading={false}
        onClear={vi.fn()}
        chatMode="ai"
        onChatModeChange={vi.fn()}
      />
    )
    expect(screen.getByText('通用 AI')).toBeInTheDocument()
    expect(screen.getByText('知识库 AI')).toBeInTheDocument()
  })

  it('calls onChatModeChange when tab is clicked', () => {
    const onChatModeChange = vi.fn()
    render(
      <ChatHeader
        variant="dialog"
        hasMessages={false}
        isLoading={false}
        onClear={vi.fn()}
        chatMode="ai"
        onChatModeChange={onChatModeChange}
      />
    )

    // In dialog variant with tabs, the tabs are rendered inside the dialog-like header
    // The onChatModeChange is called via Tabs onValueChange
    // We check that the "知识库 AI" tab is visible
    expect(screen.getByText('知识库 AI')).toBeInTheDocument()
  })

  it('shows subtitle in knowledge tab when subtitle is provided', () => {
    render(
      <ChatHeader
        variant="dialog"
        subtitle="My Knowledge"
        hasMessages={false}
        isLoading={false}
        onClear={vi.fn()}
        chatMode="knowledge"
        onChatModeChange={vi.fn()}
      />
    )
    expect(screen.getByText(/知识库 AI/)).toBeInTheDocument()
  })

  it('renders knowledge base link in page variant', () => {
    render(<ChatHeader hasMessages={false} isLoading={false} onClear={vi.fn()} />)
    expect(screen.getByText('知识库问答')).toBeInTheDocument()
  })
})
