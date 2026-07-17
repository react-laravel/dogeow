'use client'

import React, { memo } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Category } from '../hooks/useSearchCategories'

interface CategoryTabsProps {
  categories: Category[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
  getCountByCategory: (categoryId: string) => number
}

export const CategoryTabs = memo<CategoryTabsProps>(
  ({ categories, activeCategory, onCategoryChange, getCountByCategory }) => {
    return (
      <div className="mb-4 flex-shrink-0">
        <div className="mb-2 text-sm font-medium">搜索范围</div>
        <div
          className="flex max-h-20 flex-wrap gap-2 overflow-y-auto"
          role="tablist"
          aria-label="搜索范围"
        >
          {categories.map(category => {
            const isActive = activeCategory === category.id
            const count = getCountByCategory(category.id)

            return (
              <Button
                key={category.id}
                size="sm"
                variant={isActive ? 'default' : 'outline'}
                onClick={() => onCategoryChange(category.id)}
                className="h-8 rounded-full px-3 text-xs whitespace-nowrap"
                role="tab"
                aria-selected={isActive}
              >
                {isActive && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                <span>{category.name}</span>
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                      isActive ? 'bg-primary-foreground/18' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Button>
            )
          })}
        </div>
      </div>
    )
  }
)

CategoryTabs.displayName = 'CategoryTabs'
