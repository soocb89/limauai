'use client'

import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

type WAStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected'

interface WAState {
  status: WAStatus
  qr_data_url: string | null
}

const STATUS_LABEL: Record<WAStatus, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting…',
  qr_ready: 'Scan QR Code',
  connected: 'Connected',
}

const STATUS_VARIANT: Record<WAStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  disconnected: 'destructive',
  connecting: 'secondary',
  qr_ready: 'outline',
  connected: 'default',
}

export function WAStatusPanel() {
  const [state, setState] = useState<WAState>({ status: 'connecting', qr_data_url: null })
  const [loading, setLoading] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/admin/wa')
      if (res.ok) setState(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetchStatus()
    // Poll every 3s when not connected (waiting for QR scan)
    const interval = setInterval(() => {
      if (state.status !== 'connected') fetchStatus()
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchStatus, state.status])

  async function refresh() {
    setLoading(true)
    await fetchStatus()
    setLoading(false)
  }

  return (
    <div className="border rounded-lg p-4 space-y-4 max-w-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">WhatsApp Connection</h2>
          <Badge variant={STATUS_VARIANT[state.status]} className="mt-1">
            {STATUS_LABEL[state.status]}
          </Badge>
        </div>
        <Button size="icon" variant="ghost" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {state.status === 'qr_ready' && state.qr_data_url && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Open WhatsApp → Linked Devices → Link a device → scan below:
          </p>
          <div className="flex justify-center bg-white p-3 rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.qr_data_url}
              alt="WhatsApp QR Code"
              width={280}
              height={280}
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">QR refreshes automatically every 3 seconds</p>
        </div>
      )}

      {state.status === 'connected' && (
        <p className="text-sm text-green-600">WhatsApp is connected and receiving messages.</p>
      )}

      {state.status === 'disconnected' && (
        <p className="text-sm text-destructive">
          Disconnected. Restart the backend to reconnect. If this persists, delete the session folder and re-scan.
        </p>
      )}
    </div>
  )
}
