'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { WordPanel } from '../components/WordPanel'
import { PageContainer } from '@/components/layout'
import { WordPageHeader } from '../components/WordPageHeader'
import { WordToolsNav } from '../components/WordToolsNav'
import { WordDataEditor } from '../components/WordDataEditor'
import { searchWord, createWord, classifyWordEducationLevel } from '../hooks/useWord'
import { FileInput, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const MIN_WORD_LENGTH = 2
const CONCURRENCY = 8

function segmentText(text: string): { type: 'word' | 'non-word'; text: string }[] {
  const segments: { type: 'word' | 'non-word'; text: string }[] = []
  const re = /[a-zA-Z]+|[^a-zA-Z]+/g
  let m
  while ((m = re.exec(text)) !== null) {
    segments.push({
      type: /^[a-zA-Z]+$/.test(m[0]) ? 'word' : 'non-word',
      text: m[0],
    })
  }
  return segments
}

function getUniqueWords(segments: { type: string; text: string }[]): string[] {
  const seen = new Set<string>()
  return segments
    .filter(s => s.type === 'word' && s.text.length >= MIN_WORD_LENGTH)
    .map(s => s.text.toLowerCase())
    .filter(lower => {
      if (seen.has(lower)) return false
      seen.add(lower)
      return true
    })
}

export default function WordImportPage() {
  const [pastedText, setPastedText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [wordStatus, setWordStatus] = useState<Map<string, boolean>>(new Map())
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)

  const analyze = useCallback(async () => {
    const trimmed = pastedText.trim()
    if (!trimmed) {
      toast.error('请先粘贴或输入文本')
      return
    }

    const segments = segmentText(trimmed)
    const uniqueWords = getUniqueWords(segments)
    if (uniqueWords.length === 0) {
      toast.error('未识别到单词（至少 2 个字母）')
      return
    }

    setIsAnalyzing(true)
    const next = new Map<string, boolean>()

    for (let i = 0; i < uniqueWords.length; i += CONCURRENCY) {
      const chunk = uniqueWords.slice(i, i + CONCURRENCY)
      await Promise.all(
        chunk.map(async word => {
          try {
            const result = await searchWord(word)
            next.set(word, result.found)
          } catch {
            next.set(word, true)
          }
        })
      )
      setWordStatus(new Map(next))
    }

    setIsAnalyzing(false)
    const unknownCount = [...next.values()].filter(v => !v).length
    if (unknownCount > 0) {
      toast.success(`分析完成，共 ${unknownCount} 个词未在系统中`)
    } else {
      toast.success('分析完成，所有单词均在系统中')
    }
  }, [pastedText])

  const handleCreateWord = async (data: {
    phonetic_us: string
    explanation: string
    example_sentences: Array<{ en: string; zh: string }>
    education_level_codes?: string[]
  }) => {
    if (!selectedKeyword) return

    try {
      let education_level_codes = data.education_level_codes
      if (!education_level_codes?.length) {
        try {
          education_level_codes = await classifyWordEducationLevel(selectedKeyword)
        } catch {
          education_level_codes = []
        }
      }
      await createWord({
        content: selectedKeyword,
        phonetic_us: data.phonetic_us,
        explanation: data.explanation,
        example_sentences: data.example_sentences,
        education_level_codes: education_level_codes.length > 0 ? education_level_codes : undefined,
      })
      toast.success(
        education_level_codes.length > 0 ? '单词已添加并加入对应级别单词书' : '单词已添加到数据库'
      )
      setWordStatus(prev => {
        const next = new Map(prev)
        next.set(selectedKeyword.toLowerCase(), true)
        return next
      })
      setSelectedKeyword(null)
    } catch (error) {
      console.error('创建单词失败:', error)
      throw error
    }
  }

  const segments = segmentText(pastedText)
  const hasResult = wordStatus.size > 0

  return (
    <PageContainer maxWidth="3xl">
      <div className="mb-5 space-y-5">
        <WordPageHeader
          title="导入文本"
          description="从英文文章中发现生词，逐个加入词库。"
          backHref="/word"
        />
        <WordToolsNav />
      </div>

      <Card className="mb-5 gap-0 rounded-2xl py-0 shadow-none">
        <CardContent className="p-4">
          <p className="text-muted-foreground mb-2 text-sm">
            粘贴或输入英文文本，点击「分析」后，系统中不存在的单词会以波浪线下划线高亮，点击可 AI
            生成并保存。
          </p>
          <Textarea
            value={pastedText}
            onChange={e => setPastedText(e.target.value)}
            placeholder="粘贴英文段落或句子…"
            aria-label="英文文本"
            className="min-h-48 resize-y text-base leading-relaxed"
          />
          <Button
            className="mt-4 w-full"
            onClick={analyze}
            disabled={isAnalyzing || !pastedText.trim()}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <FileInput className="mr-2 h-4 w-4" />
                分析
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {hasResult && (
        <Card className="gap-0 rounded-2xl py-0 shadow-none">
          <CardContent className="p-4">
            <p className="text-muted-foreground mb-3 text-xs">
              带波浪线的词未在系统中，点击可 AI 生成并保存
            </p>
            <div className="bg-muted/30 rounded-xl p-4 leading-loose break-words">
              {segments.map((seg, idx) => {
                if (seg.type === 'non-word') {
                  return <span key={idx}>{seg.text}</span>
                }
                const lower = seg.text.toLowerCase()
                const unknown = wordStatus.get(lower) === false
                if (unknown) {
                  return (
                    <span
                      key={idx}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer text-primary underline decoration-primary decoration-wavy hover:bg-primary/10"
                      onClick={() => setSelectedKeyword(seg.text)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedKeyword(seg.text)
                        }
                      }}
                    >
                      {seg.text}
                    </span>
                  )
                }
                return <span key={idx}>{seg.text}</span>
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <WordPanel
        open={!!selectedKeyword}
        onOpenChange={open => !open && setSelectedKeyword(null)}
        title={`添加单词 · ${selectedKeyword ?? ''}`}
        description="补充释义与例句，检查后保存到词库。"
      >
        <div className="p-4">
          {selectedKeyword && (
            <WordDataEditor
              wordContent={selectedKeyword}
              onSave={handleCreateWord}
              saveButtonText="创建并保存"
            />
          )}
        </div>
      </WordPanel>
    </PageContainer>
  )
}
