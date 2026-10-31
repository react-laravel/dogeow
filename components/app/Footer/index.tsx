'use client'

import BuiltBy from './BuiltBy'
import PoweredBy from './PoweredBy'
import ICP from './ICP'
import FooterLinks from './FooterLinks'

export default function Footer() {
  return (
    <footer className="mt-auto px-[var(--page-gutter)] pt-10 pb-8">
      <div className="border-border/60 mx-auto flex w-full max-w-5xl flex-col items-center gap-3 border-t pt-6 text-center">
        <FooterLinks />
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <BuiltBy />
          <PoweredBy />
        </div>
        <ICP />
      </div>
    </footer>
  )
}
