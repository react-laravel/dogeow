'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckSquare,
  ExternalLink,
  FolderGit2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import {
  deleteWatchedPackage,
  deleteWatchedPackages,
  listWatchedPackages,
  previewRepoDependencies,
  refreshWatchedPackage,
  saveWatchedPackages,
  type RepoDependencyPreview,
  type RepoDependencyPreviewItem,
  type WatchedPackage,
  type WatchLevel,
} from '@/lib/api/repo-watch'

type RepoSettingsPreview = Omit<RepoDependencyPreview, 'manifests'> & {
  manifests: Array<{
    ecosystem: 'npm' | 'composer'
    path: string
    dependencies: Array<RepoDependencyPreviewItem & { selected: boolean }>
  }>
}

type SelectedDependency = RepoDependencyPreviewItem & {
  ecosystem: 'npm' | 'composer'
  manifest_path: string
  selected: boolean
}

type VersionFilter = 'all' | WatchLevel

const VERSION_FILTER_OPTIONS: Array<{ value: VersionFilter; label: string }> = [
  { value: 'all', label: '全部更新' },
  { value: 'major', label: '只看大版本' },
  { value: 'minor', label: '只看功能版本' },
  { value: 'patch', label: '只看小版本' },
]

const DEFAULT_SAVE_LEVEL: WatchLevel = 'minor'

const formatDateTime = (value?: string | null) => {
  if (!value) return '暂无'

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const repoKeyOf = (item: Pick<WatchedPackage, 'source_owner' | 'source_repo'>) =>
  item.source_owner && item.source_repo ? `${item.source_owner}/${item.source_repo}` : 'no-repo'

const repoLabelOf = (item: Pick<WatchedPackage, 'source_owner' | 'source_repo'>) =>
  repoKeyOf(item) === 'no-repo' ? '无仓库' : `${item.source_owner}/${item.source_repo}`

const getLeadingSymbolPrefix = (value?: string | null) => {
  if (!value) return ''

  const match = value.match(/^[^\d]*/)
  return match?.[0] ?? ''
}

const renderVersionDiff = (currentVersion?: string | null, latestVersion?: string | null) => {
  if (!latestVersion) {
    return <span>未知</span>
  }

  const currentParts = (currentVersion ?? '').split('.')
  const latestParts = latestVersion.split('.')

  return latestParts.map((part, index) => {
    const changed = currentParts[index] !== part

    return (
      <span
        key={`${part}-${index}`}
        className={changed ? 'text-green-600 dark:text-green-400' : ''}
      >
        {index > 0 ? '.' : ''}
        {part}
      </span>
    )
  })
}

type RepoWatchToolProps = {
  showAddPanel: boolean
  setShowAddPanel: (value: boolean | ((prev: boolean) => boolean)) => void
  toolView: 'packages' | 'repo-settings'
  setToolView: (view: 'packages' | 'repo-settings') => void
}

export default function RepoWatchTool({
  showAddPanel,
  setShowAddPanel,
  toolView,
  setToolView,
}: RepoWatchToolProps) {
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState<RepoDependencyPreview | null>(null)
  const [dependencies, setDependencies] = useState<SelectedDependency[]>([])
  const [watchedPackages, setWatchedPackages] = useState<WatchedPackage[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeAction, setActiveAction] = useState<{
    id: number
    type: 'refresh' | 'cancel'
  } | null>(null)
  const [versionFilter, setVersionFilter] = useState<VersionFilter>('all')
  const [selectedRepoKey, setSelectedRepoKey] = useState<string>('all')
  const [repoSettingsPreview, setRepoSettingsPreview] = useState<RepoSettingsPreview | null>(null)
  const [repoSettingsActionKey, setRepoSettingsActionKey] = useState<string | null>(null)

  const loadWatchedPackages = useCallback(async () => {
    try {
      const data = await listWatchedPackages()
      setWatchedPackages(data)
    } catch (error) {
      console.error('加载依赖关注列表失败', error)
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    void loadWatchedPackages()
  }, [loadWatchedPackages])

  const repoOptions = useMemo(() => {
    return [
      'all',
      ...Array.from(new Set(watchedPackages.map(item => repoKeyOf(item)))).sort((left, right) =>
        left.localeCompare(right)
      ),
    ]
  }, [watchedPackages])

  useEffect(() => {
    if (!repoOptions.includes(selectedRepoKey)) {
      setSelectedRepoKey('all')
    }
  }, [repoOptions, selectedRepoKey])

  useEffect(() => {
    if (selectedRepoKey === 'all' || selectedRepoKey === 'no-repo') {
      setToolView('packages')
    }
  }, [selectedRepoKey])

  const selectedCount = useMemo(
    () => dependencies.filter(item => item.selected).length,
    [dependencies]
  )

  const groupedDependencies = useMemo(() => {
    return dependencies.reduce<Record<string, SelectedDependency[]>>((acc, item) => {
      const key = `${item.ecosystem}:${item.manifest_path}`
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
  }, [dependencies])

  const filteredWatchedPackages = useMemo(() => {
    return watchedPackages.filter(item => {
      if (versionFilter !== 'all' && item.latest_update_type !== versionFilter) {
        return false
      }

      if (selectedRepoKey !== 'all' && repoKeyOf(item) !== selectedRepoKey) {
        return false
      }

      return true
    })
  }, [selectedRepoKey, versionFilter, watchedPackages])

  const groupedWatchedPackages = useMemo(() => {
    return filteredWatchedPackages.reduce<Record<string, WatchedPackage[]>>((acc, item) => {
      const key = repoKeyOf(item)
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
  }, [filteredWatchedPackages])

  const selectedRepoPackages = useMemo(() => {
    if (selectedRepoKey === 'all') {
      return []
    }

    return watchedPackages.filter(item => repoKeyOf(item) === selectedRepoKey)
  }, [selectedRepoKey, watchedPackages])

  const selectedRepoSample = selectedRepoPackages[0]
  const selectedRepoWatchedMap = useMemo(() => {
    const map = new Map<string, WatchedPackage>()

    for (const item of selectedRepoPackages) {
      map.set(`${item.ecosystem}:${item.manifest_path}:${item.package_name}`, item)
    }

    return map
  }, [selectedRepoPackages])

  const resetAddPanel = useCallback(() => {
    setShowAddPanel(false)
    setPreview(null)
    setDependencies([])
    setUrl('')
  }, [setShowAddPanel])

  useEffect(() => {
    const loadRepoSettings = () => {
      if (toolView !== 'repo-settings' || !selectedRepoKey || selectedRepoKey === 'all') {
        return
      }

      // 从 selectedRepoKey 解析仓库信息，即使 selectedRepoPackages 为空也显示仓库条目
      const [owner, repo] = selectedRepoKey.split('/')
      const repoSample = selectedRepoPackages[0] ?? {
        source_provider: 'github',
        source_owner: owner,
        source_repo: repo,
        source_url: `https://github.com/${owner}/${repo}`,
      }

      const grouped = selectedRepoPackages.reduce<Record<string, WatchedPackage[]>>((acc, pkg) => {
        const key = `${pkg.ecosystem}:${pkg.manifest_path || (pkg.ecosystem === 'npm' ? 'package.json' : 'composer.json')}`
        if (!acc[key]) acc[key] = []
        acc[key].push(pkg)
        return acc
      }, {})

      const manifests = Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, pkgs]) => {
          const [ecosystem, path] = key.split(':') as ['npm' | 'composer', string]
          return {
            ecosystem,
            path,
            dependencies: pkgs.map(pkg => ({
              package_name: pkg.package_name,
              current_version_constraint: pkg.current_version_constraint,
              normalized_current_version: pkg.normalized_current_version,
              current_version_source: (pkg.metadata as Record<string, unknown>)
                ?.current_version_source as 'lock' | 'manifest' | null,
              dependency_group: (pkg.metadata as Record<string, unknown>)?.dependency_group as
                | string
                | null,
              selected: true,
            })),
          }
        })

      setRepoSettingsPreview({
        source: {
          provider: repoSample.source_provider,
          owner: repoSample.source_owner,
          repo: repoSample.source_repo,
          full_name: repoLabelOf(repoSample),
          html_url: repoSample.source_url,
          description: null,
        },
        manifests,
      })
    }

    loadRepoSettings()
  }, [selectedRepoPackages, selectedRepoKey, toolView])

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) {
      toast.error('请先输入 GitHub 仓库地址')
      return
    }

    setAnalyzing(true)

    try {
      const result = await previewRepoDependencies(url.trim())
      setPreview(result)
      setDependencies(
        result.manifests.flatMap(manifest =>
          manifest.dependencies.map(item => ({
            ...item,
            ecosystem: manifest.ecosystem,
            manifest_path: manifest.path,
            selected: true,
          }))
        )
      )
      setShowAddPanel(true)
      toast.success('依赖解析完成')
    } finally {
      setAnalyzing(false)
    }
  }, [url, setShowAddPanel])

  const handleToggleDependency = useCallback((target: SelectedDependency, selected: boolean) => {
    setDependencies(prev =>
      prev.map(item =>
        item.ecosystem === target.ecosystem &&
        item.package_name === target.package_name &&
        item.manifest_path === target.manifest_path
          ? { ...item, selected }
          : item
      )
    )
  }, [])

  const toggleAll = useCallback((selected: boolean) => {
    setDependencies(prev => prev.map(item => ({ ...item, selected })))
  }, [])

  const handleSave = useCallback(async () => {
    if (!preview) {
      toast.error('请先解析仓库依赖')
      return
    }

    const selectedPackages = dependencies.filter(item => item.selected)
    if (selectedPackages.length === 0) {
      toast.error('请至少选择一个依赖包')
      return
    }

    setSaving(true)

    try {
      const saved = await saveWatchedPackages(
        preview.source,
        url.trim(),
        selectedPackages.map(item => ({
          ecosystem: item.ecosystem,
          package_name: item.package_name,
          manifest_path: item.manifest_path,
          current_version_constraint: item.current_version_constraint,
          normalized_current_version: item.normalized_current_version,
          current_version_source: item.current_version_source,
          watch_level: DEFAULT_SAVE_LEVEL,
          dependency_group: item.dependency_group,
        }))
      )

      setWatchedPackages(prev => {
        const merged = [...prev]
        saved.forEach(item => {
          const index = merged.findIndex(existing => existing.id === item.id)
          if (index >= 0) {
            merged[index] = item
          } else {
            merged.unshift(item)
          }
        })
        return merged
      })

      setSelectedRepoKey(repoKeyOf(saved[0]))
      resetAddPanel()
      toast.success(`已新增 ${saved.length} 个依赖关注`)
    } finally {
      setSaving(false)
    }
  }, [dependencies, preview, resetAddPanel, url])

  const handleRefresh = useCallback(async (id: number) => {
    setActiveAction({ id, type: 'refresh' })

    try {
      const item = await refreshWatchedPackage(id)
      setWatchedPackages(prev => prev.map(pkg => (pkg.id === id ? item : pkg)))
      toast.success('依赖更新已刷新')
    } finally {
      setActiveAction(null)
    }
  }, [])

  const handleCancelWatch = useCallback(async (id: number) => {
    setActiveAction({ id, type: 'cancel' })

    try {
      await deleteWatchedPackage(id)
      setWatchedPackages(prev => prev.filter(pkg => pkg.id !== id))
      toast.success('已取消关注')
    } finally {
      setActiveAction(null)
    }
  }, [])

  const handleDeleteRepo = useCallback(async () => {
    if (!selectedRepoKey || selectedRepoKey === 'all') return

    const ids = selectedRepoPackages.map(pkg => pkg.id)
    if (ids.length === 0) return

    const deletedRepoKey = selectedRepoKey
    try {
      await deleteWatchedPackages(ids)
      setWatchedPackages(prev => prev.filter(pkg => !ids.includes(pkg.id)))
      // 删除后不清空 selectedRepoKey，让仓库仍保留在下拉中（只是为空）
      setRepoSettingsPreview(null)
      toast.success(`已删除 ${ids.length} 个依赖关注`)
    } catch (error) {
      toast.error('删除失败，请重试')
    }
  }, [selectedRepoKey, selectedRepoPackages])

  const handleToggleAllRepoSettings = useCallback(
    async (
      dependencies: Array<
        RepoDependencyPreviewItem & { ecosystem: 'npm' | 'composer'; manifest_path: string }
      >,
      nextWatched: boolean
    ) => {
      if (!selectedRepoSample || !repoSettingsPreview) {
        return
      }

      if (nextWatched) {
        const missingDependencies = dependencies.filter(
          item =>
            !selectedRepoWatchedMap.get(
              `${item.ecosystem}:${item.manifest_path}:${item.package_name}`
            )
        )
        if (missingDependencies.length === 0) {
          return
        }

        setRepoSettingsActionKey('toggle-all')

        try {
          const saved = await saveWatchedPackages(
            {
              provider: selectedRepoSample.source_provider,
              owner: selectedRepoSample.source_owner,
              repo: selectedRepoSample.source_repo,
              full_name: repoLabelOf(selectedRepoSample),
              html_url: selectedRepoSample.source_url,
              description: null,
            },
            selectedRepoSample.source_url,
            missingDependencies.map(item => ({
              ecosystem: item.ecosystem,
              package_name: item.package_name,
              manifest_path: item.manifest_path,
              current_version_constraint: item.current_version_constraint,
              normalized_current_version: item.normalized_current_version,
              current_version_source: item.current_version_source,
              watch_level: DEFAULT_SAVE_LEVEL,
              dependency_group: item.dependency_group,
            }))
          )

          setWatchedPackages(prev => {
            const merged = [...prev]
            for (const item of saved) {
              const index = merged.findIndex(existing => existing.id === item.id)
              if (index >= 0) {
                merged[index] = item
              } else {
                merged.push(item)
              }
            }
            return merged
          })
          toast.success(`已关注 ${saved.length} 个依赖`)
        } finally {
          setRepoSettingsActionKey(null)
        }

        return
      }

      // 取消全选：删除已关注的包，但不切换 selectedRepoKey，保留空仓库条目
      const watchedDependencies = dependencies
        .map(item =>
          selectedRepoWatchedMap.get(`${item.ecosystem}:${item.manifest_path}:${item.package_name}`)
        )
        .filter((item): item is WatchedPackage => !!item)
      if (watchedDependencies.length === 0) {
        return
      }

      setRepoSettingsActionKey('toggle-all')

      try {
        await deleteWatchedPackages(watchedDependencies.map(item => item.id))
        setWatchedPackages(prev =>
          prev.filter(item => !watchedDependencies.some(watched => watched.id === item.id))
        )
        // 保留 selectedRepoKey，不切换到 'all'，这样空仓库仍显示在下拉中
        toast.success(`已取消关注 ${watchedDependencies.length} 个依赖`)
      } finally {
        setRepoSettingsActionKey(null)
      }
    },
    [repoSettingsPreview, selectedRepoSample, selectedRepoWatchedMap]
  )

  const handleToggleRepoSettingPackage = useCallback(
    async (dependency: SelectedDependency, watchedPackage?: WatchedPackage) => {
      const actionKey = `${dependency.ecosystem}:${dependency.manifest_path}:${dependency.package_name}`
      setRepoSettingsActionKey(actionKey)

      try {
        if (watchedPackage) {
          await deleteWatchedPackage(watchedPackage.id)
          setWatchedPackages(prev => prev.filter(item => item.id !== watchedPackage.id))
          toast.success('已取消关注')
          return
        }

        if (!selectedRepoSample) {
          return
        }

        const saved = await saveWatchedPackages(
          {
            provider: selectedRepoSample.source_provider,
            owner: selectedRepoSample.source_owner,
            repo: selectedRepoSample.source_repo,
            full_name: repoLabelOf(selectedRepoSample),
            html_url: selectedRepoSample.source_url,
            description: null,
          },
          selectedRepoSample.source_url,
          [
            {
              ecosystem: dependency.ecosystem,
              package_name: dependency.package_name,
              manifest_path: dependency.manifest_path,
              current_version_constraint: dependency.current_version_constraint,
              normalized_current_version: dependency.normalized_current_version,
              current_version_source: dependency.current_version_source,
              watch_level: DEFAULT_SAVE_LEVEL,
              dependency_group: dependency.dependency_group,
            },
          ]
        )

        setWatchedPackages(prev => {
          const merged = [...prev]
          for (const item of saved) {
            const index = merged.findIndex(existing => existing.id === item.id)
            if (index >= 0) {
              merged[index] = item
            } else {
              merged.push(item)
            }
          }
          return merged
        })
        toast.success('已加入关注')
      } finally {
        setRepoSettingsActionKey(null)
      }
    },
    [selectedRepoSample]
  )

  const isRepoFiltered = selectedRepoKey !== 'all'

  const renderPackageCard = (item: WatchedPackage) => (
    <div key={item.id} className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium">{item.publisher_display_name ?? item.package_name}</div>
            <Badge variant="outline">{item.ecosystem}</Badge>
            {item.latest_update_type ? (
              <Badge variant="outline">{item.latest_update_type}</Badge>
            ) : (
              <Badge variant="secondary">暂无更新类型</Badge>
            )}
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            {(() => {
              const prefix = getLeadingSymbolPrefix(item.current_version_constraint)
              const prefixPad = prefix ? (
                <span aria-hidden className="text-transparent select-none">
                  {prefix}
                </span>
              ) : null

              return (
                <>
                  <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2">
                    <span>当前约束：</span>
                    <span className="font-mono">{item.current_version_constraint || '未声明'}</span>
                  </div>
                  <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2">
                    <span>当前基线：</span>
                    <span className="font-mono">
                      {prefixPad}
                      {item.normalized_current_version || '未知'}
                    </span>
                  </div>
                  <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2">
                    <span>最新版本：</span>
                    <span className="font-mono">
                      {prefixPad}
                      {renderVersionDiff(item.normalized_current_version, item.latest_version)}
                    </span>
                  </div>
                </>
              )
            })()}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              最近检查：{formatDateTime(item.last_checked_at)}
            </span>
            {!isRepoFiltered ? (
              <span className="text-xs text-muted-foreground">来源：{repoLabelOf(item)}</span>
            ) : null}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {item.registry_url ? (
              <DropdownMenuItem asChild>
                <a href={item.registry_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  打开包页
                </a>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onClick={() => void handleRefresh(item.id)}
              disabled={activeAction?.id === item.id && activeAction.type === 'refresh'}
            >
              <RefreshCw className="h-4 w-4" />
              刷新
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void handleCancelWatch(item.id)}
              disabled={activeAction?.id === item.id && activeAction.type === 'cancel'}
            >
              <X className="h-4 w-4" />
              取消关注
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* 列表视图 */}
      {toolView === 'packages' ? (
        <>
          {/* 筛选栏 */}
          {watchedPackages.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                value={selectedRepoKey}
                onChange={event => setSelectedRepoKey(event.target.value)}
              >
                {repoOptions.map(item => (
                  <option key={item} value={item}>
                    {item === 'all' ? '全部仓库' : item === 'no-repo' ? '无仓库' : item}
                  </option>
                ))}
              </select>
              <select
                className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                value={versionFilter}
                onChange={event => setVersionFilter(event.target.value as VersionFilter)}
              >
                {VERSION_FILTER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* 添加仓库面板 */}
          {showAddPanel ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">添加仓库</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="例如 https://github.com/laravel/framework"
                    value={url}
                    onChange={event => setUrl(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void handleAnalyze()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={resetAddPanel}>
                    取消
                  </Button>
                  <Button onClick={() => void handleAnalyze()} loading={analyzing}>
                    <Search className="h-4 w-4" />
                    解析
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* 空状态 */}
          {!showAddPanel && watchedPackages.length === 0 && !preview ? (
            <Card className="border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
              <CardContent className="py-12">
                <EmptyState
                  icon={<FolderGit2 className="h-10 w-10" />}
                  title="还没有关注任何依赖"
                  description="点击上方「添加仓库」按钮，输入 GitHub 仓库地址开始追踪依赖更新。"
                />
              </CardContent>
            </Card>
          ) : null}

          {/* 解析预览 */}
          {preview ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2">
                    <CardTitle className="text-base truncate">{preview.source.full_name}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" asChild>
                      <a
                        href={preview.source.html_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="打开仓库"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" onClick={() => void handleSave()} loading={saving}>
                      <CheckSquare className="h-4 w-4" />
                      保存 ({selectedCount})
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleAll(true)}
                      aria-label="全选"
                      title="全选"
                    >
                      <CheckSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleAll(false)}
                      aria-label="取消全选"
                      title="取消全选"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="truncate">
                  {preview.source.description || '暂无仓库描述'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(groupedDependencies).map(([groupKey, items]) => {
                  const selectedCount = items.filter(item => item.selected).length
                  return (
                    <div key={groupKey} className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {items[0]?.ecosystem}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {items[0]?.manifest_path}
                        </Badge>
                        <span>
                          {selectedCount}/{items.length}
                        </span>
                      </div>
                      <div className="grid gap-1.5">
                        {items.map(item => (
                          <label
                            key={`${item.ecosystem}-${item.package_name}`}
                            className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-muted/50"
                          >
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={event => handleToggleDependency(item, event.target.checked)}
                              className="accent-primary"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">
                                {item.package_name}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {item.current_version_constraint || '未声明'}
                                {item.dependency_group ? ` · ${item.dependency_group}` : ''}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={resetAddPanel}>
                    取消
                  </Button>
                  <Button size="sm" onClick={() => void handleSave()} loading={saving}>
                    <CheckSquare className="h-4 w-4" />
                    保存 ({selectedCount})
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* 包列表 */}
          {watchedPackages.length > 0 ? (
            loadingList ? (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  正在加载关注列表...
                </CardContent>
              </Card>
            ) : filteredWatchedPackages.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<FolderGit2 className="h-8 w-8" />}
                    title="当前筛选条件下没有结果"
                    description="切换仓库范围或更新类型，或添加新的仓库依赖。"
                  />
                </CardContent>
              </Card>
            ) : selectedRepoKey !== 'all' ? (
              <div className="space-y-3">
                {Object.entries(groupedWatchedPackages).map(([repoKey, items]) => (
                  <Card key={repoKey} className="border-dashed">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          {repoKey === 'no-repo' ? '无仓库' : repoKey}
                        </CardTitle>
                        <span className="text-xs text-muted-foreground">{items.length} 个依赖</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">{items.map(renderPackageCard)}</CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">{filteredWatchedPackages.map(renderPackageCard)}</div>
            )
          ) : null}
        </>
      ) : (
        /* 仓库设置视图 */
        <>
          {/* 仓库选择 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">选择仓库</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                className="border-input bg-background w-full h-9 rounded-md border px-3 text-sm"
                value={selectedRepoKey}
                onChange={event => setSelectedRepoKey(event.target.value)}
              >
                <option value="">选择一个仓库</option>
                {repoOptions
                  .filter(item => item !== 'all' && item !== 'no-repo')
                  .map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
              </select>
            </CardContent>
          </Card>

          {/* 仓库设置内容 */}
          {selectedRepoSample && selectedRepoKey !== 'all' ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">
                      {repoLabelOf(selectedRepoSample)}
                    </CardTitle>
                    {selectedRepoSample.source_url ? (
                      <a
                        href={selectedRepoSample.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground flex items-center gap-1 text-xs transition-colors hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {selectedRepoSample.source_url}
                      </a>
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={repoSettingsActionKey === 'toggle-all'}
                    onClick={() =>
                      void handleToggleAllRepoSettings(
                        repoSettingsPreview?.manifests.flatMap(manifest =>
                          manifest.dependencies.map(dep => ({
                            ...dep,
                            ecosystem: manifest.ecosystem,
                            manifest_path: manifest.path,
                          }))
                        ) ?? [],
                        !selectedRepoPackages.every(pkg =>
                          repoSettingsPreview?.manifests.some(manifest =>
                            manifest.dependencies.some(
                              dep =>
                                pkg.ecosystem === manifest.ecosystem &&
                                pkg.manifest_path === manifest.path &&
                                pkg.package_name === dep.package_name
                            )
                          )
                        )
                      )
                    }
                  >
                    {selectedRepoPackages.length === 0 ? '全选' : '取消全选'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (
                        confirm(
                          `确认删除「${selectedRepoKey}」下的所有依赖关注（共 ${selectedRepoPackages.length} 个）？`
                        )
                      ) {
                        void handleDeleteRepo()
                      }
                    }}
                    title="删除仓库"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {repoSettingsPreview ? (
                  repoSettingsPreview.manifests.map(manifest => (
                    <div key={`${manifest.ecosystem}:${manifest.path}`} className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {manifest.ecosystem}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {manifest.path}
                        </Badge>
                        <span>
                          {
                            manifest.dependencies.filter(dep =>
                              selectedRepoWatchedMap.has(
                                `${manifest.ecosystem}:${manifest.path}:${dep.package_name}`
                              )
                            ).length
                          }
                          /{manifest.dependencies.length} 个包已关注
                        </span>
                      </div>
                      <div className="grid gap-1">
                        {manifest.dependencies.map(dep => {
                          const key = `${manifest.ecosystem}:${manifest.path}:${dep.package_name}`
                          const watched = selectedRepoWatchedMap.get(key)

                          return (
                            <label
                              key={key}
                              className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-muted/50"
                            >
                              <input
                                type="checkbox"
                                checked={!!watched}
                                disabled={repoSettingsActionKey === key}
                                onChange={() =>
                                  void handleToggleRepoSettingPackage(
                                    {
                                      ...dep,
                                      ecosystem: manifest.ecosystem,
                                      manifest_path: manifest.path,
                                      selected: !!watched,
                                    },
                                    watched
                                  )
                                }
                                className="accent-primary"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium">
                                  {dep.package_name}
                                </div>
                                <div className="truncate text-xs text-muted-foreground">
                                  {dep.current_version_constraint || '未声明'}
                                  {dep.dependency_group ? ` · ${dep.dependency_group}` : ''}
                                </div>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    暂无仓库依赖数据
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  )
}
