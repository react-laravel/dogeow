import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'

export default function FooterLinks() {
  const { t } = useTranslation()

  return (
    <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs sm:text-sm">
      <Link href="/about/privacy" className="hover:text-foreground transition-colors">
        {t('footer.privacy_policy', '隐私政策')}
      </Link>
      <Link href="/about/terms" className="hover:text-foreground transition-colors">
        {t('footer.terms_of_service', '用户协议')}
      </Link>
      <a href="https://status.dogeow.com/" className="hover:text-foreground transition-colors">
        {t('footer.site_info', '网站信息')}
      </a>
      <Link href="/about/contact" className="hover:text-foreground transition-colors">
        {t('footer.contact_us', '联系我们')}
      </Link>
    </div>
  )
}
