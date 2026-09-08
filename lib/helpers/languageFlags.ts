/**
 * 语言国旗映射工具
 * 提供统一的国旗获取功能
 */

import type { SupportedLanguage } from '@/lib/i18n/translations'

// 与可选语言保持一致，新语言缺少图标时由类型检查提示。
const LANGUAGE_FLAG_MAP: Record<SupportedLanguage, string> = {
  'zh-CN': '🇨🇳',
  en: '🇺🇸',
}

/**
 * 根据语言代码获取对应的国旗
 * @param languageCode 语言代码 (如 'zh-CN', 'en')
 * @returns 对应的国旗 emoji，如果未找到则返回默认的🌐
 */
export function getLanguageFlag(languageCode?: string): string {
  if (!languageCode) return '🌐'
  return Object.hasOwn(LANGUAGE_FLAG_MAP, languageCode)
    ? LANGUAGE_FLAG_MAP[languageCode as SupportedLanguage]
    : '🌐'
}

/**
 * 获取所有支持的语言代码
 * @returns 支持的语言代码数组
 */
export function getSupportedLanguageCodes(): string[] {
  return Object.keys(LANGUAGE_FLAG_MAP)
}

/**
 * 检查语言代码是否支持国旗显示
 * @param languageCode 语言代码
 * @returns 是否支持国旗显示
 */
export function hasLanguageFlag(languageCode: string): boolean {
  return Object.hasOwn(LANGUAGE_FLAG_MAP, languageCode)
}
