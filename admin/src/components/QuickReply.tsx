'use client'

import { useState, useEffect, useRef } from 'react'
import { useSendReply, useUpdateStatus, useMessages } from '@/hooks/use-conversations'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'

interface Props {
  conversationId: string
  customerId: string
  currentStatus: string
  phone: string
  customerName: string | null
  onOpenPanel: () => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function QuickReply({ conversationId, customerId, currentStatus, phone, customerName, onOpenPanel }: Props) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const { data: messages = [] } = useMessages(conversationId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      <div className="border-b px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-sm">{customerName ?? '(no name)'}</span>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onOpenPanel} title="View customer info">
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">{phone}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3" id="messages-scroll">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'text-left' : 'text-right'}>
            <span
              className={`inline-block rounded-lg px-3 py-2 text-sm max-w-xs ${
                m.role === 'user' ? 'bg-muted' : 'bg-primary text-primary-foreground'
              }`}
            >
              {m.media_url && (
                <img src={m.media_url} alt="customer image" className="max-w-[240px] rounded-md mb-1 block" />
              )}
              {(m.content && m.content !== '[image]') && <span>{m.content}</span>}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(m.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Mode:</span>
          {currentStatus === 'handoff' ? (
            <span className="font-medium text-orange-600">Handoff — AI paused</span>
          ) : currentStatus === 'open' ? (
            <span className="font-medium text-green-600">Open — AI active</span>
          ) : (
            <span className="font-medium">Resolved</span>
          )}
        </div>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a reply…" rows={3} />
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleSend} disabled={sendReply.isPending || !text.trim()}>Send</Button>
          {currentStatus !== 'resolved' && currentStatus !== 'handoff' && (
            <Button variant="outline" onClick={() => updateStatus.mutateAsync('handoff')} disabled={updateStatus.isPending}>
              Pause AI (Handoff)
            </Button>
          )}
          {currentStatus === 'handoff' && (
            <Button variant="outline" onClick={() => updateStatus.mutateAsync('open')} disabled={updateStatus.isPending}>
              Resume AI
            </Button>
          )}
          {currentStatus !== 'resolved' && (
            <Button variant="outline" onClick={handleClose} disabled={updateStatus.isPending}>Resolve</Button>
          )}
        </div>
      </div>
    </div>
  )
}
