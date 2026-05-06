'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

interface Correction {
  id: number
  intent: string
  original: string
  corrected: string
  created_at: string
}

const schema = z.object({
  intent: z.string().min(1, 'Required'),
  original: z.string().min(1, 'Required'),
  corrected: z.string().min(1, 'Required'),
})
type FormData = z.infer<typeof schema>

export default function CorrectionsPage() {
  const [filterIntent, setFilterIntent] = useState('')
  const qc = useQueryClient()
  const path = filterIntent ? `/admin/corrections?intent=${filterIntent}` : '/admin/corrections'
  const { data: corrections = [], isLoading } = useQuery<Correction[]>({
    queryKey: ['corrections', filterIntent],
    queryFn: () => apiFetch(path),
  })
  const addMutation = useMutation({
    mutationFn: (data: FormData) =>
      apiFetch('/admin/corrections', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['corrections'] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/admin/corrections/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['corrections'] }),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    await addMutation.mutateAsync(data)
    toast.success('Correction added')
    reset()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Corrections</h1>

      <div className="border rounded-lg p-4 max-w-md space-y-4">
        <h2 className="font-medium">Add Correction</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label>Intent</Label>
            <Input {...register('intent')} placeholder="e.g. quotation_request" />
            {errors.intent && <p className="text-sm text-destructive">{errors.intent.message}</p>}
          </div>
          <div>
            <Label>Original (bot said)</Label>
            <Textarea {...register('original')} rows={2} />
            {errors.original && <p className="text-sm text-destructive">{errors.original.message}</p>}
          </div>
          <div>
            <Label>Corrected (should say)</Label>
            <Textarea {...register('corrected')} rows={2} />
            {errors.corrected && <p className="text-sm text-destructive">{errors.corrected.message}</p>}
          </div>
          <Button type="submit" disabled={addMutation.isPending}>
            {addMutation.isPending ? 'Saving…' : 'Add'}
          </Button>
        </form>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <Input
            placeholder="Filter by intent…"
            value={filterIntent}
            onChange={(e) => setFilterIntent(e.target.value)}
            className="max-w-xs"
          />
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : corrections.length === 0 ? (
          <p className="text-sm text-muted-foreground">No corrections.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intent</TableHead>
                <TableHead>Original</TableHead>
                <TableHead>Corrected</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {corrections.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.intent}</TableCell>
                  <TableCell className="max-w-xs truncate">{c.original}</TableCell>
                  <TableCell className="max-w-xs truncate">{c.corrected}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        await deleteMutation.mutateAsync(c.id)
                        toast.success('Deleted')
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      Del
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
