import { memo, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TagSelector, Tag } from '@/components/ui/tag-selector'
import type { CategorySelection } from '../../CategoryTreeSelect'
import type { FilterState } from '../types'
import type { Category } from '@/app/thing/types'

interface BasicFiltersTabContentProps {
  filters: FilterState
  selectedCategory: CategorySelection | undefined
  categories: Category[]
  tags: Tag[]
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onStatusChange: (value: string) => void
  onIsPublicChange: (value: boolean | null) => void
  onTagsChange: (selectedTags: string[]) => void
  onCategorySelect: (type: 'parent' | 'child', id: number | null) => void
}

export const BasicFiltersTabContent = memo<BasicFiltersTabContentProps>(
  ({
    filters,
    selectedCategory,
    categories,
    tags,
    onNameChange,
    onDescriptionChange,
    onStatusChange,
    onIsPublicChange,
    onTagsChange,
    onCategorySelect,
  }) => {
    const categoryOptions = useMemo(() => {
      const parentCategories = categories.filter(category => !category.parent_id)
      const childCategories = categories.filter(category => category.parent_id)

      return [
        { value: 'none', label: '全部分类', type: 'parent' as const, id: null },
        ...parentCategories.flatMap(parent => {
          const children = childCategories
            .filter(child => child.parent_id === parent.id)
            .map(child => ({
              value: `child:${child.id}`,
              label: `${parent.name} / ${child.name}`,
              optionLabel: `└ ${child.name}`,
              type: 'child' as const,
              id: child.id,
            }))

          return [
            {
              value: `parent:${parent.id}`,
              label: parent.name,
              type: 'parent' as const,
              id: parent.id,
            },
            ...children,
          ]
        }),
      ]
    }, [categories])

    const selectedCategoryValue = selectedCategory
      ? `${selectedCategory.type}:${selectedCategory.id}`
      : 'none'
    const categoryValue = categoryOptions.some(option => option.value === selectedCategoryValue)
      ? selectedCategoryValue
      : 'none'

    const selectClassName =
      'bg-background border-input text-foreground h-9 w-full rounded-md border px-2.5 text-sm focus:border-primary focus:ring-primary'

    const handleCategoryChange = (value: string) => {
      if (value === 'none') {
        onCategorySelect('parent', null)
        return
      }

      const [type, id] = value.split(':')
      onCategorySelect(type as 'parent' | 'child', Number(id))
    }

    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">名称</Label>
          <Input
            value={filters.name}
            onChange={e => onNameChange(e.target.value)}
            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary h-9 border text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">描述</Label>
          <Input
            value={filters.description}
            onChange={e => onDescriptionChange(e.target.value)}
            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary h-9 border text-sm"
          />
        </div>

        {/* 分类筛选：父子级联，可清空 */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">分类</Label>
          <select
            value={categoryValue}
            onChange={event => handleCategoryChange(event.target.value)}
            className={selectClassName}
            aria-label="分类"
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {'optionLabel' in option ? option.optionLabel : option.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground mt-2 text-xs"
            onClick={() => onCategorySelect('parent', null)}
            disabled={!selectedCategory}
          >
            清空分类筛选
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">状态</Label>
          <div className="bg-muted border-border rounded-lg border px-2 py-0.5">
            <select
              value={filters.status || 'all'}
              onChange={event => onStatusChange(event.target.value)}
              className={`${selectClassName} border-none`}
              aria-label="状态"
            >
              <option value="all">全部状态</option>
              <option value="active">使用中</option>
              <option value="archived">已归档</option>
              <option value="expired">已过期</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">公开状态</Label>
          <select
            value={
              filters.is_public === null ? 'null' : filters.is_public === true ? 'true' : 'false'
            }
            onChange={event =>
              onIsPublicChange(event.target.value === 'null' ? null : event.target.value === 'true')
            }
            className={selectClassName}
            aria-label="公开状态"
          >
            <option value="null">所有物品</option>
            <option value="true">公开</option>
            <option value="false">私有</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">标签</Label>
          <div className="bg-muted border-border rounded-lg border px-2 py-0.5">
            <TagSelector
              tags={tags}
              selectedTags={
                typeof filters.tags === 'string'
                  ? filters.tags.split(',').filter(Boolean)
                  : Array.isArray(filters.tags)
                    ? filters.tags.map(t => t.toString())
                    : []
              }
              onChange={onTagsChange}
              placeholder="选择标签"
              dropdownDirection="up"
            />
          </div>
        </div>
      </div>
    )
  }
)

BasicFiltersTabContent.displayName = 'BasicFiltersTabContent'
