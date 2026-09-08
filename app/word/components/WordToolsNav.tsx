'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileInput, ScanLine, Search } from 'lucide-react'
import { cn } from '@/lib/helpers'

export function WordToolsNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="词汇工具" className="bg-muted/50 grid grid-cols-3 gap-1 rounded-xl p-1">
      {[
        { href: '/word/search', label: '查单词', icon: Search },
        { href: '/word/import', label: '导入文本', icon: FileInput },
        { href: '/word/scan', label: '拍照识词', icon: ScanLine },
      ].map(item => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? 'page' : undefined}
          className={cn(
            'focus-visible:ring-ring flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg px-1 text-sm focus-visible:ring-2 focus-visible:outline-none',
            pathname === item.href
              ? 'bg-card text-primary shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <item.icon className="hidden size-4 sm:block" />
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
