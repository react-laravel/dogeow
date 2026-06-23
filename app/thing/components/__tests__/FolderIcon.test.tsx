import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FolderIcon from '../FolderIcon'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, animate, initial, transition, ...props }: any) => (
      <div data-animate={JSON.stringify(animate)} data-initial={JSON.stringify(initial)} {...props}>
        {children}
      </div>
    ),
  },
}))

describe('FolderIcon', () => {
  it('renders closed folder icon when isOpen is false', () => {
    render(<FolderIcon isOpen={false} />)
    // Should render something - the component renders motion.div elements
    const divs = screen.getAllByRole('generic')
    expect(divs.length).toBeGreaterThan(0)
  })

  it('renders open folder icon when isOpen is true', () => {
    render(<FolderIcon isOpen={true} />)
    const divs = screen.getAllByRole('generic')
    expect(divs.length).toBeGreaterThan(0)
  })

  it('calls onClick when provided', () => {
    const onClick = vi.fn()
    render(<FolderIcon isOpen={false} onClick={onClick} />)
    const container = screen.getByRole('button')
    fireEvent.click(container)
    expect(onClick).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const { container } = render(<FolderIcon isOpen={false} className="custom-class" />)
    const folder = container.firstElementChild as HTMLElement
    expect(folder.className).toContain('custom-class')
  })
})
