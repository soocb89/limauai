'use client'

import { Conversation } from '@/hooks/use-conversations'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ConversationList({ conversations, selectedId, onSelect }: Props) {
  if (conversations.length === 0) {
    return <p className="text-muted-foreground text-sm p-4">No conversations.</p>
  }
  return (
    <ul className="divide-y">
      {conversations.map((c) => (
        <li
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={cn(
            'px-4 py-3 cursor-pointer hover:bg-accent transition-colors',
            selectedId === c.id && 'bg-accent'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{c.name ?? c.phone}</span>
            <Badge variant={c.status === 'open' ? 'default' : 'secondary'}>{c.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(c.last_message_at).toLocaleString()}
          </p>
          {c.tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {c.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
