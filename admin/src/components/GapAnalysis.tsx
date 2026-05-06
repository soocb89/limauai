'use client'

import { useKBGaps } from '@/hooks/use-kb'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function GapAnalysis() {
  const { data: gaps = [], isLoading } = useKBGaps()
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading gaps…</p>
  if (gaps.length === 0) return <p className="text-sm text-muted-foreground">No gaps detected.</p>
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Intent</TableHead>
          <TableHead>Avg Confidence</TableHead>
          <TableHead>Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gaps.map((g) => (
          <TableRow key={g.intent}>
            <TableCell>{g.intent}</TableCell>
            <TableCell>
              <Badge variant={g.avg_confidence < 0.4 ? 'destructive' : 'secondary'}>
                {(g.avg_confidence * 100).toFixed(0)}%
              </Badge>
            </TableCell>
            <TableCell>{g.count}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
