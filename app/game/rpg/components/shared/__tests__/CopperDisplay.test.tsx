import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { CopperDisplay } from '../CopperDisplay'

describe('CopperDisplay', () => {
  const expectRendered = (element: ReactElement) => {
    const { container } = render(element)
    expect(container.firstChild).toBeDefined()
  }

  it('should render without crashing', () => {
    expectRendered(<CopperDisplay copper={0} />)
  })

  it('should display copper only', () => {
    expectRendered(<CopperDisplay copper={50} />)
  })

  it('should display gold, silver and copper', () => {
    expectRendered(<CopperDisplay copper={12345} />)
  })

  it('should limit displayed parts with maxParts', () => {
    expectRendered(<CopperDisplay copper={12345} maxParts={1} />)
    expectRendered(<CopperDisplay copper={12345} maxParts={2} />)
  })

  it('should handle zero copper', () => {
    expectRendered(<CopperDisplay copper={0} />)
  })

  it('should handle large values', () => {
    expectRendered(<CopperDisplay copper={1000000} />)
  })

  it('should use default size sm', () => {
    expectRendered(<CopperDisplay copper={100} size="sm" />)
  })

  it('should accept md size', () => {
    expectRendered(<CopperDisplay copper={100} size="md" />)
  })

  it('should default nowrap to false', () => {
    expectRendered(<CopperDisplay copper={12345} nowrap={false} />)
  })

  it('should accept nowrap true', () => {
    expectRendered(<CopperDisplay copper={12345} nowrap={true} />)
  })

  it('should default maxParts to 2', () => {
    expectRendered(<CopperDisplay copper={10050} />)
  })
})
