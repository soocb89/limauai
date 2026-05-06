import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface KBEntry {
  id: number
  title: string
  content: string
  category: string | null
  created_at: string
}

export interface KBGap {
  intent: string
  avg_confidence: number
  count: number
}

export function useKB() {
  return useQuery<KBEntry[]>({
    queryKey: ['kb'],
    queryFn: () => apiFetch('/admin/kb'),
  })
}

export function useKBGaps() {
  return useQuery<KBGap[]>({
    queryKey: ['kb-gaps'],
    queryFn: () => apiFetch('/admin/kb/gaps'),
  })
}

export function useAddKB() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; content: string; category: string }) =>
      apiFetch<{ id: number }>('/admin/kb', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kb'] }),
  })
}

export function useUpdateKB(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; content: string; category: string }) =>
      apiFetch(`/admin/kb/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kb'] }),
  })
}

export function useDeleteKB() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/admin/kb/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kb'] }),
  })
}

export function useUploadKB() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, title, category }: { file: File; title: string; category: string }) => {
      const form = new FormData()
      form.append('file', file)
      form.append('title', title)
      form.append('category', category)
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? ''
      const res = await fetch(`${BASE_URL}/admin/kb/upload`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY },
        body: form,
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<{ chunks: number }>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kb'] }),
  })
}
