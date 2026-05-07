'use client'

import { useState } from 'react'
import { useSendReply, useUpdateStatus, useMessages } from '@/hooks/use-conversations'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Props {
  conversationId: string
  currentStatus: string
}

export function QuickReply({ conversationId, currentStatus }: Props) {
  const [text, setText] = useState('')
  const { data: messages = [] } = useMessages(conversationId)
  const sendReply = useSendReply(conversationId)
  const updateStatus = useUpdateStatus(conversationId)

  async function handleSend() {
    if (!text.trim()) return
    await sendReply.mutateAsync(text.trim())
    toast.success('Reply sent')
    setText('')
  }

  async function handleClose() {
    await updateStatus.mutateAsync('resolved')
    toast.success('Conversation resolved')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'text-left' : 'text-right'}>
            <span
              className={`inline-block rounded-lg px-3 py-2 text-sm max-w-xs ${
                m.role === 'user' ? 'bg-muted' : 'bg-primary text-primary-foreground'
              }`}
            >
              {m.content}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(m.created_at).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t p-4 space-y-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a reply…"
          rows={3}
        />
        <div className="flex gap-2">
          <Button onClick={handleSend} disabled={sendReply.isPending || !text.trim()}>
            Send
          </Button>
          {currentStatus !== 'resolved' && (
            <Button variant="outline" onClick={handleClose} disabled={updateStatus.isPending}>
              Resolve
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
