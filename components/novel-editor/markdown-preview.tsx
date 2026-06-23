'use client'

import './novel-editor.css'
import { useEffect, useMemo } from 'react'
import hljs from 'highlight.js/lib/core'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const renderInline = (value: string) =>
  escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')

const renderMarkdown = (content: string) => {
  const lines = content.split(/\r?\n/)
  const html: string[] = []
  let paragraph: string[] = []
  let listItems: string[] = []
  let codeLines: string[] = []
  let codeLanguage = ''
  let inCodeBlock = false

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    html.push(`<p>${renderInline(paragraph.join(' '))}</p>`)
    paragraph = []
  }

  const flushList = () => {
    if (listItems.length === 0) return
    html.push(`<ul>${listItems.map(item => `<li>${renderInline(item)}</li>`).join('')}</ul>`)
    listItems = []
  }

  for (const line of lines) {
    const fence = line.match(/^```(\w+)?\s*$/)
    if (fence) {
      if (inCodeBlock) {
        html.push(
          `<pre><code${codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>`
        )
        codeLines = []
        codeLanguage = ''
        inCodeBlock = false
      } else {
        flushParagraph()
        flushList()
        codeLanguage = fence[1] ?? ''
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    if (!line.trim()) {
      flushParagraph()
      flushList()
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      flushList()
      const level = heading[1].length
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`)
      continue
    }

    const listItem = line.match(/^[-*]\s+(.+)$/)
    if (listItem) {
      flushParagraph()
      listItems.push(listItem[1])
      continue
    }

    paragraph.push(line.trim())
  }

  if (inCodeBlock) {
    html.push(
      `<pre><code${codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>`
    )
  }
  flushParagraph()
  flushList()

  return html.join('')
}

const MarkdownPreview = ({ content, className }: MarkdownPreviewProps) => {
  const html = useMemo(() => (content.trim() ? renderMarkdown(content) : ''), [content])

  useEffect(() => {
    if (!html) return

    const timeoutId = window.setTimeout(() => {
      document.querySelectorAll('pre code:not(.hljs)').forEach(block => {
        if (block instanceof HTMLElement) {
          try {
            hljs.highlightElement(block)
          } catch (error) {
            console.warn('Failed to highlight code block:', error)
          }
        }
      })
    }, 100)

    return () => window.clearTimeout(timeoutId)
  }, [html])

  if (!html) return null

  return (
    <div className={`relative w-full ${className || ''}`} data-testid="editor-root">
      <div
        className="prose prose-neutral dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground prose-h1:text-2xl prose-h1:mb-3 prose-h1:mt-4 prose-h2:text-xl prose-h2:mb-2 prose-h2:mt-4 prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-3 prose-p:leading-relaxed prose-p:text-foreground prose-p:my-2 prose-strong:font-semibold prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:my-2 prose-blockquote:border-l-4 prose-blockquote:border-primary/20 prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:my-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-ul:pl-6 prose-ul:my-2 prose-ul:space-y-1 prose-ol:pl-6 prose-ol:my-2 prose-ol:space-y-1 prose-li:leading-relaxed prose-li:pl-1 prose-li:my-0.5 prose-hr:my-4 prose-hr:border-t prose-hr:border-border prose-a:text-primary prose-a:underline prose-a:underline-offset-[3px] hover:prose-a:text-primary/80 prose-img:rounded-lg prose-img:border prose-img:border-border prose-img:my-4 max-w-none font-sans focus:outline-none"
        data-testid="editor-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

export default MarkdownPreview
