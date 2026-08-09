import { AiTranslateSsoClient } from './ai-translate-sso-client'

export default async function AiTranslateSsoPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string; code_challenge?: string }>
}) {
  const { return_to: returnTo, code_challenge: codeChallenge } = await searchParams

  return (
    <AiTranslateSsoClient
      returnTo={returnTo || 'https://next.dogeow.com/'}
      codeChallenge={codeChallenge || ''}
    />
  )
}
