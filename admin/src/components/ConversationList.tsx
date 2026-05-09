'use client'

import { Conversation } from '@/hooks/use-conversations'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Circle, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

interface Props {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function waitingTime(lastMessageAt: string): string {
  const mins = Math.floor((Date.now() - new Date(lastMessageAt).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m waiting`
  return `${Math.floor(mins / 60)}h ${mins % 60}m waiting`
}

/* Shape + color — safe for deuteranopia/protanopia */
function StatusPill({ status }: { status: string }) {
  if (status === 'open') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-400">
        <Circle className="h-2 w-2 fill-current" />
        Open
      </span>
    )
  }
  if (status === 'handoff') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-3 w-3" />
        Handoff
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <CheckCircle2 className="h-3 w-3" />
      Resolved
    </span>
  )
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
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="font-medium text-sm truncate block">{c.name ?? '(no name)'}</span>
              <span className="text-xs text-muted-foreground">{c.phone}</span>
            </div>
            <StatusPill status={c.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {c.status === 'handoff' && c.last_message_at ? (
              <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                <Clock className="h-3 w-3" />
                {waitingTime(c.last_message_at)}
              </span>
            ) : c.last_message_at ? (
              new Date(c.last_message_at).toLocaleString()
            ) : (
              '—'
            )}
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
