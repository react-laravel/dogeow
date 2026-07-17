import { KnowledgeGraphSsoClient } from './knowledge-graph-sso-client'

export default async function KnowledgeGraphSsoPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string; code_challenge?: string }>
}) {
  const { return_to: returnTo, code_challenge: codeChallenge } = await searchParams

  return (
    <KnowledgeGraphSsoClient
      returnTo={returnTo || 'https://mind.dogeow.com/'}
      codeChallenge={codeChallenge || ''}
    />
  )
}
