import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface Promotion {
  id: number
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
      apiFetch<{ id: number }>('/admin/promotions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions'] }),
  })
}

export function useDeletePromotion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/admin/promotions/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions'] }),
  })
}

export function useTagCustomers(id: number) {
  return useMutation({
    mutationFn: () =>
      apiFetch<{ tagged: number }>(`/admin/promotions/${id}/tag-customers`, { method: 'POST' }),
  })
}

export function useBroadcastStats(promotionId: number | null) {
  return useQuery<{ total: number; sent: number; failed: number; pending: number }>({
    queryKey: ['broadcast-stats', promotionId],
    queryFn: () => apiFetch(`/admin/broadcast/${promotionId}/stats`),
    enabled: promotionId !== null,
  })
}

export function useSendBroadcast() {
  return useMutation({
    mutationFn: (data: { promotionId: number; message: string; sendAt?: string }) =>
      apiFetch<{ queued: number }>('/admin/broadcast', { method: 'POST', body: JSON.stringify(data) }),
  })
}
