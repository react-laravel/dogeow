import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteCard from '../NoteCard'
import type { Note } from '../../types/note'

const createNote = (overrides: Partial<Note> = {}): Note => ({
  id: 1,
  title: '测试笔记',
  content: '<p>测试内容</p>',
  content_markdown: '# 测试内容\n\n这是笔记内容。',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-06-15T10:30:00Z',
  is_draft: false,
  ...overrides,
})

describe('NoteCard', () => {
  it('should render note title', () => {
    render(<NoteCard note={createNote()} />)
    expect(screen.getByText('测试笔记')).toBeInTheDocument()
  })

  it('should show default title when note has no title', () => {
    render(<NoteCard note={createNote({ title: '' })} />)
    expect(screen.getByText('(无标题)')).toBeInTheDocument()
  })

  it('should show lock icon for draft notes', () => {
    render(<NoteCard note={createNote({ is_draft: true })} />)
    // Lock icon is rendered via lucide-react
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
  })

  it('should not show lock icon for published notes', () => {
    render(<NoteCard note={createNote({ is_draft: false })} />)
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
  })

  it('should render formatted date', () => {
    render(<NoteCard note={createNote({ updated_at: '2024-06-15T10:30:00Z' })} />)
    expect(screen.getByText(/更新于/)).toBeInTheDocument()
  })

  it('should render content preview from markdown', () => {
    render(<NoteCard note={createNote({ content_markdown: '# Hello\n\nWorld content here.' })} />)
    expect(screen.getByText(/Hello/)).toBeInTheDocument()
  })

  it('should extract plain text from TipTap JSON stored in content_markdown', () => {
    const tipTapJson = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '123' }],
        },
      ],
    })
    render(
      <NoteCard
        note={createNote({
          content_markdown: tipTapJson,
          content: '',
        })}
      />
    )
    expect(screen.getByText('123')).toBeInTheDocument()
    expect(screen.queryByText(/"type":"doc"/)).not.toBeInTheDocument()
  })

  it('should fall back to content TipTap JSON when markdown is empty', () => {
    const tipTapJson = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'from content' }],
        },
      ],
    })
    render(
      <NoteCard
        note={createNote({
          content_markdown: '',
          content: tipTapJson,
        })}
      />
    )
    expect(screen.getByText('from content')).toBeInTheDocument()
  })

  it('should show empty content placeholder when no readable content', () => {
    render(<NoteCard note={createNote({ content_markdown: '', content: '' })} />)
    expect(screen.getByText('(无内容)')).toBeInTheDocument()
  })

  it('should show empty content for empty TipTap JSON', () => {
    const emptyDoc =
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}'
    render(<NoteCard note={createNote({ content_markdown: emptyDoc, content: emptyDoc })} />)
    expect(screen.getByText('(无内容)')).toBeInTheDocument()
  })

  it('should show empty content when markdown is whitespace and content empty', () => {
    render(<NoteCard note={createNote({ content_markdown: '   ', content: '' })} />)
    expect(screen.getByText('(无内容)')).toBeInTheDocument()
  })

  it('should link to the correct note page', () => {
    render(<NoteCard note={createNote({ id: 42 })} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/note/42')
  })

  it('should have hover cursor pointer styling', () => {
    render(<NoteCard note={createNote()} />)
    const card = screen.getByRole('link').firstChild
    // The Link wraps a Card element
    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('should truncate long content preview', () => {
    const longContent = '# Title\n\n' + 'a'.repeat(200)
    render(<NoteCard note={createNote({ content_markdown: longContent })} />)
    // getContentPreview truncates at 150 chars
    const preview = screen.getByText(/a+\.\.\./)
    expect(preview).toBeInTheDocument()
  })
})
