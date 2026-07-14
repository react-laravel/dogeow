import { RpgSsoClient } from './rpg-sso-client'

export default async function RpgSsoPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>
}) {
  const { return_to: returnTo } = await searchParams

  return <RpgSsoClient returnTo={returnTo || 'https://rpg.dogeow.com/'} />
}
