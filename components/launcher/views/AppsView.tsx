'use client'

import React from 'react'
import { Settings } from 'lucide-react'
import { AppGrid } from '../AppGrid'
import { SearchBar } from '../SearchBar'
import { LogoButton } from '../common/LogoButton'
import { UserButton } from './UserButton'
import { NotificationDropdown } from '@/components/app/NotificationDropdown'
import { useFilterPersistenceStore } from '@/app/thing/stores/filterPersistenceStore'
import { Button } from '@/components/ui/button'

type DisplayMode = 'music' | 'apps' | 'settings' | 'auth' | 'search-result'

interface AppsViewProps {
  router: {
    push: (path: string) => void
  }
  searchManager: {
    isSearchVisible: boolean
    searchTerm: string
    setSearchTerm: (term: string) => void
    handleSearch: (e: React.SyntheticEvent, keepSearchOpen?: boolean) => void
    toggleSearch: () => void
    currentApp: string
    isHomePage: boolean
  }
  isAuthenticated: boolean
  toggleDisplayMode: (mode: DisplayMode) => void
  onOpenAi?: () => void
  analyserNode?: AnalyserNode | null
  /** 若 AI 已打开，点击 logo 时先关闭 AI */
  isAiOpen?: boolean
  onCloseAi?: () => void
  showLogo?: boolean
}

export function AppsView({
  router,
  searchManager,
  isAuthenticated,
  toggleDisplayMode,
  onOpenAi,
  analyserNode,
  isAiOpen,
  onCloseAi,
  showLogo = true,
}: AppsViewProps) {
  const { clearFilters } = useFilterPersistenceStore()

  const navigateHome = () => {
    // 不要用 window.location.assign('/')，否则会触发浏览器级整页刷新，
    // 正在播放的音乐会被打断。已经在首页时也不重复 push，避免无意义重渲染。
    if (searchManager.isHomePage) {
      return
    }

    router.push('/')
  }

  const handleLogoClick = () => {
    if (isAiOpen && onCloseAi) {
      onCloseAi()
      return
    }
    clearFilters()
    navigateHome()
  }

  return (
    <div
      className={`flex h-full min-w-0 items-center justify-between ${showLogo ? '' : 'pl-10 sm:pl-13'}`}
    >
      {/* 左侧：应用切换按钮 */}
      {showLogo && (
        <div className="mr-0 flex shrink-0 items-center sm:mr-3">
          <LogoButton onClick={handleLogoClick} />
        </div>
      )}

      {/* 中间：应用图标 */}
      {!searchManager.isSearchVisible && (
        <div className="flex min-w-0 flex-1 items-center justify-start">
          <AppGrid
            toggleDisplayMode={toggleDisplayMode}
            onOpenAi={onOpenAi}
            onToggleSearch={searchManager.toggleSearch}
            analyserNode={analyserNode}
          />
        </div>
      )}

      {/* 右侧：设置、搜索输入、通知、用户 */}
      <div
        className={`flex min-w-0 items-center gap-0 sm:gap-2 ${searchManager.isSearchVisible ? 'flex-1 justify-between' : 'ml-auto'}`}
      >
        {searchManager.isSearchVisible ? (
          <SearchBar
            isVisible={searchManager.isSearchVisible}
            searchTerm={searchManager.searchTerm}
            setSearchTerm={searchManager.setSearchTerm}
            onSearch={searchManager.handleSearch}
            onToggleSearch={searchManager.toggleSearch}
            currentApp={searchManager.currentApp}
            showTrigger={false}
          />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="size-10 gap-2 rounded-xl lg:w-auto lg:px-3"
            onClick={() => toggleDisplayMode('settings')}
            aria-label="打开设置"
            title="打开设置"
          >
            <Settings className="h-5 w-5" />
            <span className="hidden text-sm font-medium lg:inline">设置</span>
          </Button>
        )}

        {/* 通知铃铛 */}
        {!searchManager.isSearchVisible && <NotificationDropdown />}

        {/* 用户按钮 */}
        {!searchManager.isSearchVisible && (
          <UserButton
            isAuthenticated={isAuthenticated}
            onToggleAuth={() => toggleDisplayMode('auth')}
          />
        )}
      </div>
    </div>
  )
}
