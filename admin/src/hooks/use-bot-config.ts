import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export function useBotConfig() {
  return useQuery<Record<string, string>>({
    queryKey: ['bot-config'],
    queryFn: () => apiFetch('/admin/bot-config'),
  })
}

export function useUpdateBotConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiFetch('/admin/bot-config', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bot-config'] }),
  })
}
