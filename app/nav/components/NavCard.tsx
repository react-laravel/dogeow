'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { NavItem } from '@/app/nav/types'
import { useNavStore } from '@/app/nav/stores/navStore'
import { Globe } from 'lucide-react'
import NavCardActions from './NavCardActions'

interface NavCardProps {
  item: NavItem
  highlight?: string
}

export function NavCard({ item, highlight }: NavCardProps) {
  const { recordClick, deleteItem } = useNavStore()

  const highlightText = (text: string, highlightTerm?: string) => {
    if (!highlightTerm) return text

    const parts = text.split(new RegExp(`(${highlightTerm})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === highlightTerm.toLowerCase() ? (
        <mark key={i} className="bg-primary/20 text-inherit">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault()
      void visitSite()
    }
  }

  const visitSite = async () => {
    try {
      await recordClick(item.id)

      if (item.is_new_window) {
        window.open(item.url, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = item.url
      }
    } catch (error) {
      console.error('访问失败:', error)
    }
  }

  return (
    <Card className="group border-border/60 overflow-hidden py-0 transition-colors hover:border-border hover:bg-accent/20">
      <CardContent className="flex items-center gap-2.5 p-2.5">
        <div className="bg-background flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {item.icon ? (
            <Image
              src={item.icon}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              unoptimized
            />
          ) : (
            <Globe className="text-muted-foreground h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <a
            href={item.url}
            target={item.is_new_window ? '_blank' : '_self'}
            rel="noopener noreferrer"
            onClick={handleClick}
            className="block min-w-0"
          >
            <h3 className="truncate text-sm font-medium leading-tight">
              {highlightText(item.name, highlight)}
            </h3>
            {item.description ? (
              <p className="text-muted-foreground mt-0.5 truncate text-xs">
                {highlightText(item.description, highlight)}
              </p>
            ) : (
              <p className="text-muted-foreground/70 mt-0.5 truncate text-xs">{item.url}</p>
            )}
          </a>
        </div>
        <div className="shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
          <NavCardActions item={item} deleteItem={deleteItem} />
        </div>
      </CardContent>
    </Card>
  )
}
