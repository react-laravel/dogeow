export const AI_ADMIN_USER_ID = 1

export interface AiAccessUser {
  id: number
  is_admin?: boolean
}

export function canUseAi(user: AiAccessUser | null | undefined): boolean {
  return user?.id === AI_ADMIN_USER_ID && user.is_admin === true
}
