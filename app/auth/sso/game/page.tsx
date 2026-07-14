import { GameSsoClient } from './game-sso-client'

export default async function GameSsoPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>
}) {
  const { return_to: returnTo } = await searchParams

  return <GameSsoClient returnTo={returnTo || 'https://game.dogeow.com/'} />
}
