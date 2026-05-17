'use client'

import { useState } from 'react'
import { usePromotions, useDeletePromotion, useTagCustomers } from '@/hooks/use-promotions'
import { PromotionForm } from '@/components/PromotionForm'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { useRole } from '@/components/RoleProvider'

export default function PromotionsPage() {
  const { data: promotions = [], isLoading } = usePromotions()
  const deleteMutation = useDeletePromotion()
  const [showForm, setShowForm] = useState(false)
  const role = useRole()
  const isAgent = role === 'agent'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Promotions</h1>
        {!isAgent && (
          <Button onClick={() => setShowForm(true)}>+ New Promotion</Button>
        )}
      </div>

      {!isAgent && showForm && (
        <div className="border rounded-lg p-4">
          <h2 className="font-medium mb-3">New Promotion</h2>
          <PromotionForm onDone={() => setShowForm(false)} />
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <PromotionTable
          promotions={promotions}
          isAgent={isAgent}
          onDelete={async (id) => {
            await deleteMutation.mutateAsync(id)
            toast.success('Deleted')
          }}
        />
      )}
    </div>
  )
}

function PromotionTable({
  promotions,
  isAgent,
  onDelete,
}: {
  promotions: ReturnType<typeof usePromotions>['data'] & {}
  isAgent: boolean
  onDelete: (id: string) => Promise<void>
}) {
  if (promotions.length === 0) {
    return <p className="text-muted-foreground text-sm">No promotions.</p>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
          {!isAgent && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {promotions.map((p) => (
          <PromotionRow key={p.id} promotion={p} isAgent={isAgent} onDelete={onDelete} />
        ))}
      </TableBody>
    </Table>
  )
}

function PromotionRow({
  promotion: p,
  isAgent,
  onDelete,
}: {
  promotion: NonNullable<ReturnType<typeof usePromotions>['data']>[number]
  isAgent: boolean
  onDelete: (id: string) => Promise<void>
}) {
  const tagMutation = useTagCustomers(p.id)

  return (
    <TableRow>
      <TableCell className="font-medium">{p.name}</TableCell>
      <TableCell>{p.description ?? '—'}</TableCell>
      <TableCell>
        <Badge variant={p.active ? 'default' : 'secondary'}>{p.active ? 'Active' : 'Inactive'}</Badge>
      </TableCell>
      {!isAgent && (
        <TableCell>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const r = await tagMutation.mutateAsync()
                toast.success(`Tagged ${r.tagged} customers`)
              }}
              disabled={tagMutation.isPending}
            >
              Tag
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(p.id)}>
              Del
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  )
}
