import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../_lib/auth-guard'
import { DASHBOARD_HOME_LINKS } from '@/app/dashboard/homeLinks'

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  return NextResponse.json({ data: DASHBOARD_HOME_LINKS })
}
