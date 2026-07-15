import { MysqlCompareSsoClient } from './mysql-compare-sso-client'

export default async function MysqlCompareSsoPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>
}) {
  const { return_to: returnTo } = await searchParams

  return <MysqlCompareSsoClient returnTo={returnTo || 'https://mysql-compare.dogeow.com/'} />
}
