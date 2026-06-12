import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Word } from '../types'
import { toast } from 'sonner'
import { mutate } from 'swr'
import { patch, ApiRequestError } from '@/lib/api'
import { useState, useEffect } from 'react'
import { WordEditFields } from './WordEditFields'

interface EditWordDialogProps {
  word: Word
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditWordDialog({ word, open, onOpenChange }: EditWordDialogProps) {
  const [editedExplanation, setEditedExplanation] = useState(word.explanation ?? '')
  const [editedExamples, setEditedExamples] = useState(
    word.example_sentences?.map(e => `${e.en}\n${e.zh}`).join('\n\n') ?? ''
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (open) {
      setEditedExplanation(word.explanation ?? '')
      setEditedExamples(word.example_sentences?.map(e => `${e.en}\n${e.zh}`).join('\n\n') ?? '')
    }
  }, [open, word])

  const generateData = async () => {
    setIsGenerating(true)
    try {
      const prompt = `请帮我生成这个英语单词的数据：\n\n单词: ${word.content}\n当前释义: ${word.explanation || '(无)'}\n当前例句: ${word.example_sentences?.map(e => e.en).join('; ') || '(无)'}\n\n请严格按以下格式返回（不要有其他内容）：\n【释义】(完整的中文释义，包含词性)\n【例句1】英文句子\n【翻译1】中文翻译\n【例句2】英文句子\n【翻译2】中文翻译`
      const body = {
        useChat: true,
        messages: [{ role: 'user' as const, content: prompt }],
        command: '你是一个英语学习助手。请严格按照用户要求的格式返回数据。',
      }
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error('生成失败')
      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应')
      let content = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = new TextDecoder().decode(value)
        const lines = text.split('\n').filter(line => line.trim())
        for (const line of lines) {
          if (line.startsWith('0:')) {
            const match = line.match(/^0:"(.*)"$/)
            if (match) {
              content += match[1]
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\')
            }
          }
        }
      }
      const explanationMatch = content.match(/【释义】([\s\S]+?)(?=【例句|$)/)
      if (explanationMatch) {
        setEditedExplanation(explanationMatch[1].trim())
      }
      const examples: string[] = []
      const exampleMatches = content.matchAll(
        /【例句\d+】([\s\S]+?)【翻译\d+】([\s\S]+?)(?=【例句|$)/g
      )
      for (const m of exampleMatches) {
        examples.push(`${m[1].trim()}\n${m[2].trim()}`)
      }
      if (examples.length > 0) {
        setEditedExamples(examples.join('\n\n'))
      }
      toast.success('数据已生成，请检查后保存')
    } catch (error) {
      console.error('生成数据失败:', error)
      toast.error('生成数据失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const examplePairs = editedExamples
        .split('\n\n')
        .filter(p => p.trim())
        .map(pair => {
          const lines = pair.split('\n').filter(l => l.trim())
          return {
            en: lines[0] || '',
            zh: lines[1] || '',
          }
        })
        .filter(e => e.en)
      const payload = {
        explanation: editedExplanation,
        example_sentences: examplePairs,
      }

      console.log('PATCH /word payload:', payload)

      await patch(`/word/${word.id}`, payload)

      toast.success('单词数据已更新')
      mutate('/word/daily')
      onOpenChange(false)
    } catch (error) {
      console.error('保存失败:', error)

      // 如果是后端验证错误，尝试展示具体字段错误信息
      if (error instanceof ApiRequestError && error.data?.errors) {
        const errors = error.data.errors
        // 找到第一个字段错误并展示
        const firstField = Object.keys(errors)[0]
        const firstMsg = Array.isArray(errors[firstField])
          ? errors[firstField][0]
          : String(errors[firstField])
        toast.error(firstMsg)
      } else if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('保存失败')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[85vh] flex-col p-0">
        <SheetHeader className="border-b p-4 pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            编辑单词 - {word.content}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          <WordEditFields
            explanation={editedExplanation}
            examples={editedExamples}
            isGenerating={isGenerating}
            isSaving={isSaving}
            onExplanationChange={setEditedExplanation}
            onExamplesChange={setEditedExamples}
            onGenerate={generateData}
            onSave={handleSave}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
