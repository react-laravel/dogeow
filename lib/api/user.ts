'use client'

import useSWR from 'swr'

import type { User } from '@/app'
import { get, put } from './core'
import { baseSWRConfig, apiFetcher } from './swr'

// 用户相关API
const resolveUserPayload = (payload: User | { user?: User }): User =>
  'user' in payload && payload.user ? payload.user : (payload as User)

export const fetchCurrentUser = () => get<User | { user?: User }>('/user').then(resolveUserPayload)

export const useUser = () =>
  useSWR<User>(
    '/user',
    async url => resolveUserPayload(await apiFetcher<User | { user?: User }>(url)),
    baseSWRConfig
  )

export interface ChangePasswordPayload {
  currentPassword: string
  password: string
  passwordConfirmation?: string
}

export const changePassword = ({
  currentPassword,
  password,
  passwordConfirmation,
}: ChangePasswordPayload) =>
  put('/profile/password', {
    current_password: currentPassword,
    password,
    password_confirmation: passwordConfirmation ?? password,
  })
