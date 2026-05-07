'use client'

import { KBEntry } from '@/hooks/use-kb'
import { useDeleteKB } from '@/hooks/use-kb'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

interface Props {
  entries: KBEntry[]
  onEdit: (entry: KBEntry) => void
}

export function KBTable({ entries, onEdit }: Props) {
  const deleteMutation = useDeleteKB()

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id)
    toast.success('Entry deleted')
  }

  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm p-4">No KB entries.</p>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Content</TableHead>
          <TableHead className="w-24">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="font-medium">{e.title}</TableCell>
            <TableCell>{e.category ?? '—'}</TableCell>
            <TableCell className="max-w-xs truncate">{e.content}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => onEdit(e)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(e.id)}
                  disabled={deleteMutation.isPending}
                >
                  Del
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
