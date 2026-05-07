'use client'

import React, { useMemo, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePassword } from '@/lib/api/user'

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const confirmRequired = !showNewPassword
  const canSubmit = useMemo(() => {
    if (!currentPassword || !password || submitting) return false
    if (confirmRequired && !passwordConfirmation) return false

    return true
  }, [confirmRequired, currentPassword, password, passwordConfirmation, submitting])

  const resetForm = () => {
    setCurrentPassword('')
    setPassword('')
    setPasswordConfirmation('')
    setShowNewPassword(false)
    setSubmitting(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm()
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (confirmRequired && password !== passwordConfirmation) {
      toast.error('两次输入的新密码不一致', { position: 'top-center' })
      return
    }

    setSubmitting(true)
    try {
      await changePassword({
        currentPassword,
        password,
        passwordConfirmation: showNewPassword ? password : passwordConfirmation,
      })
      toast.success('密码已修改', { position: 'top-center' })
      handleOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '修改密码失败，请稍后重试', {
        position: 'top-center',
      })
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>修改密码</DialogTitle>
          <DialogDescription>需要输入原密码和新密码。</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="current-password">
              原密码 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={event => setCurrentPassword(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">
              新密码 <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="pr-10"
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
                onClick={() => setShowNewPassword(prev => !prev)}
                aria-label={showNewPassword ? '隐藏新密码' : '显示新密码'}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">确认密码</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={event => setPasswordConfirmation(event.target.value)}
              required={confirmRequired}
              disabled={showNewPassword}
              placeholder={showNewPassword ? '已使用可见的新密码确认' : undefined}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? '提交中...' : '确认修改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
