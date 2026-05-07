'use client'

import { useState } from 'react'
import { useWebhooks, useCreateWebhook, useDeleteWebhook } from '@/hooks/use-webhooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Copy, Trash2 } from 'lucide-react'

function getWebhookUrl(token: string) {
  const base = typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':3001') : ''
  return `${base}/webhook/w/${token}`
}

export default function WebhooksPage() {
  const { data: webhooks = [] } = useWebhooks()
  const createMutation = useCreateWebhook()
  const deleteMutation = useDeleteWebhook()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  async function handleCreate() {
    if (!name.trim()) { toast.error('Name required'); return }
    await createMutation.mutateAsync({ name: name.trim(), description: description.trim() || undefined })
    setName(''); setDescription('')
    toast.success('Webhook created')
  }

  function copyUrl(token: string) {
    navigator.clipboard.writeText(getWebhookUrl(token))
    toast.success('URL copied')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Webhooks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Share webhook URLs with your IT team. They POST customer + quotation data — bot sends WA message automatically.
        </p>
      </div>

      <div className="border rounded-lg p-4 space-y-3 max-w-md bg-muted/30">
        <h2 className="font-semibold text-sm">Create Webhook</h2>
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Quotation System" />
        </div>
        <div>
          <Label>Description (optional)</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What this webhook is for" />
        </div>
        <Button onClick={handleCreate} disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating…' : 'Create'}
        </Button>
      </div>

      <div className="space-y-3">
        {webhooks.length === 0 && (
          <p className="text-sm text-muted-foreground">No webhooks yet.</p>
        )}
        {webhooks.map(wh => (
          <div key={wh.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{wh.name}</span>
                {wh.description && <span className="text-sm text-muted-foreground ml-2">— {wh.description}</span>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copyUrl(wh.token)}>
                  <Copy className="h-3 w-3 mr-1" /> Copy URL
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(wh.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
              POST {getWebhookUrl(wh.token)}
            </code>
            <div className="text-xs text-muted-foreground">
              <span>Created: {new Date(wh.created_at).toLocaleDateString()}</span>
              {wh.last_used_at && <span className="ml-3">Last used: {new Date(wh.last_used_at).toLocaleString()}</span>}
            </div>
            <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
              <span className="font-medium">Payload:</span>{' '}
              <code>{'{ phone, name?, car_plate?, amount?, insurer?, quotation_url? }'}</code>
            </div>
            {wh.last_used_at === null && <Badge variant="secondary" className="text-xs">Never used</Badge>}
          </div>
        ))}
      </div>
    </div>
  )
}
