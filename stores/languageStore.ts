'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  detectBrowserLanguage,
  createTranslationFunction,
  normalizeLanguageCode,
  getAvailableLanguages,
  isSupportedLanguage,
  type SupportedLanguage,
} from '@/lib/i18n'
import {
  languageDetectionService,
  type LanguageDetectionResult,
} from '@/lib/i18n/language-detection-service'
import { logger } from '@/lib/logger'

interface LanguageState {
  currentLanguage: SupportedLanguage
  availableLanguages: ReturnType<typeof getAvailableLanguages>
  detectedLanguage: SupportedLanguage | null
  detectionResult: LanguageDetectionResult | null
  isAutoDetected: boolean
  lastDetectionTime: number | null
  isDetecting: boolean
  setLanguage: (language: string, rememberPreference?: boolean) => void
  t: (key: string, fallback?: string) => string
  initializeLanguage: () => Promise<void>
  resetToDetected: () => void
  getLanguagePreference: () => SupportedLanguage | null
  setLanguagePreference: (language: SupportedLanguage) => void
  refreshDetection: () => Promise<void>
  getDetectionStats: () => { confidence: number; method: string; timestamp: number | null }
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => {
      return {
        currentLanguage: 'en', // 默认回退语言，初始化后会被覆盖
        availableLanguages: getAvailableLanguages(),
        detectedLanguage: null,
        detectionResult: null,
        isAutoDetected: false,
        lastDetectionTime: null,
        isDetecting: false,

        setLanguage: (language: string, rememberPreference: boolean = true) => {
          const normalizedLanguage = normalizeLanguageCode(language)
          const translationFunction = createTranslationFunction(normalizedLanguage)

          logger.debug('[LanguageStore] 设置语言:', {
            requested: language,
            normalized: normalizedLanguage,
            rememberPreference,
            previousLanguage: get().currentLanguage,
          })

          // 如需记住用户偏好则保存
          if (rememberPreference) {
            get().setLanguagePreference(normalizedLanguage)
          }

          set({
            currentLanguage: normalizedLanguage,
            t: translationFunction,
            isAutoDetected: false,
          })

          logger.debug('[LanguageStore] 语言设置成功:', {
            newLanguage: normalizedLanguage,
            isAutoDetected: false,
          })
        },

        t: createTranslationFunction('zh-CN'), // 默认翻译函数

        initializeLanguage: async () => {
          const state = get()
          logger.debug('[LanguageStore] 初始化语言...')

          // 优先使用显式存储偏好；其次使用非默认当前语言
          const storedPreference = state.getLanguagePreference()
          const currentLanguagePreference =
            state.currentLanguage && state.currentLanguage !== 'zh-CN'
              ? state.currentLanguage
              : null
          const preferredLanguage = storedPreference || currentLanguagePreference

          if (preferredLanguage) {
            logger.debug('[LanguageStore] 使用存储/当前偏好:', preferredLanguage)
            const translationFunction = createTranslationFunction(preferredLanguage)
            set({
              currentLanguage: preferredLanguage,
              t: translationFunction,
              isAutoDetected: false,
              lastDetectionTime: Date.now(),
            })
            return
          }

          logger.debug('[LanguageStore] 没有存储偏好，使用浏览器语言检测...')

          const detectedLanguage = detectBrowserLanguage()
          const translationFunction = createTranslationFunction(detectedLanguage)
          const now = Date.now()

          set({
            currentLanguage: detectedLanguage,
            t: translationFunction,
            detectedLanguage,
            isAutoDetected: true,
            lastDetectionTime: now,
          })
        },

        refreshDetection: async () => {
          logger.debug('[LanguageStore] 开始语言检测...')
          set({ isDetecting: true })

          try {
            const detectionResult = await languageDetectionService.forceRedetect({
              ignoreStoredPreference: true,
            })
            const detectedLanguage = detectionResult.language
            const translationFunction = createTranslationFunction(detectedLanguage)
            const now = Date.now()

            logger.debug('[LanguageStore] 检测完成:', {
              detectedLanguage,
              method: detectionResult.method,
              confidence: detectionResult.confidence,
              timestamp: new Date(now).toISOString(),
            })

            set({
              currentLanguage: detectedLanguage,
              t: translationFunction,
              detectedLanguage,
              detectionResult,
              isAutoDetected: true,
              lastDetectionTime: now,
              isDetecting: false,
            })

            // 存储检测到的语言以便下次使用
            if (typeof window !== 'undefined') {
              localStorage.setItem(
                'dogeow-detected-language',
                JSON.stringify({
                  language: detectedLanguage,
                  timestamp: now,
                  confidence: detectionResult.confidence,
                  method: detectionResult.method,
                })
              )
              logger.debug('[LanguageStore] 检测结果已存储到localStorage')

              // 显示成功提示
              const { toast } = await import('sonner')
              toast.success(
                translationFunction('language.detection.refresh_success', '语言检测已刷新')
              )
            }
          } catch (error) {
            logger.error('[LanguageStore] 语言检测失败:', error)

            // 回退到基础检测
            logger.debug('[LanguageStore] 回退到基础检测...')
            const fallbackLanguage = detectBrowserLanguage()
            const translationFunction = createTranslationFunction(fallbackLanguage)
            const now = Date.now()

            set({
              currentLanguage: fallbackLanguage,
              t: translationFunction,
              detectedLanguage: fallbackLanguage,
              isAutoDetected: true,
              lastDetectionTime: now,
              isDetecting: false,
            })

            logger.debug('[LanguageStore] 回退检测完成:', {
              fallbackLanguage,
              timestamp: new Date(now).toISOString(),
            })

            // 显示失败提示
            if (typeof window !== 'undefined') {
              const { toast } = await import('sonner')
              toast.error(
                translationFunction('language.detection.refresh_failed', '语言检测刷新失败')
              )
            }
          }
        },

        resetToDetected: () => {
          const state = get()
          if (state.detectedLanguage) {
            logger.debug('[LanguageStore] 重置为检测到的语言:', state.detectedLanguage)
            state.setLanguage(state.detectedLanguage, false)
            set({ isAutoDetected: true })
          } else {
            logger.debug('[LanguageStore] 没有可重置的检测语言')
          }
        },

        getLanguagePreference: () => {
          if (typeof window === 'undefined') return null

          try {
            const stored = localStorage.getItem('dogeow-language-preference')
            if (stored && isSupportedLanguage(stored)) {
              logger.debug('[LanguageStore] 获取到存储的偏好:', stored)
              return stored
            }
            if (stored) {
              logger.debug('[LanguageStore] 存储的偏好不被支持:', stored)
            }
          } catch (error) {
            logger.warn('[LanguageStore] 获取语言偏好失败:', error)
          }

          return null
        },

        setLanguagePreference: (language: SupportedLanguage) => {
          if (typeof window === 'undefined') return

          try {
            logger.debug('[LanguageStore] 设置语言偏好:', language)
            localStorage.setItem('dogeow-language-preference', language)
          } catch (error) {
            logger.warn('[LanguageStore] 设置语言偏好失败:', error)
          }
        },

        getDetectionStats: () => {
          const state = get()
          if (!state.detectionResult) {
            logger.debug('[LanguageStore] 没有可用的检测统计信息')
            return { confidence: 0, method: 'none', timestamp: null }
          }

          const stats = {
            confidence: state.detectionResult.confidence,
            method: state.detectionResult.method,
            timestamp: state.detectionResult.timestamp,
          }

          logger.debug('[LanguageStore] 检测统计信息:', stats)

          return stats
        },
      }
    },
    {
      name: 'language-storage',
      // 只持久化当前语言和检测信息，不持久化翻译函数
      partialize: state => ({
        currentLanguage: state.currentLanguage,
        detectedLanguage: state.detectedLanguage,
        detectionResult: state.detectionResult,
        isAutoDetected: state.isAutoDetected,
        lastDetectionTime: state.lastDetectionTime,
      }),
    }
  )
)

// 获取当前语言信息的辅助函数
export const getCurrentLanguageInfo = (currentLanguage: SupportedLanguage) => {
  const availableLanguages = getAvailableLanguages()
  return availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0]
}

// 检查语言检测是否过期（超过7天）的辅助函数
export const isLanguageDetectionStale = (lastDetectionTime: number | null) => {
  if (!lastDetectionTime) return true

  const sevenDays = 7 * 24 * 60 * 60 * 1000
  return Date.now() - lastDetectionTime > sevenDays
}

// 判断是否需要重新检测语言的辅助函数
export const shouldRedetectLanguage = (
  lastDetectionTime: number | null,
  isAutoDetected: boolean
) => {
  // 如果从未检测过则始终重新检测
  if (!lastDetectionTime) return true

  // 如果检测已过期且是自动检测的，则重新检测
  if (isLanguageDetectionStale(lastDetectionTime) && isAutoDetected) {
    return true
  }

  return false
}
