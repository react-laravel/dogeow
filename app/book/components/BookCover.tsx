'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { getBookCoverSrc } from '@/app/book/utils/registry'

interface BookCoverProps {
  bookId: string
  fallbackIcon: string
  color: string
}

export function BookCover({ bookId, fallbackIcon, color }: BookCoverProps) {
  const [failed, setFailed] = useState(false)
  const handleError = useCallback(() => setFailed(true), [])

  if (failed) {
    return (
      <div
        className="flex aspect-[2/3] w-20 shrink-0 items-center justify-center rounded-md text-2xl sm:w-24"
        style={{ backgroundColor: `${color}20` }}
        aria-hidden
      >
        {fallbackIcon}
      </div>
    )
  }

  return (
    <div className="bg-muted relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-md shadow-sm ring-1 ring-border sm:w-24">
      <Image
        src={getBookCoverSrc(bookId)}
        alt=""
        fill
        sizes="(min-width: 640px) 96px, 80px"
        className="object-cover"
        onError={handleError}
      />
    </div>
  )
}
