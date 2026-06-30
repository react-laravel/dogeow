'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/stores/authStore'
import { GITHUB_OAUTH_STATE_KEY } from '@/lib/utils/authStorage'
import type { User } from '@/app'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function GithubCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const { setUser, setToken } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const state = urlParams.get('state')
      const storedState = window.sessionStorage.getItem(GITHUB_OAUTH_STATE_KEY)

      if (!code) {
        setError('登录信息不完整')
        return
      }

      // 校验 state 与发起授权时保存的一致，防止登录 CSRF / 账号混淆
      if (!state || !storedState || state !== storedState) {
        setError('登录校验失败，请重新登录')
        return
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/github/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.message || 'GitHub 登录失败')
        }

        const { token, user } = await res.json()
        await setToken(token)
        setUser(user as User)
        router.push('/')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'GitHub 登录失败')
      } finally {
        // 一次性 state 用后即清
        window.sessionStorage.removeItem(GITHUB_OAUTH_STATE_KEY)
      }
    }

    handleCallback()
  }, [setToken, setUser, router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">登录失败</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">正在通过 GitHub 登录...</h1>
      </div>
    </div>
  )
}
