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
    defaultValues: { title: entry?.title ?? '', content: entry?.content ?? '', category: entry?.category ?? '' },
  })

  useEffect(() => {
    if (entry) reset({ title: entry.title, content: entry.content, category: entry.category ?? '' })
    else reset({ title: '', content: '', category: '' })
  }, [entry?.id, reset])

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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Original — read-only reference when editing */}
      {entry && (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current (read-only)</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Title</p>
            <p className="text-sm font-medium break-words">{entry.title}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Category</p>
            <p className="text-sm">{entry.category ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Content</p>
            <pre className="text-sm whitespace-pre-wrap break-words font-sans leading-relaxed">{entry.content}</pre>
          </div>
        </div>
      )}

      {/* Edit form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {entry ? 'Edit' : 'New Entry'}
        </p>
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
          <Textarea {...register('content')} rows={entry ? 14 : 8} className="font-mono text-sm" />
          {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : entry ? 'Update' : 'Add'}
          </Button>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
