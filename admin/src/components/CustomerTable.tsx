'use client'

import { Customer } from '@/hooks/use-customers'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Props {
  customers: Customer[]
}

export function CustomerTable({ customers }: Props) {
  if (customers.length === 0) {
    return <p className="text-muted-foreground text-sm p-4">No customers found.</p>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Language</TableHead>
          <TableHead>Insurer</TableHead>
          <TableHead>Renewal Date</TableHead>
          <TableHead>Tags</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((c) => (
          <TableRow key={c.id}>
            <TableCell>{c.name ?? '—'}</TableCell>
            <TableCell>{c.phone}</TableCell>
            <TableCell>{c.language}</TableCell>
            <TableCell>{c.insurer ?? '—'}</TableCell>
            <TableCell>
              {c.renewal_date ? new Date(c.renewal_date).toLocaleDateString() : '—'}
            </TableCell>
            <TableCell>
              <div className="flex gap-1 flex-wrap">
                {c.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
