import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Word, UserWordSetting, LearningStatus, WordMemoryStatus } from '../types'

interface WordState {
  // 当前学习的单词列表（本轮初始词表，用于展示）
  currentWords: Word[]
  // 学习队列（含「记不住」重新入队的词）
  studyQueue: Word[]
  // 本轮初始单词数
  initialStudyCount: number
  // 当前单词索引（兼容旧逻辑，实际以 studyQueue[0] 为准）
  currentIndex: number
  // 当前学习状态
  learningStatus: LearningStatus
  // 当前单词的记忆状态
  currentWordMemoryStatus: WordMemoryStatus
  // 是否显示翻译
  showTranslation: boolean
  // 每日进度（本轮会话内计数）
  dailyProgress: {
    learned: number
    reviewed: number
  }
  // 用户设置
  settings: UserWordSetting | null
  // 学习开始时间
  studyStartTime: Date | null

  // Actions
  setCurrentWords: (words: Word[]) => void
  setCurrentIndex: (index: number) => void
  nextWord: () => void
  previousWord: () => void
  setLearningStatus: (status: LearningStatus) => void
  setCurrentWordMemoryStatus: (status: WordMemoryStatus) => void
  toggleTranslation: () => void
  markWord: (remembered: boolean) => void
  updateDailyProgress: (type: 'learned' | 'reviewed') => void
  setSettings: (settings: UserWordSetting) => void
  updateSettings: (settings: Partial<UserWordSetting>) => void
  startStudy: (mode: 'learning' | 'reviewing') => void
  /** 处理当前词结果；返回 true 表示本轮队列已清空 */
  resolveCurrentWord: (remembered: boolean) => boolean
  removeCurrentWordFromQueue: () => boolean
  getCurrentWord: () => Word | null
  reset: () => void
}

const initialDailyProgress = { learned: 0, reviewed: 0 }

export const useWordStore = create<WordState>()(
  persist(
    (set, get) => ({
      currentWords: [],
      studyQueue: [],
      initialStudyCount: 0,
      currentIndex: 0,
      learningStatus: 'idle',
      currentWordMemoryStatus: 'unknown',
      showTranslation: false,
      dailyProgress: initialDailyProgress,
      settings: null,
      studyStartTime: null,

      setCurrentWords: words => {
        set({
          currentWords: words,
          studyQueue: [...words],
          initialStudyCount: words.length,
          currentIndex: 0,
          showTranslation: false,
          currentWordMemoryStatus: 'unknown',
        })
      },

      setCurrentIndex: index => {
        const { studyQueue } = get()
        if (index >= 0 && index < studyQueue.length) {
          set({
            currentIndex: index,
            showTranslation: false,
            currentWordMemoryStatus: 'unknown',
          })
        }
      },

      nextWord: () => {
        const { studyQueue } = get()
        if (studyQueue.length > 1) {
          set({
            studyQueue: studyQueue.slice(1),
            currentIndex: 0,
            showTranslation: false,
            currentWordMemoryStatus: 'unknown',
          })
        } else if (studyQueue.length === 1) {
          set({
            studyQueue: [],
            currentIndex: 0,
            showTranslation: false,
            currentWordMemoryStatus: 'unknown',
            learningStatus: 'completed',
          })
        }
      },

      previousWord: () => {
        // 队列模式下不支持回退
      },

      setLearningStatus: status => {
        set({ learningStatus: status })
      },

      setCurrentWordMemoryStatus: status => {
        set({ currentWordMemoryStatus: status })
      },

      toggleTranslation: () => {
        set(state => ({ showTranslation: !state.showTranslation }))
      },

      markWord: remembered => {
        set({
          currentWordMemoryStatus: remembered ? 'remembered' : 'forgotten',
          showTranslation: true,
        })
      },

      updateDailyProgress: type => {
        set(state => ({
          dailyProgress: {
            ...state.dailyProgress,
            [type]: state.dailyProgress[type] + 1,
          },
        }))
      },

      setSettings: settings => {
        set({ settings })
      },

      updateSettings: partialSettings => {
        set(state => ({
          settings: state.settings ? { ...state.settings, ...partialSettings } : null,
        }))
      },

      startStudy: mode => {
        set({
          studyStartTime: new Date(),
          learningStatus: mode,
          dailyProgress: { ...initialDailyProgress },
          showTranslation: false,
          currentWordMemoryStatus: 'unknown',
        })
      },

      getCurrentWord: () => {
        const { studyQueue } = get()
        return studyQueue[0] ?? null
      },

      resolveCurrentWord: remembered => {
        const { studyQueue, learningStatus } = get()
        if (studyQueue.length === 0) return true

        if (remembered) {
          if (learningStatus === 'learning') {
            get().updateDailyProgress('learned')
          } else if (learningStatus === 'reviewing') {
            get().updateDailyProgress('reviewed')
          }

          const nextQueue = studyQueue.slice(1)
          set({
            studyQueue: nextQueue,
            currentIndex: 0,
            showTranslation: false,
            currentWordMemoryStatus: 'unknown',
          })
          return nextQueue.length === 0
        }

        const [current, ...rest] = studyQueue
        set({
          studyQueue: [...rest, current],
          currentIndex: 0,
          showTranslation: false,
          currentWordMemoryStatus: 'unknown',
        })
        return false
      },

      removeCurrentWordFromQueue: () => {
        const { studyQueue, learningStatus } = get()
        if (studyQueue.length === 0) return true

        if (learningStatus === 'learning') {
          get().updateDailyProgress('learned')
        } else if (learningStatus === 'reviewing') {
          get().updateDailyProgress('reviewed')
        }

        const nextQueue = studyQueue.slice(1)
        set({
          studyQueue: nextQueue,
          currentIndex: 0,
          showTranslation: false,
          currentWordMemoryStatus: 'unknown',
        })
        return nextQueue.length === 0
      },

      reset: () => {
        set({
          currentWords: [],
          studyQueue: [],
          initialStudyCount: 0,
          currentIndex: 0,
          learningStatus: 'idle',
          currentWordMemoryStatus: 'unknown',
          showTranslation: false,
          dailyProgress: { ...initialDailyProgress },
          studyStartTime: null,
        })
      },
    }),
    {
      name: 'word-store',
      partialize: state => ({
        dailyProgress: state.dailyProgress,
      }),
    }
  )
)
