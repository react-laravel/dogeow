'use client'

import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Bot, RefreshCcw, Send, Sparkles, User } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type RoleplayMessage = {
  role: 'user' | 'assistant'
  content: string
}

type RoleplayResponse = {
  reply: string
  model?: string
  usage?: {
    total_tokens?: number
    prompt_tokens?: number
    completion_tokens?: number
  }
  character_name?: string
}

type RoleplayPreset = {
  id: string
  label: string
  characterName: string
  characterPrompt: string
  userPersona: string
  scene: string
  openingLine: string
}

const ROLEPLAY_PRESETS: RoleplayPreset[] = [
  {
    id: 'zhuge-liang',
    label: '诸葛亮',
    characterName: '诸葛亮',
    characterPrompt: '你是《三国演义》中的诸葛亮，智慧、沉稳、善于谋略，说话克制但有洞见。',
    userPersona: '你是一位来自现代的穿越者，愿意坦诚交流自己的观察。',
    scene: '三国时期的隆中对话',
    openingLine: '军师，我想和您聊聊如何用现代视角看待治国与用人。',
  },
  {
    id: 'night-host',
    label: '深夜电台',
    characterName: '林深',
    characterPrompt: '你是一名深夜电台主持人，温柔、会倾听、擅长把复杂情绪说清楚。',
    userPersona: '你是一个白天强撑状态、晚上容易想很多的人。',
    scene: '一档只在凌晨开播的来电节目',
    openingLine: '主持人，我最近总感觉人还在往前走，但心已经很累了。',
  },
  {
    id: 'cyber-guide',
    label: '赛博向导',
    characterName: 'Astra',
    characterPrompt:
      '你是一个来自未来城市的赛博向导，冷静、直接、富有画面感，善于把建议拆成行动步骤。',
    userPersona: '你是一位第一次进入巨型未来都市的新居民。',
    scene: '暴雨中的霓虹街区与地下交通枢纽',
    openingLine: 'Astra，我刚到这座城市，第一晚应该先做什么，才能活得稳一点？',
  },
]

const INITIAL_PRESET = ROLEPLAY_PRESETS[0]
const MAX_HISTORY_MESSAGES = 12

export function HomeRoleplayCard() {
  const [selectedPresetId, setSelectedPresetId] = useState(INITIAL_PRESET.id)
  const [characterName, setCharacterName] = useState(INITIAL_PRESET.characterName)
  const [characterPrompt, setCharacterPrompt] = useState(INITIAL_PRESET.characterPrompt)
  const [userPersona, setUserPersona] = useState(INITIAL_PRESET.userPersona)
  const [scene, setScene] = useState(INITIAL_PRESET.scene)
  const [input, setInput] = useState(INITIAL_PRESET.openingLine)
  const [messages, setMessages] = useState<RoleplayMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokenUsage, setTokenUsage] = useState<number | null>(null)
  const messagesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = messagesRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, isLoading, error])

  const applyPreset = useCallback((preset: RoleplayPreset) => {
    setSelectedPresetId(preset.id)
    setCharacterName(preset.characterName)
    setCharacterPrompt(preset.characterPrompt)
    setUserPersona(preset.userPersona)
    setScene(preset.scene)
    setInput(preset.openingLine)
    setMessages([])
    setError('')
    setTokenUsage(null)
  }, [])

  const resetConversation = useCallback(() => {
    setMessages([])
    setError('')
    setTokenUsage(null)
  }, [])

  const canSend =
    !isLoading &&
    characterName.trim().length > 0 &&
    characterPrompt.trim().length > 0 &&
    input.trim().length > 0

  const handleSend = useCallback(async () => {
    const message = input.trim()
    if (!message || !characterName.trim() || !characterPrompt.trim() || isLoading) return

    const history = messages.slice(-MAX_HISTORY_MESSAGES)
    const nextMessages = [...messages, { role: 'user' as const, content: message }]

    setMessages(nextMessages)
    setInput('')
    setError('')
    setTokenUsage(null)
    setIsLoading(true)

    try {
      const data = await apiRequest<RoleplayResponse>(
        'minimax/roleplay',
        'POST',
        {
          character_name: characterName.trim(),
          character_prompt: characterPrompt.trim(),
          user_persona: userPersona.trim() || undefined,
          scene: scene.trim() || undefined,
          message,
          history,
        },
        { handleError: false }
      )

      setMessages([...nextMessages, { role: 'assistant', content: data.reply }])
      setTokenUsage(data.usage?.total_tokens ?? null)
    } catch (requestError) {
      setMessages(messages)
      setInput(message)
      setError(
        requestError instanceof Error ? requestError.message : '角色对话暂时不可用，请稍后重试'
      )
    } finally {
      setIsLoading(false)
    }
  }, [characterName, characterPrompt, input, isLoading, messages, scene, userPersona])

  const handlePromptKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.nativeEvent.isComposing) return
      if (event.key !== 'Enter' || event.shiftKey) return
      event.preventDefault()
      void handleSend()
    },
    [handleSend]
  )

  return (
    <Card className="overflow-hidden border-orange-500/20 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_32%),linear-gradient(135deg,rgba(251,191,36,0.08),transparent_55%)] py-0">
      <CardHeader className="border-b border-orange-500/10 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">MiniMax</Badge>
          <Badge variant="secondary">M2-her</Badge>
          <Badge variant="outline">角色对话</Badge>
          <Badge variant="outline">多轮记忆</Badge>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-orange-500" />
              角色对话
            </CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">
              基于 MiniMax `M2-her` 的角色扮演对话面板。你可以同时设定 AI
              角色、用户身份和场景，让它更像一段真正的剧情互动。
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={resetConversation} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4" />
            新对话
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 py-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">快速预设</div>
            <div className="flex flex-wrap gap-2">
              {ROLEPLAY_PRESETS.map(preset => (
                <Button
                  key={preset.id}
                  type="button"
                  size="sm"
                  variant={preset.id === selectedPresetId ? 'default' : 'outline'}
                  onClick={() => applyPreset(preset)}
                  disabled={isLoading}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="roleplay-character-name">
              AI 角色名
            </label>
            <Input
              id="roleplay-character-name"
              value={characterName}
              onChange={event => setCharacterName(event.target.value)}
              placeholder="例如：诸葛亮"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="roleplay-character-prompt">
              AI 人设
            </label>
            <Textarea
              id="roleplay-character-prompt"
              value={characterPrompt}
              onChange={event => setCharacterPrompt(event.target.value)}
              placeholder="写下角色身份、语气、知识范围、性格和禁忌。"
              rows={5}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="roleplay-user-persona">
              你的身份
            </label>
            <Textarea
              id="roleplay-user-persona"
              value={userPersona}
              onChange={event => setUserPersona(event.target.value)}
              placeholder="可选。角色扮演时可以给自己也加一层人设。"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="roleplay-scene">
              场景
            </label>
            <Input
              id="roleplay-scene"
              value={scene}
              onChange={event => setScene(event.target.value)}
              placeholder="例如：雨夜码头、宫廷书房、飞船驾驶舱"
              disabled={isLoading}
            />
          </div>

          <p className="text-muted-foreground text-xs leading-5">
            角色或场景改动较大时，建议点一次“新对话”，避免旧上下文干扰。
          </p>
        </div>

        <div className="bg-background/80 flex min-h-[28rem] flex-col rounded-xl border shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Bot className="h-4 w-4 text-orange-500" />
                当前角色：{characterName.trim() || '未命名角色'}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {scene.trim() || '未设置场景，默认自由对话'}
              </p>
            </div>
            {tokenUsage ? <Badge variant="outline">本轮 {tokenUsage} tokens</Badge> : null}
          </div>

          <div
            ref={messagesRef}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div className="text-muted-foreground flex h-full min-h-48 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center">
                <Bot className="mb-3 h-8 w-8 text-orange-500" />
                <p className="text-sm font-medium">先设定角色，再说第一句话。</p>
                <p className="mt-2 text-xs leading-5">
                  M2-her 会结合 AI 人设、你的身份、场景和完整历史消息来生成回复。
                </p>
              </div>
            ) : null}

            {messages.map((message, index) => {
              const isAssistant = message.role === 'assistant'
              return (
                <div
                  key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      isAssistant
                        ? 'bg-muted text-foreground border'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-[11px] opacity-80">
                      {isAssistant ? (
                        <Bot className="h-3.5 w-3.5" />
                      ) : (
                        <User className="h-3.5 w-3.5" />
                      )}
                      <span>{isAssistant ? characterName.trim() || '角色' : '你'}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              )
            })}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground rounded-2xl border px-4 py-3 text-sm">
                  {characterName.trim() || '角色'} 正在组织语气与设定...
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}
          </div>

          <div className="space-y-3 border-t px-4 py-4">
            <Textarea
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={handlePromptKeyDown}
              placeholder="先说一句话，看看这个角色能不能立住。"
              rows={4}
              disabled={isLoading}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs">回车发送，Shift + 回车换行</p>
              <Button onClick={() => void handleSend()} disabled={!canSend} loading={isLoading}>
                <Send className="h-4 w-4" />
                发送
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
