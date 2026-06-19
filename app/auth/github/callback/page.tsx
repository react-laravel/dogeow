'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/stores/authStore'
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

      if (!code) {
        setError('登录信息不完整')
        return
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/github/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
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
