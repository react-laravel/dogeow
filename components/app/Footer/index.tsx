'use client'

import BuiltBy from './BuiltBy'
import PoweredBy from './PoweredBy'
import ICP from './ICP'
import FooterLinks from './FooterLinks'

export default function Footer() {
  return (
    <footer className="border-border/60 bg-card/35 mt-auto border-t px-[var(--page-gutter)] py-6 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2.5 text-center">
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
