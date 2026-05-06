'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAddPromotion } from '@/hooks/use-promotions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string(),
})
type FormData = z.infer<typeof schema>

interface Props {
  onDone: () => void
}

export function PromotionForm({ onDone }: Props) {
  const addMutation = useAddPromotion()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  })

  async function onSubmit(data: FormData) {
    await addMutation.mutateAsync({ ...data, active: true })
    toast.success('Promotion created')
    reset()
    onDone()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div>
        <Label>Description</Label>
        <Textarea {...register('description')} rows={3} />
      </div>
      <Button type="submit" disabled={addMutation.isPending}>
        {addMutation.isPending ? 'Creating…' : 'Create Promotion'}
      </Button>
    </form>
  )
}
