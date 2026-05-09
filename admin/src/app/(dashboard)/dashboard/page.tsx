'use client'

import { useState } from 'react'
import { useConversations, useConversationCounts } from '@/hooks/use-conversations'
import { ConversationList } from '@/components/ConversationList'
import { QuickReply } from '@/components/QuickReply'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'

export default function DashboardPage() {
  const [status, setStatus] = useState('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const { data: conversations = [], isLoading } = useConversations(status)
  const { data: counts } = useConversationCounts()
  const selected = conversations.find((c) => c.id === selectedId)
  const filtered = conversations.filter(c => !search || (c.name ?? '').toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))

  return (
    <div className="flex h-full gap-4">
      <div className="w-80 shrink-0 border rounded-lg overflow-hidden flex flex-col">
        <div className="p-3 border-b">
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList className="w-full">
              <TabsTrigger value="open" className="flex-1">
                Open{counts?.open ? ` (${counts.open})` : ''}
              </TabsTrigger>
              <TabsTrigger value="handoff" className="flex-1">
                Handoff{counts?.handoff ? ` (${counts.handoff})` : ''}
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex-1">
                Resolved{counts?.resolved ? ` (${counts.resolved})` : ''}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="p-2 border-b">
          <Input
            placeholder="Search name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground p-4">Loading…</p>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        )}
      </div>
      <div className="flex-1 border rounded-lg overflow-hidden">
        {selected ? (
          <QuickReply
            conversationId={selected.id}
            customerId={selected.customer_id}
            currentStatus={selected.status}
            phone={selected.phone}
            customerName={selected.name}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  )
}
