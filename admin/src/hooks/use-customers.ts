import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface Customer {
  id: string
  name: string | null
  phone: string
  language: string | null
  insurer: string | null
  renewal_date: string | null
  car_plate: string | null
  status: 'lead' | 'customer'
  source: string
  tags: string[]
  custom_fields: Record<string, string>
  last_intent: string | null
  intent_confidence: number | null
}

export function useCustomers(params?: { search?: string; language?: string; insurer?: string; page?: number }) {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.language) qs.set('language', params.language)
  if (params?.insurer) qs.set('insurer', params.insurer)
  if (params?.page) qs.set('page', String(params.page))
  const path = `/admin/customers${qs.toString() ? `?${qs}` : ''}`
  return useQuery<{ data: Customer[]; total: number; page: number; limit: number }>({
    queryKey: ['customers', params],
    queryFn: () => apiFetch(path),
  })
}

export function useCustomer(id: string | null) {
  return useQuery<Customer>({
    queryKey: ['customer', id],
    queryFn: () => apiFetch(`/admin/customers/${id}`),
    enabled: id !== null,
  })
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Pick<Customer, 'name' | 'car_plate' | 'insurer' | 'renewal_date' | 'tags' | 'custom_fields' | 'status'>>) =>
      apiFetch(`/admin/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer', id] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useImportCustomers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/admin/customers/import', {
        method: 'POST',
        body: form,
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<{ imported: number }>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}
