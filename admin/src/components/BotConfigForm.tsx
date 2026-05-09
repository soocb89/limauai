'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useBotConfig, useUpdateBotConfig } from '@/hooks/use-bot-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const TEXT_FIELDS = [
  { key: 'persona_name', label: 'Bot Name', placeholder: 'Aina' },
  { key: 'owner_phone', label: 'Owner Phone', placeholder: '601xxxxxxxx' },
]

export function BotConfigForm() {
  const { data: config, isLoading } = useBotConfig()
  const updateMutation = useUpdateBotConfig()
  const { register, handleSubmit, reset, watch, setValue } = useForm<Record<string, string>>()

  useEffect(() => {
    if (config) reset(config)
  }, [config, reset])

  async function onSubmit(data: Record<string, string>) {
    await updateMutation.mutateAsync(data)
    toast.success('Settings saved')
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      {TEXT_FIELDS.map(({ key, label, placeholder }) => (
        <div key={key}>
          <Label>{label}</Label>
          <Input {...register(key)} placeholder={placeholder} />
        </div>
      ))}
      <div>
        <Label>Tone</Label>
        <Select value={watch('tone') ?? 'friendly'} onValueChange={(v) => setValue('tone', v ?? '')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="friendly">Friendly</SelectItem>
            <SelectItem value="formal">Formal / Professional</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Default Model</Label>
        <Select value={watch('model') ?? 'gpt-4o-mini'} onValueChange={(v) => setValue('model', v ?? '')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o-mini">Faster &amp; cheaper (gpt-4o-mini)</SelectItem>
            <SelectItem value="gpt-4o">More accurate (gpt-4o)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Handoff Sensitivity</Label>
        <p className="text-xs text-muted-foreground mb-1">Higher = escalate to human more often</p>
        <Select value={watch('handoff_threshold') ?? '0.6'} onValueChange={(v) => setValue('handoff_threshold', v ?? '')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0.4">Low — only escalate when very unsure</SelectItem>
            <SelectItem value="0.6">Medium (recommended)</SelectItem>
            <SelectItem value="0.8">High — escalate more often</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Max Unclear Messages Before Handoff</Label>
        <Select value={watch('max_unknowns') ?? '3'} onValueChange={(v) => setValue('max_unknowns', v ?? '')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 messages</SelectItem>
            <SelectItem value="3">3 messages (recommended)</SelectItem>
            <SelectItem value="5">5 messages</SelectItem>
            <SelectItem value="10">10 messages</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Custom Instructions</Label>
        <p className="text-xs text-muted-foreground mb-1">
          Extra rules appended to every system prompt. E.g. &quot;Never discuss competitors.&quot;
        </p>
        <Textarea
          {...register('custom_instructions')}
          rows={4}
          placeholder="e.g. Always recommend contacting our team for complex queries."
        />
      </div>
      <Button type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Saving…' : 'Save Settings'}
      </Button>
    </form>
  )
}
