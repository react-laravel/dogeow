export interface Location {
  country: string
  region: string
  city: string
  isp: string
  timezone: string
}

export interface BasicInfo {
  ip: string
  user_agent: string
}

export interface LocationInfo {
  location: Location
  error?: string
}

export interface LogFile {
  name: string
  date: string
  size: number
  modified: number
}

export type DashboardSection = 'location' | 'logs' | 'minimax'

export interface MiniMaxModelRemain {
  model_name: string
  remains_time: number
  current_interval_total_count: number
  current_interval_usage_count: number
  current_weekly_total_count: number
  current_weekly_usage_count: number
  weekly_remains_time: number
  start_time: number
  end_time: number
  weekly_start_time: number
  weekly_end_time: number
}

export interface MiniMaxSubscriptionResponse {
  model_remains: MiniMaxModelRemain[]
  base_resp?: { status_code: number; status_msg: string }
}

export interface MiniMaxSubscriptionDetailResponse {
  current_subscribe?: {
    current_subscribe_end_time?: string
    current_subscribe_title?: string
    current_credit_reload_time?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface MiniMaxBillingRecord {
  consume_token: string | number
  created_at: number
  consume_time?: string
  [key: string]: unknown
}

export interface MiniMaxBillingResponse {
  charge_records?: MiniMaxBillingRecord[]
  total_cnt?: number
  [key: string]: unknown
}
