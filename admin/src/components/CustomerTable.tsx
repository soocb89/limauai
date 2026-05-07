'use client'

import { useState } from 'react'
import { Customer, useUpdateCustomer } from '@/hooks/use-customers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Pencil, Check, X, Plus } from 'lucide-react'

interface Props {
  customers: Customer[]
}

function EditableRow({ c }: { c: Customer }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(c.name ?? '')
  const [carPlate, setCarPlate] = useState(c.car_plate ?? '')
  const [newTag, setNewTag] = useState('')
  const [tags, setTags] = useState<string[]>(c.tags)
  const [newFieldKey, setNewFieldKey] = useState('')
  const [newFieldVal, setNewFieldVal] = useState('')
  const [customFields, setCustomFields] = useState<Record<string, string>>(c.custom_fields ?? {})
  const update = useUpdateCustomer(c.id)

  async function save() {
    await update.mutateAsync({ name: name || null, car_plate: carPlate || null, tags, custom_fields: customFields })
    toast.success('Saved')
    setEditing(false)
  }

  function cancel() {
    setName(c.name ?? ''); setCarPlate(c.car_plate ?? '')
    setTags(c.tags); setCustomFields(c.custom_fields ?? {})
    setEditing(false)
  }

  function addTag() {
    const t = newTag.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setNewTag('')
  }

  function removeTag(t: string) { setTags(tags.filter(x => x !== t)) }

  function addField() {
    const k = newFieldKey.trim(); const v = newFieldVal.trim()
    if (k) setCustomFields({ ...customFields, [k]: v })
    setNewFieldKey(''); setNewFieldVal('')
  }

  function removeField(k: string) {
    const f = { ...customFields }; delete f[k]; setCustomFields(f)
  }

  return (
    <TableRow>
      <TableCell>
        {editing
          ? <Input value={name} onChange={e => setName(e.target.value)} className="h-7 text-sm w-36" />
          : <span>{c.name ?? '—'}</span>}
      </TableCell>
      <TableCell>{c.phone}</TableCell>
      <TableCell>{c.language}</TableCell>
      <TableCell>{c.insurer ?? '—'}</TableCell>
      <TableCell>
        {editing
          ? <Input value={carPlate} onChange={e => setCarPlate(e.target.value)} className="h-7 text-sm w-28" placeholder="e.g. ABC1234" />
          : <span>{c.car_plate ?? '—'}</span>}
      </TableCell>
      <TableCell>
        {c.renewal_date ? new Date(c.renewal_date).toLocaleDateString() : '—'}
      </TableCell>
      <TableCell>
        <div className="flex gap-1 flex-wrap">
          {tags.map(t => (
            <Badge key={t} variant="outline" className="text-xs">
              {t}
              {editing && (
                <button onClick={() => removeTag(t)} className="ml-1 text-destructive">×</button>
              )}
            </Badge>
          ))}
          {editing && (
            <div className="flex gap-1 items-center mt-1">
              <Input value={newTag} onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                className="h-6 text-xs w-20" placeholder="tag" />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={addTag}><Plus className="h-3 w-3" /></Button>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          {Object.entries(customFields).map(([k, v]) => (
            <div key={k} className="text-xs flex gap-1 items-center">
              <span className="font-medium">{k}:</span> <span>{v}</span>
              {editing && <button onClick={() => removeField(k)} className="text-destructive ml-1">×</button>}
            </div>
          ))}
          {editing && (
            <div className="flex gap-1 items-center mt-1">
              <Input value={newFieldKey} onChange={e => setNewFieldKey(e.target.value)}
                className="h-6 text-xs w-20" placeholder="key" />
              <Input value={newFieldVal} onChange={e => setNewFieldVal(e.target.value)}
                className="h-6 text-xs w-24" placeholder="value" />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={addField}><Plus className="h-3 w-3" /></Button>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {editing ? (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={save} disabled={update.isPending}>
              <Check className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancel}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)}>
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
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
          <TableHead>Car Plate</TableHead>
          <TableHead>Renewal Date</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Custom Fields</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map(c => <EditableRow key={c.id} c={c} />)}
      </TableBody>
    </Table>
  )
}
