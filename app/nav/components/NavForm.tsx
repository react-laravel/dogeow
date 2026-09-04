'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useNavStore } from '@/app/nav/stores/navStore'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Combobox } from '@/components/ui/combobox'
import { apiRequest } from '@/lib/api'
import { useTranslation } from '@/hooks/useTranslation'
import { NavItem } from '@/app/nav/types'

type FormData = {
  nav_category_id: string
  name: string
  url: string
  is_visible: boolean
  is_new_window: boolean
  sort_order: number
  description?: string
  icon?: string
}

// Keep schema identity stable across language/store re-renders so RHF
// does not thrash the resolver (field values still live in RHF state).
const navItemSchema = z.object({
  nav_category_id: z.string().min(1, '请选择分类'),
  name: z.string().min(1, '名称不能为空').max(50, '名称不能超过50个字符'),
  url: z.string().url('请输入有效的URL').min(1, 'URL不能为空'),
  description: z.string().optional(),
  icon: z.string().optional(),
  is_visible: z.boolean(),
  is_new_window: z.boolean(),
  sort_order: z.coerce.number().int().nonnegative(),
})

interface NavFormProps {
  item?: NavItem
}

export function NavForm({ item }: NavFormProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const fetchAllCategories = useNavStore(state => state.fetchAllCategories)
  const allCategories = useNavStore(state => state.allCategories)
  const createItem = useNavStore(state => state.createItem)
  const updateItem = useNavStore(state => state.updateItem)
  const createCategory = useNavStore(state => state.createCategory)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  const isEditMode = !!item

  const form = useForm<FormData>({
    resolver: zodResolver(navItemSchema),
    defaultValues: {
      nav_category_id: item?.nav_category_id.toString() ?? '',
      name: item?.name ?? '',
      url: item?.url ?? '',
      description: item?.description ?? '',
      icon: item?.icon ?? '',
      is_visible: item?.is_visible ?? true,
      is_new_window: item?.is_new_window ?? true,
      sort_order: item?.sort_order ?? 0,
    },
  })

  useEffect(() => {
    void fetchAllCategories()
  }, [fetchAllCategories])

  const handleCreateCategory = async (categoryName: string) => {
    try {
      const newCategory = await createCategory({
        name: categoryName,
        is_visible: true,
        sort_order: 0,
      })
      form.setValue('nav_category_id', newCategory.id.toString())
      toast.success(
        t('nav.toast.category_created', '已创建分类 "{name}"').replace('{name}', categoryName)
      )
    } catch (error) {
      toast.error(
        t('nav.toast.category_create_failed', '创建分类失败：') +
          (error instanceof Error ? error.message : t('common.unknown_error', '未知错误'))
      )
    }
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)

    try {
      const navItemData = {
        ...data,
        nav_category_id: Number(data.nav_category_id),
      }

      const toastId = toast.loading(
        isEditMode
          ? t('nav.toast.updating', '正在更新导航项...')
          : t('nav.toast.creating', '正在创建导航项...')
      )

      if (isEditMode) {
        await updateItem(item.id, navItemData)
        toast.success(t('nav.toast.updated', '导航项更新成功'), { id: toastId })
      } else {
        await createItem(navItemData)
        toast.success(t('nav.toast.created', '导航项创建成功'), { id: toastId })
      }

      router.push('/nav')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('nav.toast.error', '发生错误，请重试'))
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions =
    (allCategories ?? [])
      .filter(category => category && typeof category === 'object' && category.id !== undefined)
      .map(category => ({
        value: category.id.toString(),
        label: category.name || t('nav.unnamed_category', '未命名分类'),
      })) ?? []

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nav_category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.category', '分类')}</FormLabel>
              <FormControl>
                <Combobox
                  options={categoryOptions}
                  value={field.value}
                  onChange={field.onChange}
                  onCreateOption={handleCreateCategory}
                  placeholder={t('nav.form.select_category', '选择分类')}
                  emptyText={t('nav.form.no_category', '没有找到分类')}
                  createText={t('nav.form.create_category', '创建分类')}
                  searchText={t('nav.form.search_category', '搜索分类...')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nav.form.url', '网站地址')}</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nav.form.site_name', '网站名称')}</FormLabel>
              <div className="flex items-center gap-2">
                {form.watch('icon') && (
                  <Image
                    src={form.watch('icon')!}
                    alt={t('nav.form.site_icon', '网站图标')}
                    width={32}
                    height={32}
                    className="h-8 w-8 border bg-white"
                    style={{ minWidth: 32, minHeight: 32 }}
                  />
                )}
                <FormControl>
                  <Input
                    placeholder={t('nav.form.site_name_placeholder', '输入网站名称')}
                    {...field}
                  />
                </FormControl>
                {!isEditMode && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={fetching}
                    onClick={async () => {
                      const url = form.getValues('url')
                      if (!url) {
                        toast.error(t('nav.toast.url_required_first', '请先填写网站地址'))
                        return
                      }
                      setFetching(true)
                      try {
                        const data = await apiRequest<{ title?: string; favicon?: string }>(
                          `fetch-title?url=${encodeURIComponent(url)}`,
                          'GET'
                        )
                        if (data.title) {
                          form.setValue('name', data.title)
                          toast.success(t('nav.toast.title_fetched', '已自动获取网站名称'))
                        }
                        if (data.favicon) {
                          form.setValue('icon', data.favicon)
                        }
                      } catch {
                        toast.error(t('nav.toast.fetch_failed', '获取失败'))
                      } finally {
                        setFetching(false)
                      }
                    }}
                  >
                    {fetching
                      ? t('nav.form.fetching', '获取中...')
                      : t('nav.form.auto_fetch', '自动获取')}
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.description', '描述')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('nav.form.description_placeholder', '网站简短描述 (选填)')}
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_new_window"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between">
              <FormLabel className="text-base">{t('nav.form.new_window', '新窗口打开')}</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_visible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between">
              <FormLabel className="text-base">{t('nav.form.visible', '显示')}</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sort_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nav.form.sort_order', '排序 (数字越小，排序越靠前)')}</FormLabel>
              <FormControl>
                <Input type="number" min="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? isEditMode
              ? t('nav.form.updating', '更新中...')
              : t('nav.form.creating', '创建中...')
            : isEditMode
              ? t('nav.form.update', '更新导航项')
              : t('nav.form.create', '创建导航项')}
        </Button>
      </form>
    </Form>
  )
}
