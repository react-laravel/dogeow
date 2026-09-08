import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import WordScanPage from '../page'
vi.mock('next/navigation', () => ({ usePathname: () => '/word/scan' }))
describe('WordScanPage camera', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })
  it('opens the camera on demand and attaches the stream after the video mounts', async () => {
    const stop = vi.fn()
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream
    const getUserMedia = vi.fn().mockResolvedValue(stream)
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
    const { container, unmount } = render(<WordScanPage />)
    expect(getUserMedia).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '打开摄像头' }))
    await waitFor(() => expect(container.querySelector('video')?.srcObject).toBe(stream))
    unmount()
    expect(stop).toHaveBeenCalledTimes(1)
  })
  it('stops a late camera stream after navigating away', async () => {
    let resolve!: (stream: MediaStream) => void
    const stop = vi.fn()
    const getUserMedia = vi.fn(
      () =>
        new Promise<MediaStream>(done => {
          resolve = done
        })
    )
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
    const { unmount } = render(<WordScanPage />)
    fireEvent.click(screen.getByRole('button', { name: '打开摄像头' }))
    unmount()
    await act(async () => {
      resolve({ getTracks: () => [{ stop }] } as unknown as MediaStream)
    })
    expect(stop).toHaveBeenCalledTimes(1)
  })
})
