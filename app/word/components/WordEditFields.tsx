import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, RefreshCw, Save } from 'lucide-react'

interface WordEditFieldsProps {
  explanation: string
  examples: string
  isGenerating: boolean
  isSaving: boolean
  onExplanationChange: (value: string) => void
  onExamplesChange: (value: string) => void
  onGenerate: () => void
  onSave: () => void
}

export function WordEditFields({
  explanation,
  examples,
  isGenerating,
  isSaving,
  onExplanationChange,
  onExamplesChange,
  onGenerate,
  onSave,
}: WordEditFieldsProps) {
  const id = useId()
  return (
    <div className="space-y-5">
      <Button
        variant="outline"
        size="lg"
        onClick={onGenerate}
        disabled={isGenerating || isSaving}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            生成中...
          </>
        ) : (
          <>
            <RefreshCw className="mr-1 h-3 w-3" />
            AI 生成数据
          </>
        )}
      </Button>
      <div className="space-y-1">
        <label htmlFor={`${id}-explanation`} className="text-sm font-medium">
          中文释义
        </label>
        <Textarea
          id={`${id}-explanation`}
          value={explanation}
          onChange={e => onExplanationChange(e.target.value)}
          placeholder="输入中文释义..."
          className="min-h-28 resize-y text-sm leading-relaxed"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${id}-examples`} className="text-sm font-medium">
          例句
        </label>
        <p className="text-muted-foreground text-xs">每组英文、中文各一行，多组之间留空行。</p>
        <Textarea
          id={`${id}-examples`}
          value={examples}
          onChange={e => onExamplesChange(e.target.value)}
          placeholder={`He is a good student.\n他是一个好学生。\n\nShe works hard.\n她努力工作。`}
          className="min-h-44 resize-y text-sm leading-relaxed"
        />
      </div>
      <Button onClick={onSave} disabled={isSaving || isGenerating} className="w-full" size="lg">
        {isSaving ? (
          <>
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            保存中...
          </>
        ) : (
          <>
            <Save className="mr-1 h-3 w-3" />
            保存修改
          </>
        )}
      </Button>
    </div>
  )
}
