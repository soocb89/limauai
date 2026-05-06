import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface Customer {
  id: number
  name: string | null
  phone: string
  language: string
  insurer: string | null
  policy_expiry: string | null
  tags: string[]
}

export function useCustomers(params?: { search?: string; language?: string; insurer?: string }) {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.language) qs.set('language', params.language)
  if (params?.insurer) qs.set('insurer', params.insurer)
  const path = `/admin/customers${qs.toString() ? `?${qs}` : ''}`
  return useQuery<Customer[]>({
    queryKey: ['customers', params],
    queryFn: () => apiFetch(path),
  })
}

export function useImportCustomers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? ''
      const res = await fetch(`${BASE_URL}/admin/customers/import`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY },
        body: form,
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<{ imported: number }>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}
