'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSendBroadcast, useBroadcastStats, usePromotions } from '@/hooks/use-promotions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const schema = z.object({
  message: z.string().min(1, 'Required'),
})
type FormData = z.infer<typeof schema>

export function BroadcastForm() {
  const [promotionId, setPromotionId] = useState<number | null>(null)
  const { data: promotions = [] } = usePromotions()
  const { data: stats } = useBroadcastStats(promotionId)
  const sendMutation = useSendBroadcast()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { message: '' },
  })

  async function onSubmit(data: FormData) {
    if (!promotionId) { toast.error('Select a promotion'); return }
    const result = await sendMutation.mutateAsync({ promotionId, message: data.message })
    toast.success(`Queued ${result.queued} messages`)
    reset()
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <Label>Promotion</Label>
        <Select onValueChange={(v) => setPromotionId(Number(v))}>
          <SelectTrigger>
            <SelectValue placeholder="Select promotion…" />
          </SelectTrigger>
          <SelectContent>
            {promotions.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {stats && (
        <div className="text-sm text-muted-foreground">
          Audience: {stats.total} | Sent: {stats.sent} | Pending: {stats.pending} | Failed: {stats.failed}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Message</Label>
          <Textarea {...register('message')} rows={5} placeholder="Broadcast message…" />
          {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
        </div>
        <Button type="submit" disabled={sendMutation.isPending || !promotionId}>
          {sendMutation.isPending ? 'Sending…' : 'Send Broadcast'}
        </Button>
      </form>
    </div>
  )
}
