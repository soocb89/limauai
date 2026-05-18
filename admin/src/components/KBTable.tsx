'use client'

import { useState } from 'react'
import { KBEntry, useDeleteKB, useDeleteManyKB, useDeleteAllKB } from '@/hooks/use-kb'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

interface Props {
  entries: KBEntry[]
  onEdit: (entry: KBEntry) => void
}

export function KBTable({ entries, onEdit }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const deleteMutation = useDeleteKB()
  const deleteManyMutation = useDeleteManyKB()
  const deleteAllMutation = useDeleteAllKB()

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === entries.length) setSelected(new Set())
    else setSelected(new Set(entries.map((e) => e.id)))
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return
    await deleteMutation.mutateAsync(id)
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
    toast.success('Deleted')
  }

  async function handleDeleteSelected() {
    const ids = Array.from(selected)
    if (!confirm(`Delete ${ids.length} selected entries?`)) return
    await deleteManyMutation.mutateAsync(ids)
    setSelected(new Set())
    toast.success(`Deleted ${ids.length} entries`)
  }

  async function handleDeleteAll() {
    if (!confirm(`Delete ALL ${entries.length} KB entries? This cannot be undone.`)) return
    await deleteAllMutation.mutateAsync()
    setSelected(new Set())
    toast.success('All entries deleted')
  }

  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm p-4">No KB entries.</p>
  }

  const allSelected = selected.size === entries.length
  const anySelected = selected.size > 0

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {anySelected && (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={deleteManyMutation.isPending}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete Selected ({selected.size})
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDeleteAll}
          disabled={deleteAllMutation.isPending}
          className="ml-auto"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Delete All ({entries.length})
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-72">Title</TableHead>
              <TableHead className="w-28">Category</TableHead>
              <TableHead>Content</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => {
              const isExpanded = expanded.has(e.id)
              return (
                <TableRow key={e.id} className={selected.has(e.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(e.id)}
                      onCheckedChange={() => toggleSelect(e.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-sm align-top py-3">
                    {e.title}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground align-top py-3">
                    {e.category ?? '—'}
                  </TableCell>
                  <TableCell className="align-top py-3">
                    <div
                      className={`text-sm whitespace-pre-wrap cursor-pointer ${isExpanded ? '' : 'line-clamp-2'}`}
                      onClick={() => toggleExpand(e.id)}
                      title={isExpanded ? 'Click to collapse' : 'Click to expand'}
                    >
                      {e.content}
                    </div>
                    {!isExpanded && e.content.length > 120 && (
                      <button
                        className="text-xs text-primary mt-0.5"
                        onClick={() => toggleExpand(e.id)}
                      >
                        Show more
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="align-top py-3">
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="outline" onClick={() => onEdit(e)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(e.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
