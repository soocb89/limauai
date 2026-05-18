'use client'

import { useAnalytics } from '@/hooks/use-analytics'
import { MessageSquare, UserCheck, MessageCircle } from 'lucide-react'

interface StatCardProps {
  label: string
  icon: React.ReactNode
  total: number
  week: number
  today: number
  color: string
}

function StatCard({ label, icon, total, week, today, color }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className={`rounded-lg p-2 ${color}`}>{icon}</div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-bold">{total.toLocaleString()}</p>
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span><span className="font-semibold text-foreground">{today}</span> today</span>
        <span><span className="font-semibold text-foreground">{week}</span> this week</span>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalytics()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="AI Messages Sent"
          icon={<MessageSquare className="h-4 w-4 text-blue-600" />}
          color="bg-blue-100 dark:bg-blue-950"
          total={data.ai_messages.total}
          week={data.ai_messages.week}
          today={data.ai_messages.today}
        />
        <StatCard
          label="Handoffs to Human"
          icon={<UserCheck className="h-4 w-4 text-orange-600" />}
          color="bg-orange-100 dark:bg-orange-950"
          total={data.handoffs.total}
          week={data.handoffs.week}
          today={data.handoffs.today}
        />
        <StatCard
          label="Total Conversations"
          icon={<MessageCircle className="h-4 w-4 text-green-600" />}
          color="bg-green-100 dark:bg-green-950"
          total={data.conversations.total}
          week={data.conversations.week}
          today={data.conversations.today}
        />
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-2">
        <p className="text-sm font-medium">Handoff Rate</p>
        {data.conversations.total > 0 ? (
          <>
            <p className="text-2xl font-bold">
              {((data.handoffs.total / data.conversations.total) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {data.handoffs.total} handoffs out of {data.conversations.total} total conversations
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">No conversations yet</p>
        )}
      </div>
    </div>
  )
}
