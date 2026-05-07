'use client'

import { useState } from 'react'
import { useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook, Webhook, WebhookField } from '@/hooks/use-webhooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Copy, Trash2, Plus, X, Pencil, Check } from 'lucide-react'

function getWebhookUrl(token: string) {
  const base = typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':3001') : ''
  return `${base}/webhook/w/${token}`
}

function FieldBuilder({ fields, onChange }: { fields: WebhookField[]; onChange: (f: WebhookField[]) => void }) {
  const [key, setKey] = useState('')
  const [label, setLabel] = useState('')

  function add() {
    const k = key.trim().toLowerCase().replace(/\s+/g, '_')
    if (!k) return
    onChange([...fields, { key: k, label: label.trim() || k }])
    setKey(''); setLabel('')
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {fields.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-sm bg-muted px-2 py-1 rounded">
            <code className="text-xs font-mono">{`{{${f.key}}}`}</code>
            <span className="text-muted-foreground">→</span>
            <span>{f.label}</span>
            <button onClick={() => onChange(fields.filter((_, j) => j !== i))} className="ml-auto text-destructive">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={key} onChange={e => setKey(e.target.value)} placeholder="field_key" className="h-7 text-xs w-32" />
        <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label" className="h-7 text-xs flex-1" />
        <Button size="sm" variant="outline" onClick={add} className="h-7">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Built-in fields always available: <code>{'{{phone}} {{name}} {{car_plate}} {{insurer}} {{amount}} {{quotation_url}}'}</code>
      </p>
    </div>
  )
}

function WebhookCard({ wh }: { wh: Webhook }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(wh.name)
  const [description, setDescription] = useState(wh.description ?? '')
  const [fields, setFields] = useState<WebhookField[]>(wh.fields ?? [])
  const [template, setTemplate] = useState(wh.message_template ?? '')
  const updateMutation = useUpdateWebhook(wh.id)
  const deleteMutation = useDeleteWebhook()

  async function save() {
    await updateMutation.mutateAsync({ name, description, fields, message_template: template || undefined })
    toast.success('Saved')
    setEditing(false)
  }

  function cancel() {
    setName(wh.name); setDescription(wh.description ?? '')
    setFields(wh.fields ?? []); setTemplate(wh.message_template ?? '')
    setEditing(false)
  }

  function copyUrl() {
    navigator.clipboard.writeText(getWebhookUrl(wh.token))
    toast.success('URL copied')
  }

  const allFields = ['phone', 'name', 'car_plate', 'insurer', 'amount', 'quotation_url', ...(wh.fields ?? []).map(f => f.key)]
  const examplePayload = Object.fromEntries(allFields.map(k => [k, `<${k}>`]))

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {editing
            ? <Input value={name} onChange={e => setName(e.target.value)} className="h-7 text-sm font-medium w-48 mb-1" />
            : <span className="font-medium">{wh.name}</span>}
          {editing
            ? <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="h-7 text-xs w-full" />
            : wh.description && <span className="text-sm text-muted-foreground ml-2">— {wh.description}</span>}
        </div>
        <div className="flex gap-1 ml-2">
          {editing ? (
            <>
              <Button size="sm" variant="outline" onClick={save} disabled={updateMutation.isPending}><Check className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" onClick={cancel}><X className="h-3 w-3" /></Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={copyUrl}><Copy className="h-3 w-3 mr-1" /> Copy URL</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil className="h-3 w-3" /></Button>
              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(wh.id)}><Trash2 className="h-3 w-3" /></Button>
            </>
          )}
        </div>
      </div>

      <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
        POST {getWebhookUrl(wh.token)}
      </code>

      {editing && (
        <div className="space-y-3 border-t pt-3">
          <div>
            <Label className="text-xs">Custom Fields</Label>
            <FieldBuilder fields={fields} onChange={setFields} />
          </div>
          <div>
            <Label className="text-xs">Message Template</Label>
            <Textarea
              value={template}
              onChange={e => setTemplate(e.target.value)}
              rows={4}
              placeholder={`e.g. Hi {{name}}! Your quote for {{car_plate}} is RM{{amount}}. View: {{quotation_url}}`}
              className="text-sm font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">Use {'{{field_key}}'} to insert values. Leave blank for auto-generated message.</p>
          </div>
        </div>
      )}

      {!editing && (
        <>
          {wh.message_template && (
            <div className="text-xs bg-muted/50 px-2 py-1 rounded">
              <span className="text-muted-foreground">Template:</span> {wh.message_template}
            </div>
          )}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">Show example payload</summary>
            <pre className="mt-1 bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(examplePayload, null, 2)}</pre>
          </details>
        </>
      )}

      <div className="text-xs text-muted-foreground flex gap-3">
        <span>Created: {new Date(wh.created_at).toLocaleDateString()}</span>
        {wh.last_used_at
          ? <span>Last used: {new Date(wh.last_used_at).toLocaleString()}</span>
          : <span>Never used</span>}
      </div>
    </div>
  )
}

export default function WebhooksPage() {
  const { data: webhooks = [] } = useWebhooks()
  const createMutation = useCreateWebhook()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<WebhookField[]>([])
  const [template, setTemplate] = useState('')

  async function handleCreate() {
    if (!name.trim()) { toast.error('Name required'); return }
    await createMutation.mutateAsync({ name: name.trim(), description: description.trim() || undefined, fields, message_template: template || undefined })
    setName(''); setDescription(''); setFields([]); setTemplate('')
    toast.success('Webhook created')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Webhooks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Share webhook URLs with your IT team. They POST data — bot sends a WA message automatically.
        </p>
      </div>

      <div className="border rounded-lg p-4 space-y-3 max-w-lg bg-muted/30">
        <h2 className="font-semibold text-sm">Create Webhook</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Quotation System" className="h-8" />
          </div>
          <div>
            <Label className="text-xs">Description (optional)</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What this webhook does" className="h-8" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Custom Fields (optional)</Label>
          <FieldBuilder fields={fields} onChange={setFields} />
        </div>
        <div>
          <Label className="text-xs">Message Template (optional)</Label>
          <Textarea
            value={template}
            onChange={e => setTemplate(e.target.value)}
            rows={3}
            placeholder={`Hi {{name}}! Your quote for {{car_plate}} is RM{{amount}}. View: {{quotation_url}}`}
            className="text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">Leave blank for auto-generated message.</p>
        </div>
        <Button onClick={handleCreate} disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating…' : 'Create Webhook'}
        </Button>
      </div>

      <div className="space-y-3 max-w-2xl">
        {webhooks.length === 0 && <p className="text-sm text-muted-foreground">No webhooks yet.</p>}
        {webhooks.map(wh => <WebhookCard key={wh.id} wh={wh} />)}
      </div>
    </div>
  )
}
