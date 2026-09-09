import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReaderToolbar } from '../ReaderToolbar'

vi.unmock('@/components/ui/slider')
import type { BookNarrationMode, BookNarrationStatus } from '@/app/book/types/narration'

const chapters = [
  { id: '1', title: '第一回 甄士隐梦幻识通灵' },
  { id: '2', title: '第二回 贾夫人仙逝扬州城' },
]
const props = {
  chapters,
  currentChapterId: '1',
  settings: { theme: 'light' as const },
  bookmarkCount: 0,
  collectionCount: 0,
  onChapterChange: vi.fn(),
  onOpenBookmarks: vi.fn(),
  onOpenCollections: vi.fn(),
  onOpenSettings: vi.fn(),
  narrationStatus: 'idle' as BookNarrationStatus,
  narrationMode: 'original' as BookNarrationMode,
  onNarrationModeChange: vi.fn(),
  onStartNarration: vi.fn(),
  onPauseNarration: vi.fn(),
  onResumeNarration: vi.fn(),
  onStopNarration: vi.fn(),
}

describe('ReaderToolbar', () => {
  it('keeps all five labeled tools available on small screens', () => {
    render(<ReaderToolbar {...props} />)
    const tools = within(screen.getByRole('navigation', { name: '阅读工具' }))
    for (const name of ['打开目录', '打开听书控制', '打开书签列表', '打开收藏列表', '打开阅读设置'])
      expect(tools.getByRole('button', { name })).toBeInTheDocument()
    expect(screen.queryByText(chapters[1].title)).not.toBeInTheDocument()
  })
  it('searches the chapter list and navigates to the selected result', () => {
    const change = vi.fn()
    render(<ReaderToolbar {...props} onChapterChange={change} />)
    fireEvent.click(screen.getByRole('button', { name: '打开目录' }))
    const panel = within(screen.getByRole('dialog', { name: '目录' }))
    fireEvent.change(panel.getByRole('textbox', { name: '搜索章节' }), {
      target: { value: '第二回' },
    })
    expect(panel.queryByText(chapters[0].title)).not.toBeInTheDocument()
    fireEvent.click(panel.getByRole('button', { name: chapters[1].title }))
    expect(change).toHaveBeenCalledWith('2')
  })
  it('searches across collapsed volumes', () => {
    const change = vi.fn()
    render(
      <ReaderToolbar
        {...props}
        onChapterChange={change}
        currentChapterId="0-0"
        chapterGroups={[
          { label: '第一卷', chapters: [{ id: '0-0', title: '故乡' }] },
          { label: '第二卷', chapters: [{ id: '1-0', title: '社戏' }] },
        ]}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '打开目录' }))
    fireEvent.change(screen.getByRole('textbox', { name: '搜索章节' }), {
      target: { value: '社戏' },
    })
    fireEvent.click(screen.getByRole('button', { name: '社戏' }))
    expect(change).toHaveBeenCalledWith('1-0')
  })
  it('shows chapter boundaries and uses the navigation callbacks', () => {
    const next = vi.fn()
    render(<ReaderToolbar {...props} onNextChapter={next} hasNextChapter hasPrevChapter={false} />)
    expect(screen.getByRole('button', { name: '上一章' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '下一章' }))
    expect(next).toHaveBeenCalledOnce()
  })
  it('starts narration from the dedicated listening panel', () => {
    const start = vi.fn()
    render(<ReaderToolbar {...props} onStartNarration={start} />)
    fireEvent.click(screen.getByRole('button', { name: '打开听书控制' }))
    fireEvent.click(screen.getByRole('button', { name: '从当前位置开始听书' }))
    expect(start).toHaveBeenCalledOnce()
  })
  it('allows pausing, resuming and stopping without opening a panel', () => {
    const pause = vi.fn(),
      resume = vi.fn(),
      stop = vi.fn()
    const { rerender } = render(
      <ReaderToolbar
        {...props}
        narrationStatus="playing"
        onPauseNarration={pause}
        onStopNarration={stop}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '暂停听书' }))
    expect(pause).toHaveBeenCalledOnce()
    rerender(
      <ReaderToolbar
        {...props}
        narrationStatus="paused"
        onResumeNarration={resume}
        onStopNarration={stop}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '继续听书' }))
    fireEvent.click(screen.getByRole('button', { name: '停止听书' }))
    expect(resume).toHaveBeenCalledOnce()
    expect(stop).toHaveBeenCalledOnce()
  })
  it('offers paragraph navigation and speed controls while listening', () => {
    const seek = vi.fn(),
      rate = vi.fn()
    render(
      <ReaderToolbar
        {...props}
        narrationStatus="playing"
        narrationPairIndex={2}
        narrationPairCount={10}
        onNarrationSeek={seek}
        onNarrationRateChange={rate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '打开听书控制' }))
    expect(screen.getByRole('slider', { name: '朗读段落' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '朗读下一段' }))
    expect(seek).toHaveBeenCalledWith(3)
    fireEvent.click(screen.getByRole('radio', { name: '1.5×' }))
    expect(rate).toHaveBeenCalledWith(1.5)
  })
  it('lets the listener choose system TTS or AI narration', () => {
    const changeEngine = vi.fn()
    render(
      <ReaderToolbar
        {...props}
        narrationEngine="tts"
        onNarrationEngineChange={changeEngine}
        narrationUnavailableReason="AI 朗读需要语音 API。ChatGPT 设备登录只能聊天，请用系统 TTS"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '打开听书控制' }))
    fireEvent.click(screen.getByRole('radio', { name: 'AI 朗读' }))
    expect(changeEngine).toHaveBeenCalledWith('ai')
  })
  it('disables playback while AI narration is not available', () => {
    render(
      <ReaderToolbar
        {...props}
        narrationEngine="ai"
        onNarrationEngineChange={vi.fn()}
        narrationUnavailableReason="AI 朗读需要语音 API。ChatGPT 设备登录只能聊天，请用系统 TTS"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '打开听书控制' }))
    expect(screen.getByRole('button', { name: '从当前位置开始听书' })).toBeDisabled()
    expect(
      screen.getByText('AI 朗读需要语音 API。ChatGPT 设备登录只能聊天，请用系统 TTS')
    ).toBeInTheDocument()
  })
  it('hides narration for unsupported book types and keeps mark counts readable', () => {
    render(<ReaderToolbar {...props} hideNarration bookmarkCount={3} collectionCount={150} />)
    expect(screen.queryByRole('button', { name: '打开听书控制' })).not.toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('99+')).toBeInTheDocument()
  })
  it('opens bookmark, collection and settings panels through their actions', () => {
    const bookmark = vi.fn(),
      collection = vi.fn(),
      settings = vi.fn()
    render(
      <ReaderToolbar
        {...props}
        onOpenBookmarks={bookmark}
        onOpenCollections={collection}
        onOpenSettings={settings}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '打开书签列表' }))
    fireEvent.click(screen.getByRole('button', { name: '打开收藏列表' }))
    fireEvent.click(screen.getByRole('button', { name: '打开阅读设置' }))
    expect(bookmark).toHaveBeenCalledOnce()
    expect(collection).toHaveBeenCalledOnce()
    expect(settings).toHaveBeenCalledOnce()
  })
})
