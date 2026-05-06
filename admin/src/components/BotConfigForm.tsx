'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useBotConfig, useUpdateBotConfig } from '@/hooks/use-bot-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const FIELDS = [
  { key: 'tone', label: 'Tone', placeholder: 'e.g. friendly, professional' },
  { key: 'model', label: 'Default Model', placeholder: 'gpt-4o-mini' },
  { key: 'owner_phone', label: 'Owner Phone', placeholder: '601xxxxxxxx' },
  { key: 'handoff_threshold', label: 'Handoff Threshold', placeholder: '0.3' },
  { key: 'max_unknowns', label: 'Max Unknowns Before Handoff', placeholder: '3' },
]

export function BotConfigForm() {
  const { data: config, isLoading } = useBotConfig()
  const updateMutation = useUpdateBotConfig()
  const { register, handleSubmit, reset } = useForm<Record<string, string>>()

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
      {FIELDS.map(({ key, label, placeholder }) => (
        <div key={key}>
          <Label>{label}</Label>
          <Input {...register(key)} placeholder={placeholder} />
        </div>
      ))}
      <Button type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Saving…' : 'Save Settings'}
      </Button>
    </form>
  )
}
