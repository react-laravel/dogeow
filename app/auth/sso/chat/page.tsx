import { ChatSsoClient } from './chat-sso-client'

export default async function ChatSsoPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>
}) {
  const { return_to: returnTo } = await searchParams

  return <ChatSsoClient returnTo={returnTo || 'https://chat.dogeow.com/chat'} />
}
