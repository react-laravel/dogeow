import { RepoWatchSsoClient } from './repo-watch-sso-client'

export default async function RepoWatchSsoPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>
}) {
  const { return_to: returnTo } = await searchParams

  return <RepoWatchSsoClient returnTo={returnTo || 'https://repo-watch.dogeow.com/'} />
}
