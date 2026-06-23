import { beforeEach, describe, expect, it } from 'vitest'
import { useWordStore } from '../wordStore'
import type { Word } from '../../types'

const makeWord = (id: number): Word => ({
  id,
  content: `word-${id}`,
  difficulty: 1,
  frequency: 1,
})

describe('wordStore', () => {
  beforeEach(() => {
    useWordStore.getState().reset()
  })

  describe('initial state', () => {
    it('should have correct default values after reset', () => {
      const state = useWordStore.getState()
      expect(state.currentWords).toEqual([])
      expect(state.studyQueue).toEqual([])
      expect(state.initialStudyCount).toBe(0)
      expect(state.currentIndex).toBe(0)
      expect(state.learningStatus).toBe('idle')
      expect(state.currentWordMemoryStatus).toBe('unknown')
      expect(state.showTranslation).toBe(false)
      expect(state.dailyProgress).toEqual({ learned: 0, reviewed: 0 })
      expect(state.settings).toBeNull()
      expect(state.studyStartTime).toBeNull()
    })
  })

  describe('study session flow', () => {
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

  describe('setCurrentWords', () => {
    it('should initialize study queue with words', () => {
      const words = [makeWord(1), makeWord(2), makeWord(3)]
      useWordStore.getState().setCurrentWords(words)

      const state = useWordStore.getState()
      expect(state.currentWords).toHaveLength(3)
      expect(state.studyQueue).toHaveLength(3)
      expect(state.initialStudyCount).toBe(3)
      expect(state.currentIndex).toBe(0)
    })
  })

  describe('setCurrentIndex', () => {
    it('should set valid index', () => {
      useWordStore.getState().setCurrentWords([makeWord(1), makeWord(2)])
      useWordStore.getState().setCurrentIndex(1)

      expect(useWordStore.getState().currentIndex).toBe(1)
    })

    it('should not set out-of-bounds index', () => {
      useWordStore.getState().setCurrentWords([makeWord(1)])
      useWordStore.getState().setCurrentIndex(5)

      expect(useWordStore.getState().currentIndex).toBe(0)
    })

    it('should not set negative index', () => {
      useWordStore.getState().setCurrentWords([makeWord(1)])
      useWordStore.getState().setCurrentIndex(-1)

      expect(useWordStore.getState().currentIndex).toBe(0)
    })
  })

  describe('nextWord', () => {
    it('should advance to next word', () => {
      const words = [makeWord(1), makeWord(2), makeWord(3)]
      useWordStore.getState().setCurrentWords(words)

      useWordStore.getState().nextWord()

      const state = useWordStore.getState()
      expect(state.studyQueue).toHaveLength(2)
      expect(state.currentIndex).toBe(0)
    })

    it('should set completed when last word is advanced', () => {
      useWordStore.getState().setCurrentWords([makeWord(1)])

      useWordStore.getState().nextWord()

      expect(useWordStore.getState().studyQueue).toHaveLength(0)
      expect(useWordStore.getState().learningStatus).toBe('completed')
    })
  })

  describe('toggleTranslation', () => {
    it('should toggle showTranslation', () => {
      useWordStore.getState().toggleTranslation()
      expect(useWordStore.getState().showTranslation).toBe(true)

      useWordStore.getState().toggleTranslation()
      expect(useWordStore.getState().showTranslation).toBe(false)
    })
  })

  describe('markWord', () => {
    it('should mark as remembered', () => {
      useWordStore.getState().markWord(true)

      expect(useWordStore.getState().currentWordMemoryStatus).toBe('remembered')
      expect(useWordStore.getState().showTranslation).toBe(true)
    })

    it('should mark as forgotten', () => {
      useWordStore.getState().markWord(false)

      expect(useWordStore.getState().currentWordMemoryStatus).toBe('forgotten')
      expect(useWordStore.getState().showTranslation).toBe(true)
    })
  })

  describe('updateDailyProgress', () => {
    it('should increment learned count', () => {
      useWordStore.getState().updateDailyProgress('learned')
      expect(useWordStore.getState().dailyProgress.learned).toBe(1)
    })

    it('should increment reviewed count', () => {
      useWordStore.getState().updateDailyProgress('reviewed')
      expect(useWordStore.getState().dailyProgress.reviewed).toBe(1)
    })

    it('should accumulate increments', () => {
      useWordStore.getState().updateDailyProgress('learned')
      useWordStore.getState().updateDailyProgress('learned')
      useWordStore.getState().updateDailyProgress('reviewed')

      expect(useWordStore.getState().dailyProgress.learned).toBe(2)
      expect(useWordStore.getState().dailyProgress.reviewed).toBe(1)
    })
  })

  describe('getCurrentWord', () => {
    it('should return first word in queue', () => {
      const words = [makeWord(1), makeWord(2)]
      useWordStore.getState().setCurrentWords(words)

      expect(useWordStore.getState().getCurrentWord()?.id).toBe(1)
    })

    it('should return null when queue is empty', () => {
      expect(useWordStore.getState().getCurrentWord()).toBeNull()
    })
  })

  describe('removeCurrentWordFromQueue', () => {
    it('should remove first word from queue', () => {
      const words = [makeWord(1), makeWord(2)]
      useWordStore.getState().setCurrentWords(words)
      useWordStore.getState().startStudy('learning')

      useWordStore.getState().removeCurrentWordFromQueue()

      expect(useWordStore.getState().studyQueue).toHaveLength(1)
      expect(useWordStore.getState().studyQueue[0].id).toBe(2)
    })

    it('should return true when queue becomes empty', () => {
      useWordStore.getState().setCurrentWords([makeWord(1)])
      useWordStore.getState().startStudy('learning')

      const result = useWordStore.getState().removeCurrentWordFromQueue()
      expect(result).toBe(true)
    })

    it('should return false when queue still has items', () => {
      const words = [makeWord(1), makeWord(2)]
      useWordStore.getState().setCurrentWords(words)
      useWordStore.getState().startStudy('learning')

      const result = useWordStore.getState().removeCurrentWordFromQueue()
      expect(result).toBe(false)
    })
  })

  describe('settings', () => {
    it('should set settings', () => {
      const settings = { autoPlayPronunciation: true, showPhonetic: true }
      useWordStore.getState().setSettings(settings)

      expect(useWordStore.getState().settings).toEqual(settings)
    })

    it('should update settings partially', () => {
      useWordStore.getState().setSettings({ autoPlayPronunciation: true, showPhonetic: true })
      useWordStore.getState().updateSettings({ autoPlayPronunciation: false })

      expect(useWordStore.getState().settings?.autoPlayPronunciation).toBe(false)
      expect(useWordStore.getState().settings?.showPhonetic).toBe(true)
    })
  })

  describe('startStudy', () => {
    it('should reset daily progress', () => {
      useWordStore.getState().updateDailyProgress('learned')
      useWordStore.getState().startStudy('reviewing')

      expect(useWordStore.getState().dailyProgress.learned).toBe(0)
      expect(useWordStore.getState().learningStatus).toBe('reviewing')
    })
  })
})
