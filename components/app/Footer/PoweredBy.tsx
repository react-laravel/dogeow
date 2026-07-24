import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const assetBaseUrl = process.env.NEXT_PUBLIC_ASSET_BASE_URL || ''

const techLinks = [
  {
    href: 'https://laravel.com',
    src: `${assetBaseUrl}/images/tech/laravel.svg`,
    alt: 'Laravel',
  },
  {
    href: 'https://react.dev',
    src: `${assetBaseUrl}/images/tech/react.svg`,
    alt: 'React',
  },
  {
    href: 'https://nextjs.org',
    src: `${assetBaseUrl}/images/tech/next-js.svg`,
    alt: 'Next.js',
    needsInvert: true,
  },
  {
    href: 'https://www.typescriptlang.org',
    src: `${assetBaseUrl}/images/tech/typescript.svg`,
    alt: 'TypeScript',
  },
  {
    href: 'https://tailwindcss.com',
    src: `${assetBaseUrl}/images/tech/tailwind.svg`,
    alt: 'Tailwind CSS',
  },
  {
    href: 'https://ui.shadcn.com',
    src: `${assetBaseUrl}/images/tech/shadcn.svg`,
    alt: 'shadcn/ui',
    needsInvert: true,
  },
] as const

interface TechLinkProps {
  href: string
  src: string
  alt: string
  needsInvert?: boolean
}

const TechLink: React.FC<TechLinkProps> = ({ href, src, alt, needsInvert }) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="hover:bg-accent/70 inline-flex size-7 items-center justify-center rounded-lg transition-colors"
  >
    <Image
      src={src}
      alt={alt}
      width={18}
      height={18}
      className={`transition-transform hover:scale-110 ${needsInvert ? 'dark:invert' : ''}`}
    />
  </Link>
)

const PoweredBy: React.FC = () => (
  <div className="text-muted-foreground flex items-center gap-1 text-xs sm:text-sm">
    <span className="mr-1">Powered by</span>
    {techLinks.map(link => (
      <TechLink key={link.href} {...link} />
    ))}
  </div>
)

export default PoweredBy
