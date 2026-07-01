export function buildAiPromptForExcerpt(
  excerpt: string,
  chapterTitle: string,
  bookTitle: string
): string {
  const trimmed = excerpt.trim()
  const chapterHint = chapterTitle.trim() ? `（${chapterTitle.trim()}）` : ''
  return `请解读《${bookTitle}》以下片段${chapterHint}，并回答我可能追问的问题：\n\n「${trimmed}」\n\n我的问题：`
}
