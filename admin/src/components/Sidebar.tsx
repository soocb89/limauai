'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  Users,
  BookOpen,
  Megaphone,
  Settings,
  Clock,
  Zap,
  Webhook,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Conversations', icon: MessageSquare },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { href: '/promotions', label: 'Promotions', icon: Megaphone },
  { href: '/broadcast', label: 'Broadcast', icon: Zap },
  { href: '/scheduler', label: 'Scheduler', icon: Clock },
  { href: '/webhooks', label: 'Webhooks', icon: Webhook },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 shrink-0 border-r bg-muted/40 flex flex-col h-screen sticky top-0">
      <div className="px-4 py-5 font-bold text-lg border-b">LimauAI</div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
              pathname.startsWith(href) && 'bg-accent text-accent-foreground font-medium'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
