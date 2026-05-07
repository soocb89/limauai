import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface Conversation {
  id: string
  phone: string
  name: string | null
  status: 'open' | 'handoff' | 'resolved'
  last_message_at: string
  tags: string[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export function useConversations(status?: string) {
  const path = status ? `/admin/conversations?status=${status}` : '/admin/conversations'
  return useQuery<Conversation[]>({
    queryKey: ['conversations', status],
    queryFn: () => apiFetch(path),
    refetchInterval: 5000,
  })
}

export function useMessages(conversationId: string | null) {
  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: () => apiFetch(`/admin/conversations/${conversationId}/messages`),
    enabled: conversationId !== null,
    refetchInterval: 3000,
  })
}

export function useSendReply(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (message: string) =>
      apiFetch(`/admin/conversations/${conversationId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ text: message }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', conversationId] }),
  })
}

export function useUpdateStatus(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: string) =>
      apiFetch(`/admin/conversations/${conversationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })
}
