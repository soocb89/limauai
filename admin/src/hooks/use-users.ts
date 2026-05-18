import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface AdminUser {
  id: string
  username: string
  role: 'admin' | 'agent'
  created_at: string
}

export function useUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ['users'],
    queryFn: () => apiFetch('/admin/auth/users'),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { username: string; password: string; role: 'admin' | 'agent' }) =>
      apiFetch('/admin/auth/users', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/auth/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiFetch(`/admin/auth/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ password }) }),
  })
}
