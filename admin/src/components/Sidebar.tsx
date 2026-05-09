'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
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
  LogOut,
  Sun,
  Moon,
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

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="w-56 shrink-0 border-r bg-sidebar flex flex-col h-[100dvh] sticky top-0">
      <div className="px-4 py-5 font-semibold text-base border-b tracking-tight text-sidebar-foreground">
        LimauAI
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-accent text-primary font-semibold border-l-2 border-primary pl-[10px]'
                  : 'text-sidebar-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-2 border-t space-y-0.5">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
