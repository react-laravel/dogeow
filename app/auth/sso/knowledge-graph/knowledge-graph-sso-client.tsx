'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '@/lib/api'
import useAuthStore from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type TicketResponse = {
  redirect_url: string
  expires_in: number
}

export function KnowledgeGraphSsoClient({
  returnTo,
  codeChallenge,
}: {
  returnTo: string
  codeChallenge: string
}) {
  const restoreSession = useAuthStore(state => state.restoreSession)
  const login = useAuthStore(state => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('正在确认 DogeOW 登录状态…')
  const [needsLogin, setNeedsLogin] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const started = useRef(false)

  const issueTicket = useCallback(async () => {
    if (!codeChallenge) throw new Error('缺少安全登录校验信息，请从知识图谱重新登录')

    setStatus('正在安全登录知识图谱…')
    const result = await apiRequest<TicketResponse>('/auth/sso/ticket', 'POST', {
      client: 'knowledge-graph',
      return_to: returnTo,
      code_challenge: codeChallenge,
    })
    window.location.replace(result.redirect_url)
  }, [codeChallenge, returnTo])

  useEffect(() => {
    if (started.current) return
    started.current = true

    void restoreSession()
      .then(user => {
        if (user) return issueTicket()
        setNeedsLogin(true)
        setStatus('登录 DogeOW 后即可进入知识图谱')
      })
      .catch(error => {
        setNeedsLogin(true)
        setStatus(error instanceof Error ? error.message : '暂时无法确认登录状态')
      })
  }, [issueTicket, restoreSession])

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await login(email, password)
      await issueTicket()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '登录失败，请重试')
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <section className="bg-card text-card-foreground w-full max-w-md rounded-xl border p-6 shadow-lg">
        <h1 className="text-xl font-semibold">登录 DogeOW 知识图谱</h1>
        <p className="text-muted-foreground mt-2 text-sm">{status}</p>

        {needsLogin ? (
          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="knowledge-graph-sso-email">邮箱</Label>
              <Input
                id="knowledge-graph-sso-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="knowledge-graph-sso-password">密码</Label>
              <Input
                id="knowledge-graph-sso-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
              />
            </div>
            <Button className="w-full" disabled={submitting} type="submit">
              {submitting ? '登录中…' : '登录并进入知识图谱'}
            </Button>
          </form>
        ) : (
          <div className="border-primary mx-auto mt-6 h-9 w-9 animate-spin rounded-full border-4 border-t-transparent" />
        )}
      </section>
    </main>
  )
}
