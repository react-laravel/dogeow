import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatMessageList } from '../ChatMessageList'
import type { ChatMessage } from '../../types'

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

// Mock SimpleMarkdown to avoid unified/remark dependency issues
vi.mock('../SimpleMarkdown', () => ({
  SimpleMarkdown: ({ content }: { content: string }) => <span>{content}</span>,
}))

// Mock ChatLoadingIndicator to avoid dependency on SimpleMarkdown
vi.mock('@/app/ai/features/chat/components/ChatLoadingIndicator', () => ({
  ChatLoadingIndicator: ({ completion }: { completion?: string }) => (
    <div data-testid="loading-indicator">
      {completion ? <span>{completion}</span> : <span>正在思考...</span>}
      {completion && <span>正在输入...</span>}
    </div>
  ),
}))

const createMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  role: 'user',
  content: 'Hello',
  ...overrides,
})

describe('ChatMessageList', () => {
  it('renders empty state when no messages and not loading', () => {
    render(<ChatMessageList messages={[]} isLoading={false} />)
    expect(screen.getByText('输入问题开始与我对话')).toBeInTheDocument()
  })

  it('renders messages when available', () => {
    const messages = [
      createMessage({ role: 'user', content: 'Hello' }),
      createMessage({ role: 'assistant', content: 'Hi there' }),
    ]
    render(<ChatMessageList messages={messages} isLoading={false} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hi there')).toBeInTheDocument()
  })

  it('filters out system messages', () => {
    const messages = [
      createMessage({ role: 'system', content: 'You are a helpful assistant' }),
      createMessage({ role: 'user', content: 'Hello' }),
    ]
    render(<ChatMessageList messages={messages} isLoading={false} />)
    expect(screen.queryByText('You are a helpful assistant')).not.toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('shows loading indicator when loading', () => {
    render(<ChatMessageList messages={[]} isLoading={true} />)
    expect(screen.getByText('正在思考...')).toBeInTheDocument()
  })

  it('shows completion text when loading with completion', () => {
    render(<ChatMessageList messages={[]} isLoading={true} completion="partial" />)
    expect(screen.getByText('partial')).toBeInTheDocument()
    expect(screen.getByText('正在输入...')).toBeInTheDocument()
  })

  it('does not show last assistant message when loading and completion is present', () => {
    const messages = [
      createMessage({ role: 'user', content: 'Hello' }),
      createMessage({ role: 'assistant', content: 'Partial answer' }),
    ]
    render(<ChatMessageList messages={messages} isLoading={true} completion="more" />)
    // The last assistant message should be hidden, replaced by ChatLoadingIndicator
    expect(screen.queryByText('Partial answer')).not.toBeInTheDocument()
    expect(screen.getByText('more')).toBeInTheDocument()
  })

  it('shows last assistant message when not loading', () => {
    const messages = [
      createMessage({ role: 'user', content: 'Hello' }),
      createMessage({ role: 'assistant', content: 'Full answer' }),
    ]
    render(<ChatMessageList messages={messages} isLoading={false} />)
    expect(screen.getByText('Full answer')).toBeInTheDocument()
  })

  it('renders dialog variant', () => {
    const messages = [createMessage({ role: 'user', content: 'Hello' })]
    render(<ChatMessageList messages={messages} isLoading={false} variant="dialog" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders page variant', () => {
    const messages = [createMessage({ role: 'user', content: 'Hello' })]
    render(<ChatMessageList messages={messages} isLoading={false} variant="page" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('shows empty state in dialog variant', () => {
    render(<ChatMessageList messages={[]} isLoading={false} variant="dialog" />)
    expect(screen.getByText('输入问题开始与我对话')).toBeInTheDocument()
  })
})
