import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface WebhookField {
  key: string
  label: string
}

export interface Webhook {
  id: string
  name: string
  token: string
  description: string | null
  fields: WebhookField[]
  message_template: string | null
  created_at: string
  last_used_at: string | null
}

export function useWebhooks() {
  return useQuery<Webhook[]>({
    queryKey: ['webhooks'],
    queryFn: () => apiFetch('/admin/webhooks'),
  })
}

export function useCreateWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string; fields: WebhookField[]; message_template?: string }) =>
      apiFetch('/admin/webhooks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}

export function useUpdateWebhook(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string; fields: WebhookField[]; message_template?: string }) =>
      apiFetch(`/admin/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}

export function useDeleteWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/webhooks/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}
