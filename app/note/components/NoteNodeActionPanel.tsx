'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Edit2, Link as LinkIcon, X, Check, FileText, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateNode } from '@/lib/api/wiki'
import { logger } from '@/lib/logger'
import type { NodeData, ThemeColors } from '../types/graph'

interface NoteNodeActionPanelProps {
  activeNode: NodeData | null
  themeColors: ThemeColors
  isAdmin: boolean
  onCreateChildNode: () => void
  onCreateLink: () => void
  onViewArticle?: () => void
  onEditNode?: () => void
  onDeleteNode?: () => void
  onNodeUpdated: () => void
  onClose: () => void
}

export default function NoteNodeActionPanel({
  activeNode,
  themeColors,
  isAdmin,
  onCreateChildNode,
  onCreateLink,
  onViewArticle,
  onEditNode,
  onDeleteNode,
  onNodeUpdated,
  onClose,
}: NoteNodeActionPanelProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 初始化编辑名称
  useEffect(() => {
    if (activeNode) {
      setEditingName(activeNode.title)
      setIsEditingName(false)
    }
  }, [activeNode])

  // 聚焦输入框
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingName])

  // 开始编辑名称
  const handleStartEditName = useCallback(() => {
    if (!activeNode || !isAdmin) return
    setEditingName(activeNode.title)
    setIsEditingName(true)
  }, [activeNode, isAdmin])

  // 取消编辑名称
  const handleCancelEditName = useCallback(() => {
    setIsEditingName(false)
    setEditingName(activeNode?.title ?? '')
  }, [activeNode])

  // 保存名称
  const handleSaveName = useCallback(async () => {
    if (!activeNode || !isAdmin || !editingName.trim()) {
      handleCancelEditName()
      return
    }

    if (editingName.trim() === activeNode.title) {
      setIsEditingName(false)
      return
    }

    try {
      setIsSaving(true)
      await updateNode(Number(activeNode.id), {
        title: editingName.trim(),
      })
      toast.success('节点名称已更新')
      setIsEditingName(false)
      onNodeUpdated()
    } catch (error) {
      logger.error('更新节点名称失败:', error)
      toast.error('更新失败')
      handleCancelEditName()
    } finally {
      setIsSaving(false)
    }
  }, [activeNode, editingName, isAdmin, onNodeUpdated, handleCancelEditName])

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSaveName()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleCancelEditName()
      }
    },
    [handleSaveName, handleCancelEditName]
  )

  if (!activeNode) return null

  return (
    <div
      role="region"
      aria-label="节点操作"
      style={{
        position: 'absolute',
        bottom: 76,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        background: themeColors.card,
        border: `1px solid ${themeColors.border}`,
        borderRadius: 12,
        padding: isMobile ? 12 : 16,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        minWidth: isMobile ? 'calc(100% - 32px)' : 'auto',
        maxWidth: isMobile ? 'calc(100% - 32px)' : 600,
        touchAction: 'pan-y',
        maxHeight: 'calc(100% - 5.5rem)',
        overflowY: 'auto',
      }}
      onClick={e => e.stopPropagation()} // 防止点击事件冒泡
    >
      {/* 节点名称显示/编辑 */}
      <div className="mb-3 flex min-w-0 items-center gap-2">
        {isEditingName ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              ref={inputRef}
              value={editingName}
              onChange={e => setEditingName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              aria-label="节点名称"
              className="min-w-0 flex-1"
              style={{
                background: themeColors.background,
                color: themeColors.foreground,
                borderColor: themeColors.border,
              }}
            />
            <Button
              size="sm"
              aria-label="保存节点名称"
              onClick={handleSaveName}
              disabled={isSaving || !editingName.trim()}
              style={{
                padding: '4px 8px',
                minWidth: 'auto',
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              aria-label="取消编辑名称"
              onClick={handleCancelEditName}
              disabled={isSaving}
              style={{
                padding: '4px 8px',
                minWidth: 'auto',
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className="min-w-0 flex-1 cursor-pointer break-words font-medium line-clamp-2"
            style={{ color: themeColors.foreground }}
            title={isAdmin ? '点击编辑名称' : activeNode.title}
            role={isAdmin ? 'button' : undefined}
            tabIndex={isAdmin ? 0 : undefined}
            onClick={isAdmin ? handleStartEditName : undefined}
            onKeyDown={event => {
              if (isAdmin && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault()
                handleStartEditName()
              }
            }}
          >
            {activeNode.title}
          </div>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          style={{
            padding: '4px 8px',
            minWidth: 'auto',
          }}
          title="关闭"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {activeNode.slug && onViewArticle && (
          <Button
            variant="outline"
            className="h-10 rounded-xl px-2 text-xs shadow-none has-[>svg]:px-2 sm:text-sm"
            title="查看文章"
            onClick={onViewArticle}
          >
            <FileText className="size-4" />
            查看文章
          </Button>
        )}
        {isAdmin && onEditNode && (
          <Button
            variant="outline"
            className="h-10 rounded-xl px-2 text-xs shadow-none has-[>svg]:px-2 sm:text-sm"
            title="编辑节点"
            onClick={onEditNode}
          >
            <Edit2 className="size-4" />
            编辑节点
          </Button>
        )}
        {isAdmin && (
          <Button
            className="h-10 rounded-xl px-2 text-xs shadow-none has-[>svg]:px-2 sm:text-sm"
            title="创建子节点"
            onClick={onCreateChildNode}
          >
            <Plus className="size-4" />
            创建子节点
          </Button>
        )}
        {isAdmin && (
          <Button
            variant="outline"
            className="h-10 rounded-xl px-2 text-xs shadow-none has-[>svg]:px-2 sm:text-sm"
            title="链接节点"
            onClick={onCreateLink}
          >
            <LinkIcon className="size-4" />
            链接节点
          </Button>
        )}
        {isAdmin && onDeleteNode && (
          <Button
            variant="ghost"
            className="h-10 rounded-xl px-2 text-xs text-destructive has-[>svg]:px-2 sm:text-sm"
            title="删除节点"
            onClick={onDeleteNode}
          >
            <Trash2 className="size-4" />
            删除节点
          </Button>
        )}
      </div>
    </div>
  )
}
