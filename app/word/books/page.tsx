'use client'

import Link from 'next/link'
import { useBooks, useWordSettings } from '../hooks/useWord'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { updateWordSettings } from '../hooks/useWord'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, X } from 'lucide-react'
import { PageContainer } from '@/components/layout'

export default function BooksPage() {
  const router = useRouter()
  const { data: books, isLoading } = useBooks()
  const { data: settings } = useWordSettings()
  const currentBookId = settings?.current_book_id

  const handleSelectBook = async (bookId: number) => {
    try {
      await updateWordSettings({ current_book_id: bookId })
      toast.success('单词书选择成功')
      router.push('/word')
    } catch (error) {
      toast.error('选择单词书失败')
      console.error('选择单词书失败:', error)
    }
  }

  if (isLoading) {
    return (
      <PageContainer className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/word">
          <Button variant="ghost" size="icon" aria-label="返回背单词首页">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="flex-1 text-2xl font-bold">单词书</h1>
        <Link href="/word">
          <Button variant="ghost" size="icon" aria-label="关闭单词书页面">
            <X className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {books && books.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {books.map(book => (
            <Card key={book.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle>{book.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">{book.description}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-sm">
                    共 {book.total_words} 个单词
                  </span>
                  <div className="flex items-center gap-2">
                    <Link href={`/word/books/${book.id}`}>
                      <Button variant="outline">查看</Button>
                    </Link>
                    {currentBookId === book.id ? (
                      <span className="text-primary inline-flex items-center gap-1 text-sm">
                        <Check className="h-4 w-4" />
                        当前使用
                      </span>
                    ) : (
                      <Button onClick={() => handleSelectBook(book.id)}>选择</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">暂无单词书，请先运行 Seeder 导入单词数据</p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}
