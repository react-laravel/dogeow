'use client'

import { memo, useEffect, useState } from 'react'
import { Plus, Link as LinkIcon } from 'lucide-react'
import { isAdminSync } from '@/lib/auth'
import { Button } from '@/components/ui/button'

interface GraphViewToolbarProps {
  onNewNode: () => void
  onCreateLink: () => void
}

const GraphViewToolbar = memo(({ onNewNode, onCreateLink }: GraphViewToolbarProps) => {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = () => {
      setIsAdmin(isAdminSync())
    }
    checkAdmin()
  }, [])

  if (!isAdmin) return null

  return (
    <div
      className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto"
      role="toolbar"
      aria-label="图谱操作"
    >
      <Button
        type="button"
        className="h-11 min-w-0 rounded-xl shadow-none"
        onClick={onNewNode}
        title="新建节点"
      >
        <Plus className="h-4 w-4" />
        <span>新建节点</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 min-w-0 rounded-xl shadow-none"
        onClick={onCreateLink}
        title="创建链接"
      >
        <LinkIcon className="h-4 w-4" />
        <span>创建链接</span>
      </Button>
    </div>
  )
})

GraphViewToolbar.displayName = 'GraphViewToolbar'

export default GraphViewToolbar
