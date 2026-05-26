import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThingHeader from '../ThingHeader'
import { Category, Tag, Area, Room, Spot, FilterParams } from '../../types'

vi.mock('../ItemFilters', () => ({
  default: () => <div data-testid="item-filters">Item Filters</div>,
}))

describe('ThingHeader', () => {
  const mockOnApplyFilters = vi.fn()
  const mockOnViewModeChange = vi.fn()
  const mockOnImageSizePresetChange = vi.fn()

  const mockCategories: Category[] = [
    { id: 1, name: '电子产品', parent_id: null },
    { id: 2, name: '手机', parent_id: 1 },
  ]

  const mockTags: Tag[] = [
    { id: 1, name: '重要', color: '#ef4444' },
    { id: 2, name: '常用', color: '#3b82f6' },
  ]

  const mockAreas: Area[] = [{ id: 1, name: '客厅' }]
  const mockRooms: Room[] = [{ id: 1, name: '主客厅', area_id: 1 }]
  const mockSpots: Spot[] = [{ id: 1, name: '沙发', room_id: 1 }]

  const mockFilters: FilterParams = {
    search: '',
    category_id: undefined,
    tags: undefined,
    page: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染分类图标按钮', () => {
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      expect(screen.getByRole('button', { name: '打开分类筛选' })).toBeInTheDocument()
    })

    it('应该渲染标签图标按钮', () => {
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      expect(screen.getByRole('button', { name: '打开标签筛选' })).toBeInTheDocument()
    })

    it('应该渲染视图切换按钮', () => {
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      // 视图切换应该存在（通过 TabsList 渲染）
      const tabsList = document.querySelector('[role="tablist"]')
      expect(tabsList).toBeInTheDocument()
    })

    it('应该渲染筛选按钮', () => {
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      const filterButton = screen.getByRole('button', { name: '打开筛选' })
      expect(filterButton).toBeInTheDocument()
    })

    it('应该在选中分类时保持分类图标按钮', () => {
      const filtersWithCategory = { ...mockFilters, category_id: 1 }
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={filtersWithCategory}
          hasActiveFilters={true}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      expect(screen.getByRole('button', { name: '打开分类筛选' })).toBeInTheDocument()
    })

    it('应该在分类 id 无效时仍显示分类图标按钮', () => {
      const filtersWithInvalidCategory = { ...mockFilters, category_id: 99999 }
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={filtersWithInvalidCategory}
          hasActiveFilters={true}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      expect(screen.getByRole('button', { name: '打开分类筛选' })).toBeInTheDocument()
    })

    it('应该在选中子分类时保持分类图标按钮', () => {
      const filtersWithChildCategory = { ...mockFilters, category_id: 2 }
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={filtersWithChildCategory}
          hasActiveFilters={true}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      expect(screen.getByRole('button', { name: '打开分类筛选' })).toBeInTheDocument()
    })

    it('应该在选中标签时保持标签图标按钮', () => {
      const filtersWithTags = { ...mockFilters, tags: '1,2' }
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={filtersWithTags}
          hasActiveFilters={true}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      expect(screen.getByRole('button', { name: '打开标签筛选' })).toBeInTheDocument()
    })

    it('应该支持数组格式的 tags 过滤参数', () => {
      const filtersWithArrayTags = { ...mockFilters, tags: [1, 2] }
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={filtersWithArrayTags}
          hasActiveFilters={true}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      expect(screen.getByRole('button', { name: '打开标签筛选' })).toBeInTheDocument()
    })
  })

  describe('分类筛选', () => {
    it('应该通过右侧抽屉显示完整分类列表', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      await user.click(screen.getByRole('button', { name: '打开分类筛选' }))

      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByRole('textbox', { name: '搜索分类' })).toBeInTheDocument()
      expect(within(dialog).getByRole('button', { name: '只显示主分类' })).toBeInTheDocument()
      expect(within(dialog).getByText('电子产品')).toBeInTheDocument()
      expect(within(dialog).getByText('手机')).toBeInTheDocument()
    })

    it('应该支持切换为只显示父分类', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      await user.click(screen.getByRole('button', { name: '打开分类筛选' }))
      const dialog = screen.getByRole('dialog')

      await user.click(within(dialog).getByRole('button', { name: '只显示主分类' }))

      expect(within(dialog).getByText('电子产品')).toBeInTheDocument()
      expect(within(dialog).queryByText('手机')).not.toBeInTheDocument()
    })

    it('应该支持搜索分类', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      await user.click(screen.getByRole('button', { name: '打开分类筛选' }))
      const dialog = screen.getByRole('dialog')
      await user.type(within(dialog).getByRole('textbox', { name: '搜索分类' }), '手机')

      expect(within(dialog).getByText('手机')).toBeInTheDocument()
    })

    it('应该在选择分类时调用 onApplyFilters', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      await user.click(screen.getByRole('button', { name: '打开分类筛选' }))
      await user.click(within(screen.getByRole('dialog')).getByText('电子产品'))

      await waitFor(() => {
        expect(mockOnApplyFilters).toHaveBeenCalledWith({
          ...mockFilters,
          category_id: 1,
          page: 1,
        })
      })
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('应该支持清空分类筛选', async () => {
      const user = userEvent.setup()
      const filtersWithCategory = { ...mockFilters, category_id: 1 }
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={filtersWithCategory}
          hasActiveFilters={true}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      await user.click(screen.getByRole('button', { name: '打开分类筛选' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '全部分类' }))

      expect(mockOnApplyFilters).toHaveBeenCalledWith({
        ...filtersWithCategory,
        category_id: undefined,
        page: 1,
      })
    })
  })

  describe('标签筛选', () => {
    it('应该支持打开标签下拉菜单', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      const tagButton = screen.getByRole('button', { name: '打开标签筛选' })
      await user.click(tagButton)

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(within(dialog).getByText('重要')).toBeInTheDocument()
        expect(within(dialog).getByText('常用')).toBeInTheDocument()
      })
    })

    it('应该在选择标签时调用 onApplyFilters', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      const tagButton = screen.getByRole('button', { name: '打开标签筛选' })
      await user.click(tagButton)

      await waitFor(() => {
        expect(within(screen.getByRole('dialog')).getByText('重要')).toBeInTheDocument()
      })

      const importantTag = within(screen.getByRole('dialog')).getByText('重要')
      await user.click(importantTag)

      expect(mockOnApplyFilters).toHaveBeenCalledWith({
        ...mockFilters,
        tags: '1',
        page: 1,
      })
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('应该支持清除所有标签', async () => {
      const user = userEvent.setup()
      const filtersWithTags = { ...mockFilters, tags: '1,2' }
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={filtersWithTags}
          hasActiveFilters={true}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      const tagButton = screen.getByRole('button', { name: '打开标签筛选' })
      await user.click(tagButton)

      await waitFor(() => {
        expect(within(screen.getByRole('dialog')).getByText('清除所有标签')).toBeInTheDocument()
      })

      const clearButton = within(screen.getByRole('dialog')).getByText('清除所有标签')
      await user.click(clearButton)

      expect(mockOnApplyFilters).toHaveBeenCalledWith({
        ...filtersWithTags,
        tags: undefined,
        page: 1,
      })
    })

    it('应该在再次点击已选标签时取消该标签', async () => {
      const user = userEvent.setup()
      const filtersWithTags = { ...mockFilters, tags: '1' }
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={filtersWithTags}
          hasActiveFilters={true}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      await user.click(screen.getByRole('button', { name: '打开标签筛选' }))
      await waitFor(() => {
        expect(within(screen.getByRole('dialog')).getByText('重要')).toBeInTheDocument()
      })

      await user.click(within(screen.getByRole('dialog')).getByText('重要'))

      expect(mockOnApplyFilters).toHaveBeenCalledWith({
        ...filtersWithTags,
        tags: undefined,
        page: 1,
      })
    })

    it('应该在没有标签时显示空提示', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={[]}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      await user.click(screen.getByRole('button', { name: '打开标签筛选' }))

      expect(within(screen.getByRole('dialog')).getByText('暂无标签')).toBeInTheDocument()
    })

    it('应该在按下 Escape 时关闭标签抽屉', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      await user.click(screen.getByRole('button', { name: '打开标签筛选' }))
      await waitFor(() => {
        expect(within(screen.getByRole('dialog')).getByText('重要')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('视图切换', () => {
    it('应该在切换视图时调用 onViewModeChange', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      const buttons = screen.getAllByRole('tab')
      const galleryTab = buttons[1] // 第二个标签是画廊视图

      await user.click(galleryTab)

      expect(mockOnViewModeChange).toHaveBeenCalledWith('gallery')
    })

    it('应该只在画廊模式下显示图片大小下拉按钮', () => {
      const { rerender } = render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
          onImageSizePresetChange={mockOnImageSizePresetChange}
        />
      )

      expect(screen.queryByRole('button', { name: '选择图片大小' })).not.toBeInTheDocument()

      rerender(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="gallery"
          imageSizePreset="md"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
          onImageSizePresetChange={mockOnImageSizePresetChange}
        />
      )

      expect(screen.getByRole('button', { name: '选择图片大小' })).toBeInTheDocument()
    })

    it('应该在画廊模式下通过按钮组下拉选择图片大小', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="gallery"
          imageSizePreset="md"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
          onImageSizePresetChange={mockOnImageSizePresetChange}
        />
      )

      await user.click(screen.getByRole('button', { name: '选择图片大小' }))
      await user.click(await screen.findByTitle(/Set image size to L/))

      expect(mockOnImageSizePresetChange).toHaveBeenCalledWith('lg')
    })
  })

  describe('筛选侧边栏', () => {
    it('应该在按下 Escape 时关闭筛选侧边栏', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      const filterButton = screen.getByRole('button', { name: '打开筛选' })
      await user.click(filterButton)

      await waitFor(() => {
        expect(document.querySelector('[data-slot="sheet-content"]')).toBeInTheDocument()
      })

      const sheetContent = document.querySelector('[data-slot="sheet-content"]') as HTMLElement
      fireEvent.keyDown(sheetContent, { key: 'Escape', code: 'Escape' })

      await waitFor(() => {
        expect(document.querySelector('[data-slot="sheet-content"]')).not.toBeInTheDocument()
      })
    })

    it('应该在点击外部时关闭筛选侧边栏', async () => {
      const user = userEvent.setup()
      render(
        <ThingHeader
          categories={mockCategories}
          tags={mockTags}
          areas={mockAreas}
          rooms={mockRooms}
          spots={mockSpots}
          filters={mockFilters}
          hasActiveFilters={false}
          viewMode="list"
          onApplyFilters={mockOnApplyFilters}
          onViewModeChange={mockOnViewModeChange}
        />
      )

      const filterButton = screen.getByRole('button', { name: '打开筛选' })
      await user.click(filterButton)

      await waitFor(() => {
        expect(document.querySelector('[data-slot="sheet-content"]')).toBeInTheDocument()
      })

      fireEvent.pointerDown(document.body)

      await waitFor(() => {
        expect(document.querySelector('[data-slot="sheet-content"]')).not.toBeInTheDocument()
      })
    })
  })
})
