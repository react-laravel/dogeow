import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatInput } from '../ChatInput'

// Mock dependencies
vi.mock('@/hooks/useVoiceInput', () => ({
  useVoiceInput: vi.fn(() => ({
    isListening: false,
    startListening: vi.fn(),
    stopListening: vi.fn(),
  })),
}))

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick }) => (
    <button onClick={onClick} data-testid="button">{children}</button>
  )),
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: vi.fn(({ value, onChange, onKeyDown }) => (
    <textarea
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      data-testid="textarea"
    />
  )),
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: vi.fn(({ children }) => <div data-testid="dropdown">{children}</div>),
  DropdownMenuContent: vi.fn(({ children }) => <div>{children}</div>),
  DropdownMenuRadioGroup: vi.fn(({ children }) => <div>{children}</div>),
  DropdownMenuRadioItem: vi.fn(({ children }) => <div>{children}</div>),
  DropdownMenuTrigger: vi.fn(({ children }) => <div>{children}</div>),
}))

vi.mock('@/lib/helpers', () => ({
  cn: vi.fn((...args) => args.filter(Boolean).join(' ')),
}))

vi.mock('./ChatInputImagePreview', () => ({
  ChatInputImagePreview: vi.fn(() => <div data-testid="image-preview" />),
}))

vi.mock('./GenerationModal', () => ({
  GenerationModal: vi.fn(() => <div data-testid="generation-modal" />),
}))

vi.mock('./ChatInputModelSelector', () => ({
  ProviderSelector: vi.fn(() => <div data-testid="provider-selector" />),
  OllamaModelSelector: vi.fn(() => <div data-testid="ollama-selector" />),
  ZhipuaiModelSelector: vi.fn(() => <div data-testid="zhipuai-selector" />),
}))

vi.mock('lucide-react', () => ({
  Send: vi.fn(() => <span data-testid="send-icon" />),
  Square: vi.fn(() => <span data-testid="square-icon" />),
  Bot: vi.fn(() => <span data-testid="bot-icon" />),
  BookOpen: vi.fn(() => <span data-testid="book-icon" />),
  ImagePlus: vi.fn(() => <span data-testid="image-plus-icon" />),
  Volume2: vi.fn(() => <span data-testid="volume-icon" />),
  VolumeX: vi.fn(() => <span data-testid="volume-x-icon" />),
  Wand2: vi.fn(() => <span data-testid="wand-icon" />),
  Video: vi.fn(() => <span data-testid="video-icon" />),
  Music: vi.fn(() => <span data-testid="music-icon" />),
  Mic: vi.fn(() => <span data-testid="mic-icon" />),
  MicOff: vi.fn(() => <span data-testid="mic-off-icon" />),
  History: vi.fn(() => <span data-testid="history-icon" />),
}))

describe('ChatInput', () => {
  const defaultProps = {
    prompt: '',
    onPromptChange: vi.fn(),
    onSend: vi.fn(),
    isLoading: false,
    variant: 'page' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the textarea', () => {
      render(<ChatInput {...defaultProps} />)
      expect(screen.getByTestId('textarea')).toBeInTheDocument()
    })

    it('should render send button', () => {
      render(<ChatInput {...defaultProps} />)
      expect(screen.getByTestId('send-icon')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onPromptChange when typing', () => {
      render(<ChatInput {...defaultProps} />)
      const textarea = screen.getByTestId('textarea')
      fireEvent.change(textarea, { target: { value: 'Hello' } })
      expect(defaultProps.onPromptChange).toHaveBeenCalledWith('Hello')
    })

    it('should call onSend when pressing Enter', () => {
      render(<ChatInput {...defaultProps} prompt="Hello" />)
      const textarea = screen.getByTestId('textarea')
      fireEvent.keyDown(textarea, { key: 'Enter' })
      expect(defaultProps.onSend).toHaveBeenCalled()
    })

    it('should not send when loading', () => {
      render(<ChatInput {...defaultProps} prompt="Hello" isLoading={true} />)
      const textarea = screen.getByTestId('textarea')
      fireEvent.keyDown(textarea, { key: 'Enter' })
      expect(defaultProps.onSend).not.toHaveBeenCalled()
    })
  })

  describe('Props', () => {
    it('should display prompt value', () => {
      render(<ChatInput {...defaultProps} prompt="Test prompt" />)
      expect(screen.getByTestId('textarea')).toHaveValue('Test prompt')
    })

    it('should render with dialog variant', () => {
      render(<ChatInput {...defaultProps} variant="dialog" />)
      expect(screen.getByTestId('textarea')).toBeInTheDocument()
    })

    it('should render with page variant', () => {
      render(<ChatInput {...defaultProps} variant="page" />)
      expect(screen.getByTestId('textarea')).toBeInTheDocument()
    })
  })

  describe('Button States', () => {
    it('should disable send button when cannot send', () => {
      render(<ChatInput {...defaultProps} />)
      const button = screen.getByTestId('button')
      expect(button).toBeDisabled()
    })

    it('should show square icon when loading', () => {
      render(<ChatInput {...defaultProps} isLoading={true} />)
      expect(screen.getByTestId('square-icon')).toBeInTheDocument()
    })
  })

  describe('Image Upload', () => {
    it('should render image upload button when supported', () => {
      render(
        <ChatInput
          {...defaultProps}
          chatMode="ai"
          supportsImages={true}
          onImageSelect={vi.fn()}
        />
      )
      expect(screen.getByTestId('image-plus-icon')).toBeInTheDocument()
    })
  })

  describe('Model Selector', () => {
    it('should render model selector when chatMode is provided', () => {
      render(
        <ChatInput
          {...defaultProps}
          chatMode="ai"
          provider="ollama"
          onProviderChange={vi.fn()}
          model="llama2"
          onModelChange={vi.fn()}
        />
      )
      expect(screen.getByTestId('provider-selector')).toBeInTheDocument()
    })
  })

  describe('Generation Buttons', () => {
    it('should render generation buttons when callbacks provided', () => {
      render(
        <ChatInput
          {...defaultProps}
          chatMode="ai"
          onGenerateImage={vi.fn()}
          onGenerateVideo={vi.fn()}
          onGenerateMusic={vi.fn()}
        />
      )
      expect(screen.getByTestId('wand-icon')).toBeInTheDocument()
      expect(screen.getByTestId('video-icon')).toBeInTheDocument()
      expect(screen.getByTestId('music-icon')).toBeInTheDocument()
    })
  })

  describe('TTS Toggle', () => {
    it('should render TTS toggle when enabled', () => {
      render(
        <ChatInput
          {...defaultProps}
          chatMode="ai"
          ttsEnabled={true}
          onTtsEnabledChange={vi.fn()}
        />
      )
      expect(screen.getByTestId('volume-icon')).toBeInTheDocument()
    })

    it('should render TTS toggle off when disabled', () => {
      render(
        <ChatInput
          {...defaultProps}
          chatMode="ai"
          ttsEnabled={false}
          onTtsEnabledChange={vi.fn()}
        />
      )
      expect(screen.getByTestId('volume-x-icon')).toBeInTheDocument()
    })
  })
})