'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { forceCollide } from 'd3-force-3d'
import { deleteNode, type WikiNode } from '@/lib/api/wiki'
import { isAdminSync } from '@/lib/auth'
import { logger } from '@/lib/logger'
import NoteNodeEditor from './NoteNodeEditor'
import NoteLinkCreator from './NoteLinkCreator'
import { toast } from 'sonner'
import { nodeDataToWikiNode } from '../utils/themeUtils'
import {
  createNodeCanvasRenderer,
  createLinkColorGetter,
  createLinkWidthGetter,
  GRAPH_DEFAULT_READABLE_SCALE,
} from '../utils/nodeRenderer'
import { useGraphData } from '../hooks/useGraphData'
import { useArticleLoader } from '../hooks/useArticleLoader'
import { useThemeColors } from '../hooks/useThemeColors'
import { useGraphFilter } from '../hooks/useGraphFilter'
import { useGraphPalette } from '../hooks/useGraphPalette'
import { useGraphZoom } from '../hooks/useGraphZoom'
import { useZoomFilter } from '../hooks/useZoomFilter'
import NoteGraphToolbar from './NoteGraphToolbar'
import { GraphZoomControls } from './GraphZoomControls'
import { NoteArticleDialog } from './NoteArticleDialog'
import { NoteGraphEmptyState } from './NoteGraphEmptyState'
import { NoteGraphLoadingState } from './NoteGraphLoadingState'
import NoteNodeActionPanel from './NoteNodeActionPanel'
import NoteLinkActionPanel from './NoteLinkActionPanel'
import type { NodeData, LinkData, ForceGraphInstance } from '../types/graph'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
})

type RefLike<T> = {
  current: T
}

interface GraphViewProps {
  query?: string
  onNewNodeRef?: RefLike<(() => void) | null>
  onCreateLinkRef?: RefLike<(() => void) | null>
}

export default function GraphView({ query = '', onNewNodeRef, onCreateLinkRef }: GraphViewProps) {
  const router = useRouter()
  const isDraggingRef = useRef<boolean>(false)
  const hasFittedRef = useRef(false)
  const [hoverNode, setHoverNode] = useState<NodeData | null>(null)
  const [activeNode, setActiveNode] = useState<NodeData | null>(null)
  const [activeLink, setActiveLink] = useState<LinkData | null>(null)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [showNeighborsOnly, setShowNeighborsOnly] = useState<boolean>(false)
  const [editorOpen, setEditorOpen] = useState<boolean>(false)
  const [editingNode, setEditingNode] = useState<WikiNode | null>(null)
  const [templateNode, setTemplateNode] = useState<WikiNode | null>(null)
  const [linkCreatorOpen, setLinkCreatorOpen] = useState<boolean>(false)
  const [isAdmin] = useState<boolean>(() => isAdminSync())
  const [selectTargetCallback, setSelectTargetCallback] = useState<
    ((nodeId: number) => void) | null
  >(null)
  const [isSelectingFromGraph, setIsSelectingFromGraph] = useState<boolean>(false)

  // 使用自定义 hooks
  const { nodes, setNodes, links, setLinks, loading, fgRef, loadGraphData, resumeGraphAnimation } =
    useGraphData()
  const {
    articleHtml,
    articleRaw,
    articleJson,
    loadingArticle,
    articleError,
    loadArticle,
    resetArticle,
  } = useArticleLoader()
  const { isDark, themeColors } = useThemeColors()
  const { filtered, neighborIds } = useGraphFilter(
    nodes,
    links,
    query,
    showNeighborsOnly,
    activeNode
  )
  const graphPalette = useGraphPalette(isDark, themeColors)
  const { restoreView, handleZoom, getZoom, lastZoomRef } = useGraphZoom()

  // 使用缩放过滤器
  useZoomFilter(fgRef)

  const fitGraphToView = useCallback(
    (options?: { bumpReadable?: boolean; durationMs?: number }) => {
      const graph = fgRef.current
      if (!graph || typeof graph.zoomToFit !== 'function') return

      const durationMs = options?.durationMs ?? 400
      // Smaller padding = closer fit so more labels land above the LOD threshold.
      graph.zoomToFit(durationMs, 28)

      if (options?.bumpReadable === false) return

      window.setTimeout(() => {
        const current = getZoom()
        if (
          current > 0 &&
          current < GRAPH_DEFAULT_READABLE_SCALE &&
          typeof graph.zoom === 'function'
        ) {
          graph.zoom(GRAPH_DEFAULT_READABLE_SCALE, 280)
        }
      }, durationMs + 40)
    },
    [fgRef, getZoom]
  )

  const handleZoomIn = useCallback(() => {
    const graph = fgRef.current
    if (!graph || typeof graph.zoom !== 'function') return
    const next = Math.min((lastZoomRef.current || 1) * 1.35, 8)
    graph.zoom(next, 200)
  }, [fgRef, lastZoomRef])

  const handleZoomOut = useCallback(() => {
    const graph = fgRef.current
    if (!graph || typeof graph.zoom !== 'function') return
    const next = Math.max((lastZoomRef.current || 1) / 1.35, 0.15)
    graph.zoom(next, 200)
  }, [fgRef, lastZoomRef])

  const handleFitClick = useCallback(() => {
    hasFittedRef.current = true
    fitGraphToView({ bumpReadable: true, durationMs: 350 })
  }, [fitGraphToView])

  // 初始化加载数据
  useEffect(() => {
    loadGraphData()
  }, [loadGraphData])

  // Configure force layout once the graph instance is ready / data changes.
  useEffect(() => {
    if (loading || nodes.length === 0) {
      return
    }

    const graph = fgRef.current
    if (!graph || typeof graph.d3Force !== 'function') {
      return
    }

    try {
      // Minimum spacing: push nodes apart, lengthen links, and add collision radius.
      const charge = graph.d3Force('charge') as { strength?: (value: number) => unknown } | null
      charge?.strength?.(-320)

      const link = graph.d3Force('link') as {
        distance?: (value: number) => unknown
        strength?: (value: number) => unknown
      } | null
      link?.distance?.(120)
      link?.strength?.(0.4)

      graph.d3Force('collide', forceCollide(20))

      hasFittedRef.current = false
      resumeGraphAnimation()
    } catch (error) {
      logger.warn('配置图谱力导向参数失败:', error)
    }
  }, [fgRef, loading, nodes.length, links.length, resumeGraphAnimation])

  // 处理节点点击
  const handleNodeClick = useCallback(
    (node: NodeData) => {
      // 如果正在从图谱选择目标节点，则选择为目标节点（不需要对话框打开）
      if (selectTargetCallback) {
        selectTargetCallback(Number(node.id))
        setSelectTargetCallback(null)
        setIsSelectingFromGraph(false)
        return
      }

      // 点击节点时清除链接选择
      setActiveLink(null)

      if (String(activeNode?.id) === String(node.id)) {
        // 重复点击已选中的节点，取消选中
        setActiveNode(null)
        setShowNeighborsOnly(false)
      } else {
        // 选中新节点（不恢复动画，避免布局偏移）
        setActiveNode(node)
      }
      // 保持当前缩放级别，防止点击触发默认缩放
      requestAnimationFrame(() => restoreView(fgRef))
    },
    [activeNode, restoreView, fgRef, selectTargetCallback]
  )

  // 处理链接点击
  const handleLinkClick = useCallback(
    (link: LinkData) => {
      // 点击链接时清除节点选择
      setActiveNode(null)
      setShowNeighborsOnly(false)

      if (activeLink && activeLink.id === link.id) {
        // 重复点击已选中的链接，取消选中
        setActiveLink(null)
      } else {
        // 选中新链接
        setActiveLink(link)
      }
    },
    [activeLink]
  )

  // 处理节点拖拽
  const handleNodeDrag = useCallback(() => {
    isDraggingRef.current = true
    // 拖动时恢复动画以便节点可以移动
    resumeGraphAnimation()
  }, [resumeGraphAnimation])

  const handleNodeDragEnd = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  // 处理节点右键点击
  const handleNodeRightClick = useCallback(
    (node: NodeData) => {
      setActiveNode(node)

      if (isAdmin) {
        // 管理员：显示编辑菜单
        const matchedNode = nodes.find(currentNode => String(currentNode.id) === String(node.id))
        if (matchedNode) {
          setEditingNode({
            id: Number(matchedNode.id),
            title: matchedNode.title,
            slug: matchedNode.slug,
            tags: matchedNode.tags,
            summary: matchedNode.summary,
          } as WikiNode)
          setEditorOpen(true)
        }
      } else if (node.slug) {
        // 非管理员：打开文章
        setDialogOpen(true)
        resetArticle()
        loadArticle(node.slug)
      }
    },
    [isAdmin, nodes, loadArticle, resetArticle]
  )

  // 处理新建节点
  const handleNewNode = useCallback(() => {
    setEditingNode(null)
    const base = activeNode ? nodeDataToWikiNode(activeNode) : null
    setTemplateNode(base)
    setEditorOpen(true)
  }, [activeNode])

  // 处理创建子节点（以当前选中节点为模板）
  const handleCreateChildNode = useCallback(() => {
    if (!activeNode) return
    setEditingNode(null)
    const base = nodeDataToWikiNode(activeNode)
    setTemplateNode(base)
    setEditorOpen(true)
  }, [activeNode])

  // 处理创建链接
  const handleCreateLink = useCallback(() => {
    setLinkCreatorOpen(true)
  }, [])

  // 暴露方法给父组件
  useEffect(() => {
    if (onNewNodeRef) {
      onNewNodeRef.current = handleNewNode
    }
    if (onCreateLinkRef) {
      onCreateLinkRef.current = handleCreateLink
    }
    return () => {
      if (onNewNodeRef) {
        onNewNodeRef.current = null
      }
      if (onCreateLinkRef) {
        onCreateLinkRef.current = null
      }
    }
  }, [handleNewNode, handleCreateLink, onNewNodeRef, onCreateLinkRef])

  // 处理编辑节点
  const handleEditNode = useCallback(() => {
    if (!activeNode) return
    const node = nodes.find(n => String(n.id) === String(activeNode.id))
    if (node) {
      setTemplateNode(null)
      setEditingNode({
        id: Number(node.id),
        title: node.title,
        slug: node.slug,
        tags: node.tags,
        summary: node.summary,
      } as WikiNode)
      setEditorOpen(true)
    }
  }, [activeNode, nodes])

  // 处理删除节点
  const handleDeleteNode = useCallback(async () => {
    if (!activeNode) return
    if (!confirm(`确定要删除节点"${activeNode.title}"吗？这将同时删除所有相关链接。`)) {
      return
    }
    try {
      await deleteNode(Number(activeNode.id))
      toast.success('节点已删除')
      setActiveNode(null)
      loadGraphData()
    } catch (error) {
      logger.error('删除节点失败:', error)
      toast.error('删除失败')
    }
  }, [activeNode, loadGraphData])

  // 处理查看文章
  const handleViewArticle = useCallback(async () => {
    if (!activeNode?.slug) return
    setDialogOpen(true)
    resetArticle()
    loadArticle(activeNode.slug)
  }, [activeNode, loadArticle, resetArticle])

  // 处理编辑文章
  const handleEditArticle = useCallback(() => {
    if (!activeNode?.id) return
    router.push(`/note/edit/${activeNode.id}`)
  }, [activeNode, router])

  // 处理取消选中
  const handleClearSelection = useCallback(() => {
    setActiveNode(null)
    setActiveLink(null)
    setShowNeighborsOnly(false)
  }, [])

  // 节点渲染函数
  const nodeCanvasObject = useCallback(
    (node: NodeData, ctx: CanvasRenderingContext2D, globalScale: number) => {
      createNodeCanvasRenderer(
        activeNode,
        hoverNode,
        neighborIds,
        graphPalette
      )(node, ctx, globalScale)
    },
    [activeNode, hoverNode, neighborIds, graphPalette]
  )

  // 链接颜色获取函数
  const linkColor = useCallback(
    (link: LinkData) => createLinkColorGetter(activeNode, activeLink, graphPalette)(link),
    [activeNode, activeLink, graphPalette]
  )

  // 链接宽度获取函数
  const linkWidth = useCallback(
    (link: LinkData) => createLinkWidthGetter(activeNode, activeLink)(link),
    [activeNode, activeLink]
  )

  return (
    <div
      style={{
        position: 'relative',
        height: 'calc(100vh - 200px)',
        background: themeColors.background,
        color: themeColors.foreground,
      }}
    >
      {loading && <NoteGraphLoadingState themeColors={themeColors} isDark={isDark} />}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <NoteGraphToolbar
          query={query}
          onQueryChange={() => {}}
          isAdmin={isAdmin}
          activeNode={activeNode}
          nodes={nodes}
          themeColors={themeColors}
          onNewNode={handleNewNode}
          onEditNode={handleEditNode}
          onDeleteNode={handleDeleteNode}
          onCreateLink={handleCreateLink}
          onViewArticle={handleViewArticle}
          onEditArticle={handleEditArticle}
          onClearSelection={handleClearSelection}
        />

        {!loading && nodes.length === 0 && (
          <NoteGraphEmptyState isAdmin={isAdmin} themeColors={themeColors} />
        )}

        <ForceGraph2D
          ref={fgRef as React.RefObject<any>}
          graphData={filtered}
          nodeId="id"
          nodeLabel={node => (node as NodeData).title}
          linkDirectionalArrowLength={4}
          linkColor={link => linkColor(link as LinkData)}
          linkWidth={link => linkWidth(link as LinkData)}
          backgroundColor={graphPalette.background}
          onNodeHover={node => setHoverNode((node as NodeData | null) ?? null)}
          onNodeClick={node => handleNodeClick(node as NodeData)}
          onNodeDrag={handleNodeDrag}
          onNodeDragEnd={handleNodeDragEnd}
          onNodeRightClick={node => handleNodeRightClick(node as NodeData)}
          onLinkClick={link => handleLinkClick(link as LinkData)}
          nodeCanvasObjectMode={() => 'replace'}
          nodeCanvasObject={(node, ctx, globalScale) =>
            nodeCanvasObject(node as NodeData, ctx, globalScale)
          }
          nodePointerAreaPaint={(node, color, ctx) => {
            // 绘制透明的点击区域，保持点击功能但不可见
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(node.x ?? 0, node.y ?? 0, 8, 0, 2 * Math.PI, false)
            ctx.fill()
          }}
          cooldownTime={showNeighborsOnly ? 2500 : 4000}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.35}
          d3AlphaMin={0.001}
          nodeRelSize={8}
          onZoom={transform => handleZoom(fgRef, transform)}
          onEngineStop={() => {
            if (!fgRef.current) return
            try {
              if (!hasFittedRef.current) {
                fitGraphToView({ bumpReadable: true, durationMs: 400 })
                hasFittedRef.current = true
              }
              if (typeof fgRef.current.pauseAnimation === 'function') {
                fgRef.current.pauseAnimation()
              }
            } catch {
              // 忽略暂停失败的错误
            }
          }}
        />

        {!loading && nodes.length > 0 && (
          <GraphZoomControls
            themeColors={themeColors}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFit={handleFitClick}
          />
        )}
      </div>

      <NoteArticleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        activeNode={activeNode}
        articleHtml={articleHtml}
        articleRaw={articleRaw}
        articleJson={articleJson}
        loadingArticle={loadingArticle}
        articleError={articleError}
        isDark={isDark}
        themeColors={themeColors}
      />

      {/* 节点编辑器 */}
      <NoteNodeEditor
        node={editingNode}
        templateNode={editingNode ? null : templateNode}
        open={editorOpen}
        onOpenChange={open => {
          setEditorOpen(open)
          if (!open) {
            setEditingNode(null)
            setTemplateNode(null)
          }
        }}
        onSuccess={() => {
          loadGraphData()
        }}
      />

      {/* 链接创建器 */}
      <NoteLinkCreator
        nodes={nodes.map(n => ({
          id: Number(n.id),
          title: n.title,
          slug: n.slug,
          tags: n.tags,
          summary: n.summary,
        }))}
        open={linkCreatorOpen}
        onOpenChange={open => {
          setLinkCreatorOpen(open)
          // 只有在不是从图谱选择模式时才清除回调
          if (!open && !isSelectingFromGraph) {
            setSelectTargetCallback(null)
          }
        }}
        onSuccess={() => {
          loadGraphData()
        }}
        sourceNodeId={activeNode ? Number(activeNode.id) : undefined}
        onSelectTargetFromGraph={callback => {
          setIsSelectingFromGraph(true)
          setSelectTargetCallback(() => callback)
        }}
        onCancelSelectFromGraph={() => {
          setIsSelectingFromGraph(false)
          setSelectTargetCallback(null)
        }}
      />

      {/* 节点操作面板 */}
      {activeNode && (
        <NoteNodeActionPanel
          activeNode={activeNode}
          themeColors={themeColors}
          isAdmin={isAdmin}
          onCreateChildNode={handleCreateChildNode}
          onCreateLink={handleCreateLink}
          onViewArticle={handleViewArticle}
          onEditNode={handleEditNode}
          onDeleteNode={handleDeleteNode}
          onNodeUpdated={loadGraphData}
          onClose={handleClearSelection}
        />
      )}

      {/* 链接操作面板 */}
      {activeLink && (
        <NoteLinkActionPanel
          activeLink={activeLink}
          nodes={nodes}
          themeColors={themeColors}
          isAdmin={isAdmin}
          onLinkDeleted={loadGraphData}
          onClose={handleClearSelection}
        />
      )}
    </div>
  )
}
