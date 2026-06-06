import { beforeEach, describe, expect, it } from 'vitest'
import { useWordStore } from '../wordStore'
import type { Word } from '../../types'

const makeWord = (id: number): Word => ({
  id,
  content: `word-${id}`,
  difficulty: 1,
  frequency: 1,
})

describe('wordStore study session', () => {
  beforeEach(() => {
    useWordStore.getState().reset()
  })

  it('startStudy keeps learning mode so progress can increment', () => {
    useWordStore.getState().setCurrentWords([makeWord(1)])
    useWordStore.getState().startStudy('learning')

    expect(useWordStore.getState().learningStatus).toBe('learning')

    const isComplete = useWordStore.getState().resolveCurrentWord(true)
    expect(isComplete).toBe(true)
    expect(useWordStore.getState().dailyProgress.learned).toBe(1)
  })

  it('requeues forgotten words until remembered', () => {
    const words = [makeWord(1), makeWord(2)]
    useWordStore.getState().setCurrentWords(words)
    useWordStore.getState().startStudy('learning')

    expect(useWordStore.getState().getCurrentWord()?.id).toBe(1)

    const afterForgot = useWordStore.getState().resolveCurrentWord(false)
    expect(afterForgot).toBe(false)
    expect(useWordStore.getState().getCurrentWord()?.id).toBe(2)
    expect(useWordStore.getState().dailyProgress.learned).toBe(0)

    const afterSecondForgot = useWordStore.getState().resolveCurrentWord(false)
    expect(afterSecondForgot).toBe(false)
    expect(useWordStore.getState().getCurrentWord()?.id).toBe(1)

    useWordStore.getState().resolveCurrentWord(true)
    expect(useWordStore.getState().getCurrentWord()?.id).toBe(2)

    const isComplete = useWordStore.getState().resolveCurrentWord(true)
    expect(isComplete).toBe(true)
    expect(useWordStore.getState().dailyProgress.learned).toBe(2)
  })

  it('tracks reviewed count in reviewing mode', () => {
    useWordStore.getState().setCurrentWords([makeWord(10)])
    useWordStore.getState().startStudy('reviewing')

    useWordStore.getState().resolveCurrentWord(true)
    expect(useWordStore.getState().dailyProgress.reviewed).toBe(1)
    expect(useWordStore.getState().dailyProgress.learned).toBe(0)
  })
})
