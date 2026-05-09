'use client'

import { usePathname, useRouter } from 'next/navigation'
import { FileText, Tag, FolderTree } from 'lucide-react'
import { useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useTranslation } from '@/hooks/useTranslation'
import { SaveOptionsDialog } from '@/components/ui/save-options-dialog'
import { BottomNav, type BottomNavItem } from '@/components/layout'

export default function NoteNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { isDirty, setDirty, saveDraft } = useEditorStore()
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const { t } = useTranslation()

  // 统一跳转处理
  const handleNavigate = (href: string) => {
    if (isDirty && (pathname.startsWith('/note/new') || pathname.startsWith('/note/edit'))) {
      setPendingHref(href)
      setShowConfirm(true)
    } else {
      router.push(href)
    }
  }

  const handleConfirm = async () => {
    if (saveDraft) {
      await saveDraft()
    }
    setDirty(false)
    setShowConfirm(false)
    if (pendingHref) {
      router.push(pendingHref)
      setPendingHref(null)
    }
  }

  const handleSave = async () => {
    // 这里需要调用实际的保存函数，但由于我们在导航组件中，
    // 我们只能保存为草稿
    if (saveDraft) {
      await saveDraft()
    }
    setDirty(false)
    setShowConfirm(false)
    if (pendingHref) {
      router.push(pendingHref)
      setPendingHref(null)
    }
  }

  const handleDiscard = () => {
    setDirty(false)
    setShowConfirm(false)
    if (pendingHref) {
      router.push(pendingHref)
      setPendingHref(null)
    }
  }

  const items: BottomNavItem[] = [
    {
      href: '/note',
      label: t('nav.my_notes', '我的笔记'),
      icon: <FileText className="h-5 w-5" />,
      exact: true,
      onClick: () => handleNavigate('/note'),
    },
    {
      href: '/note/categories',
      label: t('nav.categories', '分类'),
      icon: <FolderTree className="h-5 w-5" />,
      onClick: () => handleNavigate('/note/categories'),
    },
    {
      href: '/note/tags',
      label: t('nav.tags', '标签'),
      icon: <Tag className="h-5 w-5" />,
      onClick: () => handleNavigate('/note/tags'),
    },
  ]

  return (
    <>
      <BottomNav items={items} ariaLabel="笔记模块导航" />
      <SaveOptionsDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={t('confirm.leave_without_save', '确认离开')}
        description={t('confirm.leave_description', '您有未保存的内容，请选择如何处理：')}
        onSaveDraft={handleConfirm}
        onSave={handleSave}
        onDiscard={handleDiscard}
        saveDraftText={t('confirm.save_draft', '保存为草稿')}
        saveText={t('confirm.save', '保存')}
        discardText={t('confirm.discard', '放弃保存')}
      />
    </>
  )
}
