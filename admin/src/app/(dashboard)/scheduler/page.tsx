'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface SchedulerJob {
  id: string
  type: string
  step: string
  scheduled_at: string
  status: string
  phone: string
  name: string | null
}

export default function SchedulerPage() {
  const qc = useQueryClient()
  const { data: jobs = [], isLoading } = useQuery<SchedulerJob[]>({
    queryKey: ['scheduler-jobs'],
    queryFn: () => apiFetch('/admin/scheduler/jobs'),
  })
  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/scheduler/jobs/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduler-jobs'] }),
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Scheduler</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending jobs.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Step</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((j) => (
              <TableRow key={j.id}>
                <TableCell>{j.name ?? j.phone}</TableCell>
                <TableCell>{j.type}</TableCell>
                <TableCell>{j.step}</TableCell>
                <TableCell>{new Date(j.scheduled_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={j.status === 'pending' ? 'default' : 'secondary'}>{j.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      await cancelMutation.mutateAsync(j.id)
                      toast.success('Job cancelled')
                    }}
                    disabled={cancelMutation.isPending}
                  >
                    Cancel
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
