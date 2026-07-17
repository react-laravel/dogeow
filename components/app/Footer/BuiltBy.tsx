import * as React from 'react'
import Link from 'next/link'

import Heart from './Heart'

const BuiltBy = () => {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs sm:text-sm">
      <span>Built by</span>
      <Link href="/about" className="text-foreground hover:text-primary transition-colors">
        小李世界
      </Link>
      <span>with</span>
      <Heart />
    </div>
  )
}

export default BuiltBy
