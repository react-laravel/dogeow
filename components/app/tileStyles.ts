import type { CSSProperties } from 'react'

/**
 * 首页入口卡片的配色工具：基于 tile.color 生成与主题（亮/暗）协调的样式。
 * 依赖 CSS color-mix，令同一主色在亮色与暗色模式下都保持可读。
 */

/** 浅色底 + 同色系图标：用于「无封面」模式，比纯灰底更有辨识度 */
export function tileTintStyle(color: string): CSSProperties {
  return {
    backgroundColor: `color-mix(in oklab, ${color} 14%, var(--card))`,
    color: `color-mix(in oklab, ${color} 78%, var(--foreground))`,
    boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 18%, transparent)`,
  }
}

/** 实色渐变底 + 白色图标：用于「纯色」模式或封面图加载失败时的兜底 */
export function tileSolidStyle(color: string): CSSProperties {
  return {
    backgroundColor: color,
    backgroundImage: `linear-gradient(150deg, color-mix(in oklab, ${color} 70%, white) 0%, ${color} 55%, color-mix(in oklab, ${color} 82%, black) 100%)`,
    boxShadow: `0 10px 24px -12px color-mix(in oklab, ${color} 75%, transparent), inset 0 1px 0 rgb(255 255 255 / 0.28)`,
    color: '#fff',
  }
}
