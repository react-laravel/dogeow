import type { NodeData, GraphPalette } from '../types/graph'

// 图标缓存
const iconCache = new Map<string, HTMLImageElement>()

/** Below this scale, non-focused labels stay hidden (extreme overview → dot placeholders). */
export const GRAPH_LABEL_HIDE_SCALE = 0.28
/** Default / fit zoom should keep labels visible at or above this scale. */
export const GRAPH_LABEL_MIN_SCALE = 0.5
/** Neighbor labels when a node is selected. */
export const GRAPH_NEIGHBOR_LABEL_MIN_SCALE = 0.7
/** After zoomToFit, bump toward this so main names stay clear on first paint. */
export const GRAPH_DEFAULT_READABLE_SCALE = 1.25

/** True when default (non-focused) labels are in dot-placeholder mode. */
export function isGraphLabelHiddenAtScale(globalScale: number): boolean {
  return globalScale < GRAPH_LABEL_MIN_SCALE
}

// 加载图标
const loadIcon = (iconPath: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (iconCache.has(iconPath)) {
      resolve(iconCache.get(iconPath)!)
      return
    }

    const img = new Image()
    img.onload = () => {
      iconCache.set(iconPath, img)
      resolve(img)
    }
    img.onerror = reject
    img.src = iconPath
  })
}

// 预加载根节点图标
loadIcon('/favicon.ico').catch(() => {
  // 如果加载失败，忽略错误
})

function resolveLabelVisibility(options: {
  isActive: boolean
  isHover: boolean
  isNeighbor: boolean
  globalScale: number
}): boolean {
  const { isActive, isHover, isNeighbor, globalScale } = options

  if (isActive || isHover) {
    return true
  }

  if (globalScale < GRAPH_LABEL_HIDE_SCALE) {
    return false
  }

  if (isNeighbor) {
    return globalScale >= GRAPH_NEIGHBOR_LABEL_MIN_SCALE
  }

  return globalScale >= GRAPH_LABEL_MIN_SCALE
}

function resolveMaxChars(isFocused: boolean, globalScale: number): number {
  if (isFocused) return 18
  if (globalScale < 0.85) return 6
  if (globalScale < 1.4) return 10
  return 14
}

export const createNodeCanvasRenderer = (
  activeNode: NodeData | null,
  hoverNode: NodeData | null,
  neighborIds: Set<string>,
  graphPalette: GraphPalette
) => {
  return (node: NodeData, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.title
    const isActive = String(activeNode?.id) === String(node.id)
    const isHover = String(hoverNode?.id) === String(node.id)

    // 使用缓存的邻居集合，避免重复遍历
    const isNeighbor = Boolean(activeNode && !isActive && neighborIds.has(String(node.id)))

    // 检查是否是根节点（标题为"我"或其他根节点标识）
    const isRootNode = node.title === '我' || node.title === 'root' || node.title === 'Root'

    // Prefer shrinking/truncating labels over stacking; far out → keep dots as placeholders.
    const shouldShowLabel = resolveLabelVisibility({
      isActive,
      isHover,
      isNeighbor,
      globalScale,
    })
    // Dot placeholders stay visible when text is LOD-hidden so the overview never looks empty.
    const baseRadius = isRootNode ? 12 : 4
    const radius = !shouldShowLabel && !isRootNode ? Math.max(baseRadius, 5.5) : baseRadius

    // 如果是根节点且有图标，绘制图标
    if (isRootNode && iconCache.has('/favicon.ico')) {
      const icon = iconCache.get('/favicon.ico')!
      const iconSize = 24 // 固定图标大小，确保清晰

      // 启用图像平滑以提高质量
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // 直接绘制图标，不裁剪，保持完整显示
      ctx.drawImage(
        icon,
        (node.x ?? 0) - iconSize / 2,
        (node.y ?? 0) - iconSize / 2,
        iconSize,
        iconSize
      )

      // 如果是激活或悬停状态，添加圆形边框
      if (isActive || isHover) {
        ctx.beginPath()
        ctx.arc(node.x ?? 0, node.y ?? 0, iconSize / 2 + 2, 0, 2 * Math.PI, false)
        ctx.strokeStyle = isActive ? graphPalette.nodeActive : graphPalette.nodeHover
        ctx.lineWidth = 2
        ctx.stroke()
      }
    } else {
      // 普通节点绘制（远距时作为点位占位）
      ctx.beginPath()
      ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, 2 * Math.PI, false)

      if (isActive) {
        ctx.fillStyle = graphPalette.nodeActive
      } else if (isNeighbor) {
        ctx.fillStyle = graphPalette.nodeNeighbor
      } else if (isHover) {
        ctx.fillStyle = graphPalette.nodeHover
      } else {
        ctx.fillStyle = graphPalette.nodeDefault
      }
      ctx.fill()
    }

    if (shouldShowLabel) {
      const isFocused = isActive || isHover
      const maxChars = resolveMaxChars(isFocused, globalScale)
      const displayLabel = label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label
      const scaledFont = Math.min(12 / Math.sqrt(Math.max(globalScale, 0.85)), isFocused ? 12 : 9)
      ctx.font = `${scaledFont}px system-ui, -apple-system, Segoe UI, Roboto`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      if (isActive) {
        ctx.fillStyle = graphPalette.labelActive
      } else if (isNeighbor) {
        ctx.fillStyle = graphPalette.labelNeighbor
      } else {
        ctx.fillStyle = graphPalette.labelDefault
      }

      const labelOffset = isRootNode ? 16 : 6
      ctx.fillText(displayLabel, (node.x ?? 0) + labelOffset, node.y ?? 0)
    }
  }
}

export const createLinkColorGetter = (
  activeNode: NodeData | null,
  activeLink: { id?: number; source?: unknown; target?: unknown } | null,
  graphPalette: GraphPalette
) => {
  return (link: {
    source: string | number | NodeData
    target: string | number | NodeData
    id?: number
  }) => {
    // 如果选中了链接，高亮该链接
    if (activeLink && activeLink.id && link.id === activeLink.id) {
      return graphPalette.linkActive
    }

    // 如果选中了节点，高亮与该节点相关的链接
    if (activeNode) {
      const s =
        typeof link.source === 'string' || typeof link.source === 'number'
          ? String(link.source)
          : String((link.source as NodeData)?.id)
      const t =
        typeof link.target === 'string' || typeof link.target === 'number'
          ? String(link.target)
          : String((link.target as NodeData)?.id)
      if (s === String(activeNode.id) || t === String(activeNode.id)) {
        return graphPalette.linkActive
      }
    }

    return graphPalette.linkMuted
  }
}

export const createLinkWidthGetter = (
  activeNode: NodeData | null,
  activeLink: { id?: number; source?: unknown; target?: unknown } | null
) => {
  return (link: {
    source: string | number | NodeData
    target: string | number | NodeData
    id?: number
  }) => {
    const mutedWidth = 0.7

    // 如果选中了链接，加粗该链接
    if (activeLink && activeLink.id && link.id === activeLink.id) {
      return 3
    }

    // 如果选中了节点，加粗与该节点相关的链接
    if (activeNode) {
      const s =
        typeof link.source === 'string' || typeof link.source === 'number'
          ? String(link.source)
          : String((link.source as NodeData)?.id)
      const t =
        typeof link.target === 'string' || typeof link.target === 'number'
          ? String(link.target)
          : String((link.target as NodeData)?.id)
      if (s === String(activeNode.id) || t === String(activeNode.id)) return 3
    }

    return mutedWidth
  }
}
