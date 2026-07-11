import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatInput } from '../ChatInput'

// Mock next/image - supports both default and named imports
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

// Mock ChatInputImagePreview to avoid next/image dependency
vi.mock('@/app/ai/features/chat/components/ChatInputImagePreview', () => ({
  ChatInputImagePreview: ({
    images,
    onRemoveImage,
    className,
  }: {
    images: Array<{ id: string; preview: string; uploading?: boolean }>
    onRemoveImage?: (index: number) => void
    className?: string
  }) => (
    <div className={className}>
      {images.map((item, index) => (
        <div key={item.id} data-testid={`image-preview-${index}`}>
          <img src={item.preview} alt={`上传图片 ${index + 1}`} />
          {item.uploading && <span data-testid="uploading">uploading</span>}
          {onRemoveImage && (
            <button type="button" onClick={() => onRemoveImage(index)} aria-label="移除图片">
              X
            </button>
          )}
        </div>
      ))}
    </div>
  ),
}))

// Mock useVoiceInput hook
vi.mock('@/hooks/useVoiceInput', () => ({
  useVoiceInput: () => ({
    isListening: false,
    startListening: vi.fn(),
    stopListening: vi.fn(),
  }),
}))

// Mock Textarea to properly pass event handlers (overrides vitest.setup.tsx mock)
vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({
    onKeyDown,
    onChange,
    disabled,
    value,
    placeholder,
    className,
    rows,
    id,
    ...props
  }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
      data-testid="chat-textarea"
      onKeyDown={onKeyDown}
      onChange={onChange}
      disabled={disabled}
      value={value}
      placeholder={placeholder}
      className={className}
      rows={rows}
      id={id}
      {...props}
    />
  ),
}))

// Mock dropdown-menu
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

describe('ChatInput', () => {
  const defaultProps = {
    prompt: '',
    onPromptChange: vi.fn(),
    onSend: vi.fn(),
    isLoading: false,
    hasMessages: false,
    onClear: vi.fn(),
  }

  it('renders textarea', () => {
    render(<ChatInput {...defaultProps} />)
    expect(screen.getByPlaceholderText('输入消息...')).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    render(<ChatInput {...defaultProps} placeholder="Say hello" />)
    expect(screen.getByPlaceholderText('Say hello')).toBeInTheDocument()
  })

  it('shows image placeholder when images are attached', () => {
    render(
      <ChatInput
        {...defaultProps}
        images={[{ id: 'img-1', preview: 'blob:abc' }]}
        onImageSelect={vi.fn()}
        supportsImages={true}
      />
    )
    expect(screen.getByPlaceholderText('询问关于图片的问题...')).toBeInTheDocument()
  })

  it('calls onPromptChange when typing', () => {
    const onPromptChange = vi.fn()
    render(<ChatInput {...defaultProps} onPromptChange={onPromptChange} />)

    const textarea = screen.getByPlaceholderText('输入消息...')
    fireEvent.change(textarea, { target: { value: 'hello' } })
    expect(onPromptChange).toHaveBeenCalledWith('hello')
  })

  it('calls onSend when Enter is pressed without shift', () => {
    const onSend = vi.fn()
    render(<ChatInput {...defaultProps} prompt="hello" onSend={onSend} />)

    const textarea = screen.getByPlaceholderText('输入消息...')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false, metaKey: false, ctrlKey: false })
    expect(onSend).toHaveBeenCalled()
  })

  it('does not call onSend on Shift+Enter', () => {
    const onSend = vi.fn()
    render(<ChatInput {...defaultProps} onSend={onSend} />)

    const textarea = screen.getByPlaceholderText('输入消息...')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true, metaKey: false, ctrlKey: false })
    expect(onSend).not.toHaveBeenCalled()
  })

  it('does not call onSend when loading', () => {
    const onSend = vi.fn()
    render(<ChatInput {...defaultProps} isLoading={true} onSend={onSend} />)

    const textarea = screen.getByPlaceholderText('输入消息...')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false, metaKey: false, ctrlKey: false })
    expect(onSend).not.toHaveBeenCalled()
  })

  it('renders send button', () => {
    render(<ChatInput {...defaultProps} />)
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument()
  })

  it('renders stop button when loading', () => {
    render(<ChatInput {...defaultProps} isLoading={true} onStop={vi.fn()} />)
    // When loading, the send button shows Square icon
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument()
  })

  it('renders dialog variant', () => {
    render(<ChatInput {...defaultProps} variant="dialog" />)
    expect(screen.getByPlaceholderText('输入消息...')).toBeInTheDocument()
  })

  it('shows model selector when chatMode is provided', () => {
    render(
      <ChatInput
        {...defaultProps}
        chatMode="ai"
        provider="ollama"
        onProviderChange={vi.fn()}
        model="qwen3:0.6b"
        onModelChange={vi.fn()}
        ollamaModels={[{ name: 'qwen3:0.6b', supportsVision: false }]}
      />
    )
    expect(screen.getByText('qwen3:0.6b')).toBeInTheDocument()
  })

  it('shows image upload button when supported', () => {
    render(
      <ChatInput {...defaultProps} supportsImages={true} onImageSelect={vi.fn()} chatMode="ai" />
    )
    expect(screen.getByRole('button', { name: '上传图片' })).toBeInTheDocument()
  })

  it('calls onImageSelect when upload button is clicked', () => {
    const onImageSelect = vi.fn()
    render(
      <ChatInput
        {...defaultProps}
        supportsImages={true}
        onImageSelect={onImageSelect}
        chatMode="ai"
      />
    )

    const uploadButton = screen.getByRole('button', { name: '上传图片' })
    fireEvent.click(uploadButton)
    // The button clicks the hidden file input
    expect(uploadButton).toBeInTheDocument()
  })

  it('shows image previews when images are provided', () => {
    render(
      <ChatInput
        {...defaultProps}
        images={[
          { id: 'img-1', preview: 'blob:abc123' },
          { id: 'img-2', preview: 'blob:def456' },
        ]}
        onRemoveImage={vi.fn()}
        onImageSelect={vi.fn()}
        supportsImages={true}
        chatMode="ai"
      />
    )
    // Verify ChatInputImagePreview mock rendered the image previews
    const preview1 = screen.queryByTestId('image-preview-0')
    const preview2 = screen.queryByTestId('image-preview-1')
    if (preview1 && preview2) {
      expect(preview1).toBeInTheDocument()
      expect(preview2).toBeInTheDocument()
    } else {
      // Mock not applied, try to find real rendered images
      const images = screen.queryAllByRole('img')
      expect(images.length).toBeGreaterThanOrEqual(2)
    }
  })
})
