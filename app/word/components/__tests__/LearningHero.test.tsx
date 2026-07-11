import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LearningHero } from '../LearningHero'
import type { Book } from '../../types'

const book: Book = {
  id: 1,
  name: '英语四级词汇',
  difficulty: 2,
  total_words: 1316,
  sort_order: 1,
}

describe('LearningHero', () => {
  it('makes the first study action prominent before check-in', () => {
    render(<LearningHero todayCheckedIn={false} currentBook={book} />)

    expect(screen.getByText('开始今天的学习')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /开始学习/ })).toHaveAttribute('href', '/word/learn')
    expect(screen.getByRole('link', { name: /英语四级词汇/ })).toHaveAttribute(
      'href',
      '/word/books'
    )
    expect(screen.getByText('共 1316 词 · 点击切换')).toBeInTheDocument()
  })

  it('uses the continue route after today is complete', () => {
    render(<LearningHero todayCheckedIn currentBook={book} />)

    expect(screen.getByText('保持手感，再学一组')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /继续学习/ })).toHaveAttribute(
      'href',
      '/word/learn?continue=1'
    )
  })
})
