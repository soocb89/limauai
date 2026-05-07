'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KBEntry, useAddKB, useUpdateKB } from '@/hooks/use-kb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const schema = z.object({
  title: z.string().min(1, 'Required'),
  content: z.string().min(1, 'Required'),
  category: z.string(),
})
type FormData = z.infer<typeof schema>

interface Props {
  entry?: KBEntry | null
  onDone: () => void
}

export function KBForm({ entry, onDone }: Props) {
  const addMutation = useAddKB()
  const updateMutation = useUpdateKB(entry?.id ?? '')
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', content: '', category: '' },
  })

  useEffect(() => {
    if (entry) reset({ title: entry.title, content: entry.content, category: entry.category ?? '' })
    else reset({ title: '', content: '', category: '' })
  }, [entry, reset])

  async function onSubmit(data: FormData) {
    if (entry) {
      await updateMutation.mutateAsync(data)
      toast.success('Entry updated')
    } else {
      await addMutation.mutateAsync(data)
      toast.success('Entry added')
    }
    onDone()
  }

  const isPending = addMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input {...register('title')} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <div>
        <Label>Category</Label>
        <Input {...register('category')} placeholder="e.g. faq, product, policy" />
      </div>
      <div>
        <Label>Content</Label>
        <Textarea {...register('content')} rows={6} />
        {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : entry ? 'Update' : 'Add'}
      </Button>
    </form>
  )
}
