/* eslint-disable @next/next/no-img-element */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatLoadingIndicator } from '../ChatLoadingIndicator'

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

describe('ChatLoadingIndicator', () => {
  it('renders loading dots when no completion', () => {
    render(<ChatLoadingIndicator />)
    expect(screen.getByText('正在思考...')).toBeInTheDocument()
  })

  it('renders completion with typing indicator', () => {
    render(<ChatLoadingIndicator completion="partial text" />)
    expect(screen.getByText('partial text')).toBeInTheDocument()
    expect(screen.getByText('正在输入...')).toBeInTheDocument()
  })

  it('renders page variant with logo by default', () => {
    render(<ChatLoadingIndicator />)
    expect(screen.getByAltText('DogeOW Logo')).toBeInTheDocument()
  })

  it('renders dialog variant without logo', () => {
    render(<ChatLoadingIndicator variant="dialog" />)
    expect(screen.queryByAltText('DogeOW Logo')).not.toBeInTheDocument()
    expect(screen.getByText('正在思考...')).toBeInTheDocument()
  })

  it('renders dialog variant with completion', () => {
    render(<ChatLoadingIndicator variant="dialog" completion="hello" />)
    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByText('正在输入...')).toBeInTheDocument()
  })

  it('renders page variant with completion', () => {
    render(<ChatLoadingIndicator variant="page" completion="hello world" />)
    expect(screen.getByText('hello world')).toBeInTheDocument()
    expect(screen.getByText('正在输入...')).toBeInTheDocument()
  })
})
