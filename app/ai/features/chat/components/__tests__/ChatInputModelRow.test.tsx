import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatInputModelRow } from '../ChatInputModelRow'

// Mock dropdown-menu to avoid Radix UI portal issues in jsdom
vi.mock('@/components/ui/dropdown-menu', () => {
  const DropdownMenuContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
  }>({ open: false, setOpen: () => {} })

  const DropdownMenu = ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }) => {
    const [internalOpen, setInternalOpen] = React.useState(open ?? false)
    const setOpen = (newOpen: boolean) => {
      setInternalOpen(newOpen)
      onOpenChange?.(newOpen)
    }
    return (
      <DropdownMenuContext.Provider value={{ open: internalOpen, setOpen }}>
        <div data-testid="dropdown-menu">{children}</div>
      </DropdownMenuContext.Provider>
    )
  }

  const DropdownMenuTrigger = ({
    children,
    asChild,
    ...props
  }: React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) => {
    const { setOpen } = React.useContext(DropdownMenuContext)
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(
        children as React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>,
        {
          ...props,
          onClick: (event: React.MouseEvent) => {
            setOpen(true)
            ;(children as React.ReactElement).props.onClick?.(event)
          },
        } as React.ButtonHTMLAttributes<HTMLButtonElement>
      )
    }
    return (
      <button {...props} onClick={() => setOpen(true)} data-testid="dropdown-trigger">
        {children}
      </button>
    )
  }

  const DropdownMenuContent = ({
    children,
    align,
    className,
  }: React.HTMLAttributes<HTMLDivElement> & { align?: string }) => {
    const { open } = React.useContext(DropdownMenuContext)
    if (!open) return null
    return (
      <div
        data-testid="dropdown-content"
        className={className}
        style={{
          position: 'absolute',
          zIndex: 9999,
          background: 'white',
          border: '1px solid #ccc',
          padding: '4px',
        }}
      >
        {children}
      </div>
    )
  }

  const DropdownMenuLabel = ({ children, className }: React.HTMLAttributes<HTMLLabelElement>) => (
    <div className={className} data-testid="dropdown-label">
      {children}
    </div>
  )

  const DropdownMenuRadioGroup = ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode
    value?: string
    onValueChange?: (v: string) => void
  }) => (
    <div data-testid="radio-group" data-value={value}>
      {children}
    </div>
  )

  const DropdownMenuRadioItem = ({
    children,
    value,
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { value: string }) => (
    <div
      role="radio"
      aria-checked={false}
      data-value={value}
      className={className}
      {...props}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </div>
  )

  const DropdownMenuSeparator = () => <hr data-testid="dropdown-separator" />

  return {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
  }
})

describe('ChatInputModelRow', () => {
  const defaultProps = {
    chatMode: 'ai' as const,
    provider: 'ollama' as const,
    onProviderChange: vi.fn(),
    model: 'qwen3:0.6b',
    onModelChange: vi.fn(),
    ollamaModels: [{ name: 'qwen3:0.6b', supportsVision: false }],
    isLoading: false,
    isLoadingOllamaModels: false,
  }

  it('renders provider selector in AI mode', () => {
    render(<ChatInputModelRow {...defaultProps} />)
    expect(screen.getByText('Ollama')).toBeInTheDocument()
  })

  it('renders ollama model selector in AI mode', () => {
    render(<ChatInputModelRow {...defaultProps} />)
    expect(screen.getByText('qwen3:0.6b')).toBeInTheDocument()
  })

  it('renders nothing when chatMode is ai but provider is not provided', () => {
    const { container } = render(
      <ChatInputModelRow {...defaultProps} provider={undefined} onProviderChange={undefined} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders knowledge mode with Ollama label', () => {
    render(
      <ChatInputModelRow
        {...defaultProps}
        chatMode="knowledge"
        provider={undefined}
        onProviderChange={undefined}
      />
    )
    expect(screen.getByText('Ollama')).toBeInTheDocument()
  })

  it('renders nothing when chatMode is knowledge but onModelChange is not provided', () => {
    const { container } = render(
      <ChatInputModelRow {...defaultProps} chatMode="knowledge" onModelChange={undefined} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders codex model selector when provider is codex', () => {
    render(
      <ChatInputModelRow {...defaultProps} provider="codex" model="gpt-5.5" ollamaModels={[]} />
    )
    expect(screen.getByText('GPT-5.5')).toBeInTheDocument()
  })

  it('renders codex reasoning effort selector when provided', () => {
    render(
      <ChatInputModelRow
        {...defaultProps}
        provider="codex"
        model="gpt-5.5"
        ollamaModels={[]}
        codexReasoningEffort="high"
        onCodexReasoningEffortChange={vi.fn()}
      />
    )
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('does not render codex reasoning effort selector when not provided', () => {
    const { container } = render(
      <ChatInputModelRow {...defaultProps} provider="codex" model="gpt-5.5" ollamaModels={[]} />
    )
    // Should not have the effort selector
    expect(screen.queryByText('复杂')).not.toBeInTheDocument()
  })

  it('renders zhipuai model selector', () => {
    render(
      <ChatInputModelRow {...defaultProps} provider="zhipuai" model="glm-4.7" ollamaModels={[]} />
    )
    expect(screen.getByText('GLM-4.7')).toBeInTheDocument()
  })
})
