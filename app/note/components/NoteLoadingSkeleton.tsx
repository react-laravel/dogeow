'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const SKELETON_ITEMS_COUNT = 3

const LoadingSkeleton = memo(() => (
  <div className="animate-pulse space-y-4" role="status" aria-label="加载中">
    {Array.from({ length: SKELETON_ITEMS_COUNT }, (_, i) => (
      <Card key={i} className="overflow-hidden">
        <CardHeader className="space-y-2 pb-2">
          <div className="bg-muted h-5 w-1/3 max-w-[12rem] rounded" />
          <div className="bg-muted h-4 w-1/4 max-w-[8rem] rounded" />
        </CardHeader>
        <CardContent className="space-y-2 py-2">
          <div className="bg-muted h-3 w-full rounded" />
          <div className="bg-muted h-3 w-5/6 rounded" />
        </CardContent>
      </Card>
    ))}
  </div>
))

LoadingSkeleton.displayName = 'LoadingSkeleton'

export default LoadingSkeleton
