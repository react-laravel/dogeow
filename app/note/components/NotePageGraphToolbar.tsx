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
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onNewNode} title="新建节点">
        <Plus className="h-4 w-4" />
        <span>新建节点</span>
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onCreateLink} title="创建链接">
        <LinkIcon className="h-4 w-4" />
        <span>创建链接</span>
      </Button>
    </div>
  )
})

GraphViewToolbar.displayName = 'GraphViewToolbar'

export default GraphViewToolbar
