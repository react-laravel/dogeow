import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { proxy } from './proxy'

function request(url: string) {
  return new NextRequest(url, { headers: { accept: 'text/html' } })
}

describe('extracted game redirects', () => {
  it('keeps RPG on its dedicated domain before the general game rule', () => {
    const response = proxy(request('https://next.dogeow.com/game/rpg/inventory?tab=equipment'))

    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe('https://rpg.dogeow.com/inventory?tab=equipment')
  })

  it('redirects the game hub to the standalone domain', () => {
    const response = proxy(request('https://next.dogeow.com/game'))

    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe('https://game.dogeow.com/')
  })

  it('maps old game paths to root routes and preserves the query', () => {
    const response = proxy(request('https://next.dogeow.com/game/2048?mode=auto'))

    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe('https://game.dogeow.com/2048?mode=auto')
  })

  it('moves Moon Dice out of the tool query without dropping other parameters', () => {
    const response = proxy(request('https://next.dogeow.com/tool?tool=moon-dice&source=launcher'))

    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe(
      'https://game.dogeow.com/moon-dice?source=launcher'
    )
  })

  it('does not redirect ordinary tools', () => {
    const response = proxy(request('https://next.dogeow.com/tool?tool=time-converter'))

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })
})
