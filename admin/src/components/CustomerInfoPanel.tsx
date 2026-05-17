'use client'

import { useState, useEffect } from 'react'
import { useCustomer, useUpdateCustomer } from '@/hooks/use-customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { X } from 'lucide-react'

interface Props {
  customerId: string
  onClose: () => void
}

export function CustomerInfoPanel({ customerId, onClose }: Props) {
  const { data: customer, isLoading } = useCustomer(customerId)
  const update = useUpdateCustomer(customerId)

  const [name, setName] = useState('')
  const [carPlate, setCarPlate] = useState('')
  const [insurer, setInsurer] = useState('')
  const [renewalDate, setRenewalDate] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => {
    if (!customer) return
    setName(customer.name ?? '')
    setCarPlate(customer.car_plate ?? '')
    setInsurer(customer.insurer ?? '')
    setRenewalDate(customer.renewal_date ? customer.renewal_date.slice(0, 10) : '')
    setTagsInput(customer.tags.join(', '))
  }, [customer])

  async function handleSave() {
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    await update.mutateAsync({ name, car_plate: carPlate, insurer, renewal_date: renewalDate || null, tags })
    toast.success('Customer updated')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-sm">Customer Info</span>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isLoading || !customer ? (
        <p className="text-sm text-muted-foreground p-4">Loading…</p>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <p className="text-sm font-medium">{customer.phone}</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="panel-name" className="text-xs">Name</Label>
            <Input id="panel-name" value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="panel-plate" className="text-xs">Car Plate</Label>
            <Input id="panel-plate" value={carPlate} onChange={e => setCarPlate(e.target.value)} className="h-8 text-sm" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="panel-insurer" className="text-xs">Insurer</Label>
            <Input id="panel-insurer" value={insurer} onChange={e => setInsurer(e.target.value)} className="h-8 text-sm" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="panel-renewal" className="text-xs">Renewal Date</Label>
            <Input id="panel-renewal" type="date" value={renewalDate} onChange={e => setRenewalDate(e.target.value)} className="h-8 text-sm" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="panel-tags" className="text-xs">Tags (comma-separated)</Label>
            <Input id="panel-tags" value={tagsInput} onChange={e => setTagsInput(e.target.value)} className="h-8 text-sm" placeholder="vip, renewal, follow-up" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <p className="text-sm capitalize">{customer.status}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Language</Label>
            <p className="text-sm uppercase">{customer.language ?? '—'}</p>
          </div>

          {Object.keys(customer.custom_fields).length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Custom Fields</Label>
              <div className="space-y-1">
                {Object.entries(customer.custom_fields).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-sm">
                    <span className="text-muted-foreground w-28 shrink-0 truncate">{k}</span>
                    <span className="font-medium truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={update.isPending} className="w-full" size="sm">
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )}
    </div>
  )
}
