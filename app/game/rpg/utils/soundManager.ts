// 游戏音效管理器
import type { SkillUsedEntry } from '../types'
import { getAllSkillSoundUrls, getSkillSoundUrl } from './skillSoundRegistry'

type SoundEffect =
  | 'combat_start'
  | 'combat_hit'
  | 'combat_victory'
  | 'combat_defeat'
  | 'level_up'
  | 'item_drop'
  | 'skill_use'
  | 'button_click'
  | 'equip'
  | 'gold'
  | 'teleport'

class SoundManager {
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map()
  private audioCache: Map<string, HTMLAudioElement> = new Map()
  private audioBufferCache: Map<string, Promise<AudioBuffer | null>> = new Map()
  private enabled: boolean = true
  private volume: number = 0.3
  // 单例 AudioContext - 避免每次播放音效都创建新实例
  private audioContext: AudioContext | null = null

  constructor() {
    this.loadSounds()
    this.loadSettings()
    this.installAudioUnlockListeners()
  }

  private createAudioContext(): AudioContext | null {
    try {
      const Ctor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      return Ctor ? new Ctor() : null
    } catch (error) {
      console.warn('SoundManager: 无法创建 AudioContext', error)
      return null
    }
  }

  // 获取或创建 AudioContext 单例
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null

    if (this.audioContext?.state === 'closed') {
      this.audioContext = null
      this.audioBufferCache.clear()
    }

    if (!this.audioContext) {
      this.audioContext = this.createAudioContext()
    }

    // 如果 AudioContext 被暂停（浏览器自动暂停策略），尝试恢复
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume().catch(() => {})
    }

    return this.audioContext
  }

  private installAudioUnlockListeners() {
    if (typeof window === 'undefined') return

    const unlock = () => {
      const audioContext = this.getAudioContext()
      if (audioContext?.state === 'suspended') {
        audioContext.resume().catch(() => {})
      }
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('click', unlock)
    }

    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('touchstart', unlock, { passive: true })
    window.addEventListener('click', unlock)
  }

  private loadSounds() {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return

    // 使用浏览器内置的 Web Audio API 或免费音效库
    const soundUrls: Partial<Record<SoundEffect, string>> = {
      // 可以使用免费音效资源，如：
      // - https://freesound.org/
      // - https://www.zapsplat.com/
      // - 或使用 Base64 编码的简短音效
    }

    // 预加载音效（这里使用空音频，实际使用时替换）
    Object.entries(soundUrls).forEach(([key, url]) => {
      if (url) {
        const audio = this.createAudio(url, { silent: true })
        if (!audio) return
        audio.volume = this.volume
        this.sounds.set(key as SoundEffect, audio)
      }
    })

    getAllSkillSoundUrls().forEach(url => {
      try {
        this.getCachedAudio(url, { silent: true })
      } catch {
        // 测试环境或受限浏览器可能没有可构造的 Audio，实际播放时仍会走 Web Audio/fallback。
      }
    })
  }

  private loadSettings() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rpg-sound-settings')
      if (saved) {
        const settings = JSON.parse(saved)
        this.enabled = settings.enabled ?? true
        this.volume = settings.volume ?? 0.3
      }
    }
  }

  private saveSettings() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'rpg-sound-settings',
        JSON.stringify({
          enabled: this.enabled,
          volume: this.volume,
        })
      )
    }
  }

  setCombatTabActive(): void {
    // no-op: 战斗音效不再受标签页切换限制
  }

  private canPlay(): boolean {
    if (!this.enabled || typeof window === 'undefined') return false
    return true
  }

  play(effect: SoundEffect): void {
    if (!this.canPlay()) return

    // 使用 Web Audio API 生成简单音效
    this.playGeneratedSound(effect)
  }

  playSkill(skill?: Pick<SkillUsedEntry, 'name' | 'effect_key'> | null): void {
    if (!this.canPlay() || !skill) return

    const url = getSkillSoundUrl(skill)
    if (!url) {
      this.playGeneratedSound('skill_use')
      return
    }

    void this.playAudioFile(url).then(played => {
      if (!played) {
        this.playGeneratedSkillSound(skill)
      }
    })
  }

  private getCachedAudio(
    url: string,
    options: {
      silent?: boolean
    } = {}
  ): HTMLAudioElement {
    const cached = this.audioCache.get(url)
    if (cached) return cached

    const audio = this.createAudio(url, options)
    if (!audio) {
      throw new Error('Audio constructor unavailable')
    }
    audio.preload = 'auto'
    audio.volume = this.volume
    this.audioCache.set(url, audio)

    return audio
  }

  private createAudio(
    url: string,
    options: {
      silent?: boolean
    } = {}
  ): HTMLAudioElement | null {
    if (typeof Audio === 'undefined') return null

    try {
      return new Audio(url)
    } catch (error) {
      if (!options.silent) {
        console.warn('SoundManager: 当前环境不支持创建 Audio 元素', error)
      }
      return null
    }
  }

  private async playAudioFile(url: string): Promise<boolean> {
    const playedByWebAudio = await this.playAudioBuffer(url)
    if (playedByWebAudio) return true

    try {
      const base = this.getCachedAudio(url)
      const audio = base.cloneNode() as HTMLAudioElement
      audio.preload = 'auto'
      audio.volume = this.volume
      await audio.play()

      return true
    } catch (error) {
      console.warn(`SoundManager: 技能音效播放失败 ${url}`, error)

      return false
    }
  }

  private async loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
    const audioContext = this.getAudioContext()
    if (!audioContext) return null

    const cached = this.audioBufferCache.get(url)
    if (cached) return cached

    const promise = fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response.arrayBuffer()
      })
      .then(buffer => audioContext.decodeAudioData(buffer.slice(0)))
      .catch(error => {
        console.warn(`SoundManager: 技能音效解码失败 ${url}`, error)
        return null
      })

    this.audioBufferCache.set(url, promise)
    return promise
  }

  private async playAudioBuffer(url: string): Promise<boolean> {
    const audioContext = this.getAudioContext()
    if (!audioContext) return false

    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume()
      } catch {
        return false
      }
    }

    const buffer = await this.loadAudioBuffer(url)
    if (!buffer) return false

    try {
      const source = audioContext.createBufferSource()
      const gainNode = audioContext.createGain()
      source.buffer = buffer
      gainNode.gain.value = this.volume
      source.connect(gainNode)
      gainNode.connect(audioContext.destination)
      source.start(audioContext.currentTime)
      return true
    } catch (error) {
      console.warn(`SoundManager: 技能音效播放失败 ${url}`, error)
      return false
    }
  }

  private playGeneratedSkillSound(skill: Pick<SkillUsedEntry, 'name' | 'effect_key'>) {
    const audioContext = this.getAudioContext()
    if (!audioContext) return

    try {
      const profiles: Record<
        string,
        { type: OscillatorType; start: number; end: number; duration: number; volume: number }
      > = {
        heal: { type: 'sine', start: 520, end: 920, duration: 0.32, volume: 0.1 },
        fireball: { type: 'sawtooth', start: 220, end: 520, duration: 0.24, volume: 0.11 },
        'ice-arrow': { type: 'triangle', start: 980, end: 520, duration: 0.2, volume: 0.09 },
        'ice-age': { type: 'triangle', start: 360, end: 120, duration: 0.45, volume: 0.09 },
        lightning: { type: 'square', start: 1400, end: 260, duration: 0.16, volume: 0.08 },
        'chain-lightning': { type: 'square', start: 1100, end: 1800, duration: 0.24, volume: 0.08 },
        meteor: { type: 'sawtooth', start: 160, end: 80, duration: 0.38, volume: 0.12 },
        'meteor-storm': { type: 'sawtooth', start: 180, end: 70, duration: 0.5, volume: 0.12 },
        shield: { type: 'sine', start: 300, end: 420, duration: 0.34, volume: 0.09 },
        pierce: { type: 'triangle', start: 760, end: 1120, duration: 0.14, volume: 0.08 },
        'multi-shot': { type: 'triangle', start: 680, end: 980, duration: 0.22, volume: 0.08 },
        dash: { type: 'sine', start: 900, end: 300, duration: 0.12, volume: 0.07 },
        poison: { type: 'sawtooth', start: 420, end: 260, duration: 0.28, volume: 0.08 },
        dodge: { type: 'sine', start: 720, end: 460, duration: 0.1, volume: 0.07 },
        'arrow-rain': { type: 'triangle', start: 760, end: 360, duration: 0.42, volume: 0.08 },
        'shadow-step': { type: 'sine', start: 260, end: 620, duration: 0.22, volume: 0.08 },
        slash: { type: 'sawtooth', start: 360, end: 120, duration: 0.18, volume: 0.1 },
        buff: { type: 'square', start: 240, end: 640, duration: 0.3, volume: 0.08 },
        charge: { type: 'sawtooth', start: 180, end: 420, duration: 0.26, volume: 0.1 },
        whirlwind: { type: 'triangle', start: 520, end: 840, duration: 0.36, volume: 0.08 },
        rage: { type: 'square', start: 180, end: 320, duration: 0.32, volume: 0.09 },
        execute: { type: 'sawtooth', start: 260, end: 90, duration: 0.24, volume: 0.12 },
      }

      const profile = skill.effect_key
        ? (profiles[skill.effect_key] ?? {
            type: 'sawtooth' as const,
            start: 300,
            end: 600,
            duration: 0.15,
            volume: 0.1,
          })
        : {
            type: 'sawtooth' as const,
            start: 300,
            end: 600,
            duration: 0.15,
            volume: 0.1,
          }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      const now = audioContext.currentTime

      oscillator.type = profile.type
      oscillator.frequency.setValueAtTime(profile.start, now)
      oscillator.frequency.exponentialRampToValueAtTime(profile.end, now + profile.duration)
      gainNode.gain.setValueAtTime(this.volume * profile.volume, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + profile.duration)
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.start(now)
      oscillator.stop(now + profile.duration)
    } catch (error) {
      console.warn('SoundManager: 技能生成音效播放失败', error)
    }
  }

  private playGeneratedSound(effect: SoundEffect) {
    const audioContext = this.getAudioContext()
    if (!audioContext) return

    try {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      gainNode.gain.value = this.volume * 0.1

      switch (effect) {
        case 'combat_start':
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.2)
          break

        case 'combat_hit':
          oscillator.type = 'square'
          oscillator.frequency.setValueAtTime(150, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.05)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.05)
          break

        case 'combat_victory':
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
          oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.1)
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.4)
          break

        case 'combat_defeat':
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.3)
          break

        case 'level_up':
          const now = audioContext.currentTime
          oscillator.frequency.setValueAtTime(523, now) // C5
          oscillator.frequency.setValueAtTime(659, now + 0.1) // E5
          oscillator.frequency.setValueAtTime(784, now + 0.2) // G5
          oscillator.frequency.setValueAtTime(1047, now + 0.3) // C6
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
          oscillator.start(now)
          oscillator.stop(now + 0.5)
          break

        case 'item_drop':
          oscillator.type = 'sine'
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.15)
          break

        case 'skill_use':
          oscillator.type = 'sawtooth'
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.15)
          break

        case 'button_click':
          oscillator.type = 'sine'
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.03)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.03)
          break

        case 'equip':
          oscillator.type = 'square'
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.15)
          break

        case 'gold':
          oscillator.type = 'sine'
          oscillator.frequency.setValueAtTime(1200, audioContext.currentTime)
          oscillator.frequency.setValueAtTime(1500, audioContext.currentTime + 0.05)
          oscillator.frequency.setValueAtTime(1800, audioContext.currentTime + 0.1)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.15)
          break
      }
    } catch (error) {
      console.warn(`SoundManager: 生成音效播放失败 ${effect}`, error)
    }
  }

  toggle() {
    this.enabled = !this.enabled
    this.saveSettings()
    return this.enabled
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    this.sounds.forEach(sound => {
      sound.volume = this.volume
    })
    this.saveSettings()
  }

  isEnabled() {
    return this.enabled
  }

  getVolume() {
    return this.volume
  }
}

// 单例导出
export const soundManager = new SoundManager()
