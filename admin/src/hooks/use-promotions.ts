import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface Promotion {
  id: string
  name: string
  description: string | null
  active: boolean
  created_at: string
}

export function usePromotions() {
  return useQuery<Promotion[]>({
    queryKey: ['promotions'],
    queryFn: () => apiFetch('/admin/promotions'),
  })
}

export function useAddPromotion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description: string; active: boolean }) =>
      apiFetch<{ id: string }>('/admin/promotions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions'] }),
  })
}

export function useDeletePromotion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/promotions/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions'] }),
  })
}

export function useTagCustomers(id: string) {
  return useMutation({
    mutationFn: () =>
      apiFetch<{ tagged: number }>(`/admin/promotions/${id}/tag-customers`, { method: 'POST' }),
  })
}

export function useBroadcastStats(promotionId: string | null) {
  return useQuery<{ total: number; sent: number; failed: number; pending: number }>({
    queryKey: ['broadcast-stats', promotionId],
    queryFn: () => apiFetch(`/admin/broadcast/${promotionId}/stats`),
    enabled: promotionId !== null,
  })
}

export function useSendBroadcast() {
  return useMutation({
    mutationFn: (data: { promotionId: string; message: string; sendAt?: string }) =>
      apiFetch<{ queued: number }>('/admin/broadcast', { method: 'POST', body: JSON.stringify(data) }),
  })
}
