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
  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full text-xs"
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
        <label className="text-xs font-medium">中文释义</label>
        <Textarea
          value={explanation}
          onChange={e => onExplanationChange(e.target.value)}
          placeholder="输入中文释义..."
          className="min-h-[80px] resize-none text-xs"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">例句（英文换行+中文，空行分隔多组）</label>
        <Textarea
          value={examples}
          onChange={e => onExamplesChange(e.target.value)}
          placeholder={`He is a good student.\n他是一个好学生。\n\nShe works hard.\n她努力工作。`}
          className="min-h-[120px] resize-none text-xs"
        />
      </div>
      <Button onClick={onSave} disabled={isSaving} className="w-full" size="sm">
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
