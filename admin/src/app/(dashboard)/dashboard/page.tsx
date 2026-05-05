'use client'

import { useState } from 'react'
import { useConversations } from '@/hooks/use-conversations'
import { ConversationList } from '@/components/ConversationList'
import { QuickReply } from '@/components/QuickReply'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DashboardPage() {
  const [status, setStatus] = useState('open')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { data: conversations = [], isLoading } = useConversations(status)
  const selected = conversations.find((c) => c.id === selectedId)

  return (
    <div className="flex h-full gap-4">
      <div className="w-80 shrink-0 border rounded-lg overflow-hidden flex flex-col">
        <div className="p-3 border-b">
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList className="w-full">
              <TabsTrigger value="open" className="flex-1">Open</TabsTrigger>
              <TabsTrigger value="held" className="flex-1">Held</TabsTrigger>
              <TabsTrigger value="closed" className="flex-1">Closed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground p-4">Loading…</p>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        )}
      </div>
      <div className="flex-1 border rounded-lg overflow-hidden">
        {selected ? (
          <QuickReply conversationId={selected.id} currentStatus={selected.status} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  )
}
