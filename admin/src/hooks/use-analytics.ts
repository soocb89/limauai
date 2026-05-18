import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface AnalyticsData {
  ai_messages: { total: number; today: number; week: number }
  handoffs: { total: number; today: number; week: number }
  conversations: { total: number; today: number; week: number }
}

export function useAnalytics() {
  return useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: () => apiFetch('/admin/analytics'),
    refetchInterval: 60_000,
  })
}
