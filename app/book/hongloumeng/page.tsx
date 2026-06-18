import { Long_Cang, Noto_Serif_SC } from 'next/font/google'
import { HongloumengReader } from './components/HongloumengReader'

const longCang = Long_Cang({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-long-cang',
  display: 'swap',
  preload: false,
})

const notoSerif = Noto_Serif_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
  preload: false,
})

export default function HongloumengBookPage() {
  return (
    <div className={`${longCang.variable} ${notoSerif.variable} h-full min-h-0`}>
      <HongloumengReader />
    </div>
  )
}
