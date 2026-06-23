import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type MarkdownPreviewComponent from '../markdown-preview'

let MarkdownPreview: typeof MarkdownPreviewComponent

// Mock Novel components
vi.mock('novel', () => ({
  EditorContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="editor-content">
      {children}
    </div>
  ),
  EditorRoot: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="editor-root">{children}</div>
  ),
  StarterKit: {
    configure: vi.fn(() => ({})),
  },
}))

// Mock tiptap-markdown
vi.mock('tiptap-markdown', () => ({
  Markdown: {
    configure: vi.fn(() => ({})),
  },
}))

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => ({
    commands: {
      setContent: vi.fn(),
    },
    getJSON: vi.fn(() => ({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'parsed markdown' }],
        },
      ],
    })),
  })),
}))

// Mock class-variance-authority
vi.mock('class-variance-authority', () => ({
  cx: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}))

// Mock highlight.js
vi.mock('highlight.js', () => ({
  default: {
    highlightElement: vi.fn(),
  },
}))

describe('MarkdownPreview', () => {
  beforeAll(async () => {
    MarkdownPreview = (await import('../markdown-preview')).default
  })

  it('should render markdown content', () => {
    const markdownContent = '# Hello World\n\nThis is a test.'

    render(<MarkdownPreview content={markdownContent} />)

    expect(screen.getByTestId('editor-root')).toBeInTheDocument()
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })

  it('should handle empty content', () => {
    const { container } = render(<MarkdownPreview content="" />)

    expect(container.firstChild).toBeNull()
  })

  it('should apply custom className', () => {
    const markdownContent = '# Test'
    const customClass = 'custom-class'

    render(<MarkdownPreview content={markdownContent} className={customClass} />)

    const wrapper = screen.getByTestId('editor-content').parentElement
    expect(wrapper).toHaveClass(customClass)
  })
})
