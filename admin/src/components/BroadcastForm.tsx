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
  const [promotionId, setPromotionId] = useState<string | null>(null)
  const { data: promotions = [] } = usePromotions()
  const { data: stats } = useBroadcastStats(promotionId)
  const sendMutation = useSendBroadcast()

  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { message: '' },
  })

  async function onSubmit(data: FormData) {
    if (!promotionId) { toast.error('Select a promotion'); return }
    setPendingMessage(data.message)
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <Label>Promotion</Label>
        <Select onValueChange={(v: string | null) => setPromotionId(v)}>
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
        {pendingMessage ? (
          <div className="space-y-3 rounded-md border border-yellow-300 bg-yellow-50 p-3">
            <p className="text-sm font-medium">Confirm broadcast to {stats?.total ?? '…'} recipients</p>
            <p className="text-sm text-muted-foreground break-words">{pendingMessage.slice(0, 100)}{pendingMessage.length > 100 ? '…' : ''}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                disabled={sendMutation.isPending}
                onClick={async () => {
                  const result = await sendMutation.mutateAsync({ promotionId: promotionId!, message: pendingMessage })
                  toast.success(`Queued ${result.queued} messages`)
                  setPendingMessage(null)
                  reset()
                }}
              >
                {sendMutation.isPending ? 'Sending…' : 'Confirm Send'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setPendingMessage(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button type="submit" disabled={sendMutation.isPending || !promotionId}>
            Send Broadcast
          </Button>
        )}
      </form>
    </div>
  )
}
