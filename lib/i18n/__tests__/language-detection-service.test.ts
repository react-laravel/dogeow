import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageDetectionService } from '../language-detection-service'
import { GeolocationDetector } from '../geolocation-detector'

let service: LanguageDetectionService
let timezone = 'America/New_York'

function mockBrowser(languages = ['en-US', 'en'], userAgent = 'unknown') {
  vi.stubGlobal('navigator', { languages, language: languages[0] ?? '', userAgent })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-16T00:00:00Z'))
  localStorage.clear()
  timezone = 'America/New_York'
  mockBrowser()
  vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
    resolvedOptions: () => ({ timeZone: timezone }),
  } as Intl.DateTimeFormat)
  vi.spyOn(GeolocationDetector.prototype, 'detectByIP').mockResolvedValue(null)
  service = LanguageDetectionService.getInstance()
  service.clearCache()
})

afterEach(() => {
  service.clearCache()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('LanguageDetectionService public behavior', () => {
  it('returns the same service instance', () => {
    expect(LanguageDetectionService.getInstance()).toBe(service)
  })

  it('reuses a fresh detection result', async () => {
    const first = await service.detectLanguage()
    mockBrowser(['zh-CN'])
    expect(await service.detectLanguage()).toBe(first)
  })

  it('redetects after the cache expires', async () => {
    await service.detectLanguage()
    mockBrowser(['zh-CN'])
    vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000)

    expect(await service.detectLanguage()).toMatchObject({
      language: 'zh-CN',
      method: 'browser',
    })
  })

  it('gives a supported stored preference priority over browser language', async () => {
    localStorage.setItem('dogeow-language-preference', 'zh-CN')
    expect(await service.detectLanguage()).toMatchObject({
      language: 'zh-CN',
      method: 'stored_preference',
      confidence: 1,
    })
  })

  it('keeps detections with and without stored preference separate', async () => {
    localStorage.setItem('dogeow-language-preference', 'zh-CN')
    await service.detectLanguage()

    expect(await service.detectLanguage({ ignoreStoredPreference: true })).toMatchObject({
      language: 'en',
      method: 'browser',
    })
  })

  it('ignores an unsupported stored preference', async () => {
    localStorage.setItem('dogeow-language-preference', 'ja')
    expect(await service.detectLanguage()).toMatchObject({
      language: 'en',
      method: 'browser',
    })
  })

  it.each([
    ['en', 'en', 0.95],
    ['zh-CN', 'zh-CN', 0.95],
    ['zh', 'zh-CN', 0.8],
    ['zh-TW', 'zh-CN', 0.8],
    ['en-US', 'en', 0.8],
  ])(
    'detects browser language %s through the active strategy',
    async (browser, language, confidence) => {
      mockBrowser([browser as string])
      expect(await service.detectLanguage()).toMatchObject({
        language,
        confidence,
        method: 'browser',
      })
    }
  )

  it.each([
    ['America/New_York', 'en'],
    ['Asia/Shanghai', 'zh-CN'],
  ])('falls back to timezone %s when browser language is unsupported', async (zone, language) => {
    mockBrowser(['xx'])
    timezone = zone
    expect(await service.detectLanguage()).toMatchObject({
      language,
      method: 'geolocation',
      confidence: 0.75,
    })
  })

  it('uses cached geolocation before consulting the current timezone', async () => {
    mockBrowser(['xx'])
    localStorage.setItem(
      'dogeow-geo-language',
      JSON.stringify({ language: 'zh-CN', timestamp: Date.now() - 1000 })
    )

    expect(await service.detectLanguage()).toMatchObject({
      language: 'zh-CN',
      method: 'geolocation',
    })
  })

  it('falls back to the user agent after browser and timezone detection fail', async () => {
    mockBrowser([], 'Mozilla/5.0 (en) AppleWebKit/537.36')
    timezone = 'Etc/Unknown'

    expect(await service.detectLanguage()).toMatchObject({
      language: 'en',
      method: 'user_agent',
      confidence: 0.6,
    })
  })

  it('honors legacy navigator language properties in the user-agent fallback', async () => {
    mockBrowser([])
    vi.stubGlobal('navigator', { ...navigator, userLanguage: 'zh-CN' })
    timezone = 'Etc/Unknown'

    expect(await service.detectLanguage()).toMatchObject({
      language: 'zh-CN',
      method: 'user_agent',
    })
  })

  it('uses the default language when every detection strategy is unavailable', async () => {
    mockBrowser([])
    timezone = 'Etc/Unknown'

    expect(await service.detectLanguage()).toMatchObject({
      language: 'zh-CN',
      method: 'default',
      confidence: 0.5,
    })
  })

  it('forceRedetect ignores a previously cached result', async () => {
    await service.detectLanguage()
    mockBrowser(['zh-CN'])

    expect(await service.forceRedetect()).toMatchObject({
      language: 'zh-CN',
      method: 'browser',
    })
  })

  it('reports detection statistics and clears the cache through the public API', async () => {
    await service.detectLanguage()
    expect(service.getDetectionStats()).toMatchObject({
      cacheSize: 1,
      lastDetection: Date.now(),
      hasActivePromise: false,
    })

    service.clearCache()
    expect(service.getDetectionStats()).toMatchObject({
      cacheSize: 0,
      lastDetection: undefined,
    })
  })

  it('falls back safely when reading browser languages throws', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('navigator', {
      get languages() {
        throw new Error('Browser languages unavailable')
      },
    })

    expect(await service.detectLanguage()).toMatchObject({
      language: 'en',
      method: 'geolocation',
    })
    expect(errorLog).toHaveBeenCalled()
  })

  it('shares the result between simultaneous detection requests', async () => {
    const [first, second] = await Promise.all([service.detectLanguage(), service.detectLanguage()])
    expect(second).toBe(first)
  })
})
