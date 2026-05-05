# LimauAI Admin UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the LimauAI Next.js admin dashboard — web UI for managing conversations, customers, knowledge base, promotions, broadcasts, scheduler, bot settings, and corrections.

**Architecture:** Next.js 14 App Router. All data fetched from the backend REST API (`/api/*`). API key stored in env var, passed via `x-api-key` header. No auth UI needed — single-user dashboard protected by API key. Exposed via Cloudflare Tunnel at `admin.limauais.my`.

**Prerequisite:** Backend plan (`2026-05-05-limauai-backend.md`) must be complete and running before testing this UI.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, React Query (TanStack Query v5), React Hook Form, date-fns, Vitest + Testing Library

---

## File Map

```
admin/
  package.json
  tsconfig.json
  next.config.mjs
  tailwind.config.ts
  components.json                     shadcn/ui config
  .env.local.example
  src/
    app/
      layout.tsx                      root layout — sidebar + topbar
      page.tsx                        redirect to /dashboard
      dashboard/
        page.tsx                      live conversations, handoff alerts, quick reply
      customers/
        page.tsx                      customer list + search + filters + Excel import
        [id]/
          page.tsx                    customer detail — info, quotations, payments, history
      knowledge-base/
        page.tsx                      KB entries list + gap analysis tab
      promotions/
        page.tsx                      promotions list
        [id]/
          page.tsx                    promotion detail + tag customers
      broadcast/
        page.tsx                      create + manage broadcasts
      scheduler/
        page.tsx                      upcoming follow-up jobs
      settings/
        page.tsx                      bot config — tone, persona, handoff settings
      corrections/
        page.tsx                      review bad replies, add corrections
    components/
      ui/                             shadcn/ui components (auto-generated)
      layout/
        Sidebar.tsx
        Topbar.tsx
      conversations/
        ConversationList.tsx
        ConversationDetail.tsx
        QuickReply.tsx
      customers/
        CustomerTable.tsx
        CustomerForm.tsx
        ExcelImport.tsx
      knowledge-base/
        KBTable.tsx
        KBForm.tsx
        DocumentUpload.tsx
        GapAnalysis.tsx
      promotions/
        PromotionForm.tsx
        TagCustomersModal.tsx
      broadcast/
        BroadcastForm.tsx
        BroadcastStats.tsx
      settings/
        BotConfigForm.tsx
    lib/
      api.ts                          typed fetch wrapper, sets x-api-key header
      query-client.ts                 React Query client config
    hooks/
      use-conversations.ts
      use-customers.ts
      use-kb.ts
      use-bot-config.ts
  tests/
    components/
      ConversationList.test.tsx
      CustomerTable.test.tsx
      GapAnalysis.test.tsx
      BotConfigForm.test.tsx
```

---

## Task 1: Next.js Project Setup

**Files:**
- Create: `admin/package.json` (via create-next-app)
- Create: `admin/.env.local.example`
- Create: `admin/src/lib/api.ts`
- Create: `admin/src/lib/query-client.ts`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd L:\Project\CSProject
npx create-next-app@14 admin --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd admin
```

Move src: Next.js may or may not create `src/`. If not, create `src/app/` manually:
```bash
mkdir -p src/app src/components/ui src/lib src/hooks
```

- [ ] **Step 2: Install dependencies**

```bash
cd admin
npm install @tanstack/react-query react-hook-form @hookform/resolvers zod date-fns
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
npx shadcn@latest init
```

When shadcn prompts:
- Style: Default
- Base color: Slate
- CSS variables: Yes

Install shadcn components used in this project:
```bash
npx shadcn@latest add button input label card table badge dialog sheet tabs select textarea toast
```

- [ ] **Step 3: Create .env.local.example**

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_API_KEY=changeme
```

Copy to `.env.local` with real values.

- [ ] **Step 4: Create src/lib/api.ts**

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? ''

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API ${res.status}: ${err}`)
  }
  return res.json()
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: formData,
      headers: { 'x-api-key': API_KEY },
    }),
}
```

- [ ] **Step 5: Create src/lib/query-client.ts**

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})
```

- [ ] **Step 6: Update src/app/layout.tsx with React Query provider**

```typescript
'use client'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { Sidebar } from '@/components/layout/Sidebar'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
              {children}
            </main>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Create vitest.config.ts in admin/**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 8: Create tests/setup.ts**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 9: Commit**

```bash
git add admin/
git commit -m "feat: Next.js admin scaffold — TailwindCSS, shadcn/ui, React Query, Vitest"
```

---

## Task 2: Layout — Sidebar + Topbar

**Files:**
- Create: `admin/src/components/layout/Sidebar.tsx`
- Create: `admin/src/components/layout/Topbar.tsx`
- Create: `admin/src/app/page.tsx`

- [ ] **Step 1: Create Sidebar.tsx**

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, BookOpen, Megaphone,
  Radio, CalendarClock, Settings, MessageSquareDiff
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { href: '/promotions', label: 'Promotions', icon: Megaphone },
  { href: '/broadcast', label: 'Broadcast', icon: Radio },
  { href: '/scheduler', label: 'Scheduler', icon: CalendarClock },
  { href: '/settings', label: 'Bot Settings', icon: Settings },
  { href: '/corrections', label: 'Corrections', icon: MessageSquareDiff },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 bg-white border-r flex flex-col shrink-0">
      <div className="p-4 border-b">
        <span className="font-bold text-lg text-green-600">LimauAI</span>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-green-50 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Create src/app/page.tsx**

```typescript
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/dashboard')
}
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/components/layout/ admin/src/app/page.tsx
git commit -m "feat: admin layout — sidebar nav with 8 sections"
```

---

## Task 3: Dashboard Page

**Files:**
- Create: `admin/src/hooks/use-conversations.ts`
- Create: `admin/src/components/conversations/ConversationList.tsx`
- Create: `admin/src/components/conversations/QuickReply.tsx`
- Create: `admin/src/app/dashboard/page.tsx`
- Create: `admin/tests/components/ConversationList.test.tsx`

- [ ] **Step 1: Write failing test**

`admin/tests/components/ConversationList.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConversationList } from '@/components/conversations/ConversationList'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({
    data: [
      { id: 'c1', phone: '60123456789', name: 'Ali', status: 'handoff', tags: [], updated_at: new Date().toISOString() }
    ],
    isLoading: false,
  })
}))

describe('ConversationList', () => {
  it('renders conversation with handoff badge', () => {
    render(<ConversationList status="handoff" onSelect={vi.fn()} />)
    expect(screen.getByText('Ali')).toBeInTheDocument()
    expect(screen.getByText('handoff')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    const { useQuery } = await import('@tanstack/react-query')
    vi.mocked(useQuery).mockReturnValueOnce({ data: undefined, isLoading: true } as any)
    render(<ConversationList status="open" onSelect={vi.fn()} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd admin && npx vitest run tests/components/ConversationList.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Create src/hooks/use-conversations.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Conversation {
  id: string
  phone: string
  name: string | null
  status: 'open' | 'handoff' | 'resolved'
  tags: string[]
  message_count: number
  updated_at: string
}

export interface Message {
  id: string
  role: 'user' | 'bot' | 'system'
  content: string
  intent: string | null
  language: string | null
  confidence: number | null
  created_at: string
}

export function useConversations(status?: string) {
  return useQuery({
    queryKey: ['conversations', status],
    queryFn: () => api.get<Conversation[]>(`/conversations${status ? `?status=${status}` : ''}`),
    refetchInterval: 10_000,
  })
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => api.get<Message[]>(`/conversations/${conversationId}/messages`),
    refetchInterval: 5_000,
  })
}

export function useReply(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (text: string) =>
      api.post(`/conversations/${conversationId}/reply`, { text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] })
    },
  })
}

export function useUpdateConversationStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/conversations/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
```

- [ ] **Step 4: Create ConversationList.tsx**

```typescript
'use client'
import { Badge } from '@/components/ui/badge'
import { useConversations, type Conversation } from '@/hooks/use-conversations'
import { formatDistanceToNow } from 'date-fns'

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-700',
  handoff: 'bg-red-100 text-red-700',
  resolved: 'bg-gray-100 text-gray-600',
}

interface Props {
  status?: string
  onSelect: (conv: Conversation) => void
}

export function ConversationList({ status, onSelect }: Props) {
  const { data, isLoading } = useConversations(status)

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>
  if (!data?.length) return <p className="text-sm text-gray-400">No conversations.</p>

  return (
    <div className="space-y-1">
      {data.map(conv => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv)}
          className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 border"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{conv.name ?? conv.phone}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[conv.status]}`}>
              {conv.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
          </p>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Create QuickReply.tsx**

```typescript
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useReply, useMessages } from '@/hooks/use-conversations'
import { formatDistanceToNow } from 'date-fns'

export function ConversationDetail({ conversationId }: { conversationId: string }) {
  const { data: messages } = useMessages(conversationId)
  const reply = useReply(conversationId)
  const [text, setText] = useState('')

  const send = () => {
    if (!text.trim()) return
    reply.mutate(text)
    setText('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {messages?.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
              msg.role === 'user' ? 'bg-gray-100' : 'bg-green-100'
            }`}>
              <p>{msg.content}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                {msg.intent && ` · ${msg.intent}`}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-3 flex gap-2">
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type reply..."
          className="flex-1 resize-none"
          rows={2}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        />
        <Button onClick={send} disabled={reply.isPending}>Send</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create dashboard page**

`admin/src/app/dashboard/page.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { ConversationList } from '@/components/conversations/ConversationList'
import { ConversationDetail } from '@/components/conversations/QuickReply'
import { useConversations, useUpdateConversationStatus, type Conversation } from '@/hooks/use-conversations'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DashboardPage() {
  const [selected, setSelected] = useState<Conversation | null>(null)
  const updateStatus = useUpdateConversationStatus()
  const { data: handoffs } = useConversations('handoff')

  return (
    <div className="h-full flex gap-4">
      <div className="w-72 bg-white rounded-lg border flex flex-col">
        {handoffs && handoffs.length > 0 && (
          <div className="p-3 bg-red-50 border-b border-red-100">
            <p className="text-sm font-medium text-red-700">
              ⚠️ {handoffs.length} handoff{handoffs.length > 1 ? 's' : ''} need attention
            </p>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-2">
          <Tabs defaultValue="handoff">
            <TabsList className="w-full mb-2">
              <TabsTrigger value="handoff" className="flex-1">Handoff</TabsTrigger>
              <TabsTrigger value="open" className="flex-1">Open</TabsTrigger>
              <TabsTrigger value="resolved" className="flex-1">Resolved</TabsTrigger>
            </TabsList>
            <TabsContent value="handoff">
              <ConversationList status="handoff" onSelect={setSelected} />
            </TabsContent>
            <TabsContent value="open">
              <ConversationList status="open" onSelect={setSelected} />
            </TabsContent>
            <TabsContent value="resolved">
              <ConversationList status="resolved" onSelect={setSelected} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg border flex flex-col">
        {selected ? (
          <>
            <div className="p-3 border-b flex items-center justify-between">
              <div>
                <p className="font-medium">{selected.name ?? selected.phone}</p>
                <p className="text-xs text-gray-500">{selected.phone}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateStatus.mutate({ id: selected.id, status: 'open' })}
                >
                  Mark Open
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateStatus.mutate({ id: selected.id, status: 'resolved' })}
                >
                  Resolve
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConversationDetail conversationId={selected.id} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Run test to verify it passes**

```bash
cd admin && npx vitest run tests/components/ConversationList.test.tsx
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add admin/src/app/dashboard/ admin/src/hooks/use-conversations.ts admin/src/components/conversations/
git commit -m "feat: dashboard — live conversations, handoff alerts, quick reply"
```

---

## Task 4: Customers Page

**Files:**
- Create: `admin/src/hooks/use-customers.ts`
- Create: `admin/src/components/customers/CustomerTable.tsx`
- Create: `admin/src/components/customers/ExcelImport.tsx`
- Create: `admin/src/app/customers/page.tsx`
- Create: `admin/tests/components/CustomerTable.test.tsx`

- [ ] **Step 1: Write failing test**

`admin/tests/components/CustomerTable.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({
    data: [{ id: 'c1', phone: '60123456789', name: 'Ali Bin Ahmad', language: 'bm', insurer: 'Etiqa', renewal_date: '2026-08-01', consent: true }],
    isLoading: false,
  }),
  useMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
}))

import { CustomerTable } from '@/components/customers/CustomerTable'

describe('CustomerTable', () => {
  it('renders customer rows', () => {
    render(<CustomerTable />)
    expect(screen.getByText('Ali Bin Ahmad')).toBeInTheDocument()
    expect(screen.getByText('60123456789')).toBeInTheDocument()
    expect(screen.getByText('Etiqa')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd admin && npx vitest run tests/components/CustomerTable.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Create src/hooks/use-customers.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Customer {
  id: string
  phone: string
  name: string | null
  email: string | null
  language: string | null
  renewal_date: string | null
  car_plate: string | null
  insurer: string | null
  consent: boolean
  source: string
  created_at: string
}

export function useCustomers(filters?: Record<string, string>) {
  const params = new URLSearchParams(filters).toString()
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: () => api.get<Customer[]>(`/customers${params ? `?${params}` : ''}`),
  })
}

export function useImportCustomers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.upload<{ imported: number; errors: number; total: number }>('/customers/import', form)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}
```

- [ ] **Step 4: Create CustomerTable.tsx**

```typescript
'use client'
import { useState } from 'react'
import { useCustomers } from '@/hooks/use-customers'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

const LANGUAGE_LABELS: Record<string, string> = { bm: 'BM', zh: '中文', ta: 'தமிழ்', en: 'EN' }

export function CustomerTable() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useCustomers(search ? { search } : undefined)

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search name or phone..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />
      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Name', 'Phone', 'Language', 'Insurer', 'Renewal Date', 'Consent'].map(h => (
                <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map(c => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{c.name ?? '—'}</td>
                <td className="px-4 py-2 font-mono">{c.phone}</td>
                <td className="px-4 py-2">{LANGUAGE_LABELS[c.language ?? ''] ?? c.language ?? '—'}</td>
                <td className="px-4 py-2">{c.insurer ?? '—'}</td>
                <td className="px-4 py-2">
                  {c.renewal_date ? format(new Date(c.renewal_date), 'dd MMM yyyy') : '—'}
                </td>
                <td className="px-4 py-2">
                  <Badge variant={c.consent ? 'default' : 'outline'}>
                    {c.consent ? 'Yes' : 'No'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create ExcelImport.tsx**

```typescript
'use client'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useImportCustomers } from '@/hooks/use-customers'
import { Upload } from 'lucide-react'

export function ExcelImport() {
  const fileRef = useRef<HTMLInputElement>(null)
  const importMutation = useImportCustomers()

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    importMutation.mutate(file)
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
      <Button
        variant="outline"
        onClick={() => fileRef.current?.click()}
        disabled={importMutation.isPending}
      >
        <Upload size={16} className="mr-2" />
        {importMutation.isPending ? 'Importing...' : 'Import Excel'}
      </Button>
      {importMutation.isSuccess && (
        <p className="text-sm text-green-600 mt-1">
          Imported {importMutation.data.imported} / {importMutation.data.total} rows
          {importMutation.data.errors > 0 && ` (${importMutation.data.errors} errors)`}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Create customers page**

`admin/src/app/customers/page.tsx`:
```typescript
import { CustomerTable } from '@/components/customers/CustomerTable'
import { ExcelImport } from '@/components/customers/ExcelImport'

export default function CustomersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Customers</h1>
        <ExcelImport />
      </div>
      <CustomerTable />
    </div>
  )
}
```

- [ ] **Step 7: Run test to verify it passes**

```bash
cd admin && npx vitest run tests/components/CustomerTable.test.tsx
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add admin/src/app/customers/ admin/src/hooks/use-customers.ts admin/src/components/customers/
git commit -m "feat: customers page — list, search, Excel import"
```

---

## Task 5: Knowledge Base Page + Gap Analysis

**Files:**
- Create: `admin/src/hooks/use-kb.ts`
- Create: `admin/src/components/knowledge-base/KBTable.tsx`
- Create: `admin/src/components/knowledge-base/KBForm.tsx`
- Create: `admin/src/components/knowledge-base/DocumentUpload.tsx`
- Create: `admin/src/components/knowledge-base/GapAnalysis.tsx`
- Create: `admin/src/app/knowledge-base/page.tsx`
- Create: `admin/tests/components/GapAnalysis.test.tsx`

- [ ] **Step 1: Write failing test**

`admin/tests/components/GapAnalysis.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({
    data: [{ intent: 'general_faq', avg_confidence: '0.35', count: '8' }],
    isLoading: false,
  })
}))

import { GapAnalysis } from '@/components/knowledge-base/GapAnalysis'

describe('GapAnalysis', () => {
  it('renders gap items with intent and confidence', () => {
    render(<GapAnalysis />)
    expect(screen.getByText('general_faq')).toBeInTheDocument()
    expect(screen.getByText(/0.35/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd admin && npx vitest run tests/components/GapAnalysis.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Create src/hooks/use-kb.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface KBEntry {
  id: string
  title: string
  content: string
  category: string | null
  created_at: string
}

export interface GapItem {
  intent: string
  avg_confidence: string
  count: string
}

export function useKB() {
  return useQuery({
    queryKey: ['kb'],
    queryFn: () => api.get<KBEntry[]>('/kb'),
  })
}

export function useGaps() {
  return useQuery({
    queryKey: ['kb-gaps'],
    queryFn: () => api.get<GapItem[]>('/kb/gaps'),
    refetchInterval: 60_000,
  })
}

export function useCreateKB() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title: string; content: string; category?: string }) =>
      api.post('/kb', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kb'] }),
  })
}

export function useDeleteKB() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/kb/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kb'] }),
  })
}
```

- [ ] **Step 4: Create GapAnalysis.tsx**

```typescript
'use client'
import { useGaps } from '@/hooks/use-kb'

export function GapAnalysis() {
  const { data, isLoading } = useGaps()

  if (isLoading) return <p className="text-sm text-gray-400">Loading...</p>
  if (!data?.length) return <p className="text-sm text-green-600">No gaps detected.</p>

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500">
        Intents where bot had low confidence — add KB content to improve these.
      </p>
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-amber-50 border-b">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Intent</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Avg Confidence</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Occurrences</th>
            </tr>
          </thead>
          <tbody>
            {data.map(gap => (
              <tr key={gap.intent} className="border-b">
                <td className="px-4 py-2 font-mono">{gap.intent}</td>
                <td className="px-4 py-2 text-amber-600">
                  {(parseFloat(gap.avg_confidence) * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-2">{gap.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create KBForm.tsx**

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCreateKB } from '@/hooks/use-kb'

interface FormData { title: string; content: string; category: string }

export function KBForm({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit } = useForm<FormData>()
  const create = useCreateKB()

  const onSubmit = (data: FormData) => {
    create.mutate(data, { onSuccess: onClose })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input {...register('title', { required: true })} placeholder="FAQ title" />
      </div>
      <div>
        <Label>Content</Label>
        <Textarea {...register('content', { required: true })} rows={6} placeholder="FAQ content..." />
      </div>
      <div>
        <Label>Category (optional)</Label>
        <Input {...register('category')} placeholder="e.g. insurance, roadtax" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending}>Save</Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 6: Create DocumentUpload.tsx**

```typescript
'use client'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { FileUp } from 'lucide-react'

export function DocumentUpload() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [category, setCategory] = useState('')
  const qc = useQueryClient()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('Uploading...')
    const form = new FormData()
    form.append('file', file)
    form.append('title', file.name.replace(/\.[^.]+$/, ''))
    if (category) form.append('category', category)
    try {
      const result = await api.upload<{ chunks: number }>('/kb/upload', form)
      setStatus(`Done — ${result.chunks} chunks added`)
      qc.invalidateQueries({ queryKey: ['kb'] })
    } catch (err) {
      setStatus('Upload failed')
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div>
        <Input placeholder="Category (optional)" value={category} onChange={e => setCategory(e.target.value)} className="w-40" />
      </div>
      <input ref={fileRef} type="file" accept=".pdf,.docx" onChange={handleFile} className="hidden" />
      <Button variant="outline" onClick={() => fileRef.current?.click()}>
        <FileUp size={16} className="mr-2" />
        Upload PDF/DOCX
      </Button>
      {status && <p className="text-sm text-gray-600">{status}</p>}
    </div>
  )
}
```

- [ ] **Step 7: Create knowledge-base page**

`admin/src/app/knowledge-base/page.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { KBForm } from '@/components/knowledge-base/KBForm'
import { GapAnalysis } from '@/components/knowledge-base/GapAnalysis'
import { DocumentUpload } from '@/components/knowledge-base/DocumentUpload'
import { useKB, useDeleteKB } from '@/hooks/use-kb'
import { Plus, Trash2 } from 'lucide-react'

export default function KBPage() {
  const { data } = useKB()
  const deleteKB = useDeleteKB()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Knowledge Base</h1>
        <div className="flex gap-2">
          <DocumentUpload />
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} className="mr-1" /> Add FAQ
          </Button>
        </div>
      </div>

      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          <div className="space-y-2 mt-2">
            {data?.map(entry => (
              <div key={entry.id} className="border rounded-md p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{entry.title}</p>
                    {entry.category && <span className="text-xs text-gray-400">{entry.category}</span>}
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{entry.content.slice(0, 200)}{entry.content.length > 200 ? '...' : ''}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteKB.mutate(entry.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gaps">
          <div className="mt-2">
            <GapAnalysis />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add FAQ Entry</DialogTitle></DialogHeader>
          <KBForm onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

```bash
cd admin && npx vitest run tests/components/GapAnalysis.test.tsx
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add admin/src/app/knowledge-base/ admin/src/hooks/use-kb.ts admin/src/components/knowledge-base/
git commit -m "feat: KB page — FAQ CRUD, document upload, gap analysis tab"
```

---

## Task 6: Promotions + Broadcast Pages

**Files:**
- Create: `admin/src/app/promotions/page.tsx`
- Create: `admin/src/app/broadcast/page.tsx`
- Create: `admin/src/components/promotions/PromotionForm.tsx`
- Create: `admin/src/components/broadcast/BroadcastForm.tsx`

- [ ] **Step 1: Create PromotionForm.tsx**

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface FormData {
  name: string
  description: string
  start_date: string
  end_date: string
  message_template_bm: string
  message_template_zh: string
  message_template_ta: string
  message_template_en: string
}

export function PromotionForm({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit } = useForm<FormData>()
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: (data: FormData) => api.post('/promotions', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); onClose() }
  })

  return (
    <form onSubmit={handleSubmit(d => create.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Name</Label>
          <Input {...register('name', { required: true })} />
        </div>
        <div>
          <Label>Description</Label>
          <Input {...register('description')} />
        </div>
        <div>
          <Label>Start Date</Label>
          <Input type="date" {...register('start_date')} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" {...register('end_date')} />
        </div>
      </div>
      <div>
        <Label>Message (Bahasa Malaysia)</Label>
        <Textarea {...register('message_template_bm')} rows={3} placeholder="BM template..." />
      </div>
      <div>
        <Label>Message (Mandarin)</Label>
        <Textarea {...register('message_template_zh')} rows={3} placeholder="中文 template..." />
      </div>
      <div>
        <Label>Message (Tamil)</Label>
        <Textarea {...register('message_template_ta')} rows={3} placeholder="தமிழ் template..." />
      </div>
      <div>
        <Label>Message (English)</Label>
        <Textarea {...register('message_template_en')} rows={3} placeholder="English template..." />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending}>Create</Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create promotions page**

`admin/src/app/promotions/page.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PromotionForm } from '@/components/promotions/PromotionForm'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'

export default function PromotionsPage() {
  const { data } = useQuery({ queryKey: ['promotions'], queryFn: () => api.get<any[]>('/promotions') })
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Promotions</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} className="mr-1" /> New Promotion
        </Button>
      </div>

      <div className="space-y-3">
        {data?.map(promo => (
          <div key={promo.id} className="border rounded-md p-4 bg-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{promo.name}</p>
                  <Badge variant={promo.active ? 'default' : 'outline'}>
                    {promo.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {promo.description && <p className="text-sm text-gray-500">{promo.description}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {promo.start_date && format(new Date(promo.start_date), 'dd MMM yyyy')} –{' '}
                  {promo.end_date && format(new Date(promo.end_date), 'dd MMM yyyy')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Promotion</DialogTitle></DialogHeader>
          <PromotionForm onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 3: Create BroadcastForm.tsx**

```typescript
'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface FormData {
  promotionId: string
  scheduledAt: string
  filterLanguage: string
  filterInsurer: string
}

export function BroadcastForm() {
  const { data: promotions } = useQuery({ queryKey: ['promotions'], queryFn: () => api.get<any[]>('/promotions') })
  const [result, setResult] = useState<{ queued: number } | null>(null)
  const { register, handleSubmit, setValue } = useForm<FormData>()

  const launch = useMutation({
    mutationFn: (data: FormData) => api.post<{ queued: number }>('/broadcast', {
      promotionId: data.promotionId,
      scheduledAt: data.scheduledAt || undefined,
      filters: {
        language: data.filterLanguage || undefined,
        insurer: data.filterInsurer || undefined,
      },
    }),
    onSuccess: (data) => setResult(data),
  })

  return (
    <form onSubmit={handleSubmit(d => launch.mutate(d))} className="space-y-4 max-w-md">
      <div>
        <Label>Promotion</Label>
        <Select onValueChange={v => setValue('promotionId', v)}>
          <SelectTrigger><SelectValue placeholder="Select promotion" /></SelectTrigger>
          <SelectContent>
            {promotions?.filter(p => p.active).map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Filter by Language</Label>
          <Select onValueChange={v => setValue('filterLanguage', v)}>
            <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bm">BM</SelectItem>
              <SelectItem value="zh">Mandarin</SelectItem>
              <SelectItem value="ta">Tamil</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Filter by Insurer</Label>
          <Input {...register('filterInsurer')} placeholder="e.g. Etiqa" />
        </div>
      </div>
      <div>
        <Label>Schedule (leave blank for now)</Label>
        <Input type="datetime-local" {...register('scheduledAt')} />
      </div>
      <Button type="submit" disabled={launch.isPending}>
        {launch.isPending ? 'Queuing...' : 'Launch Broadcast'}
      </Button>
      {result && <p className="text-sm text-green-600">{result.queued} messages queued.</p>}
    </form>
  )
}
```

- [ ] **Step 4: Create broadcast page**

`admin/src/app/broadcast/page.tsx`:
```typescript
import { BroadcastForm } from '@/components/broadcast/BroadcastForm'

export default function BroadcastPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Broadcast</h1>
      <p className="text-sm text-gray-500">
        Send messages to a filtered customer segment. Rate limited to 10/min.
      </p>
      <BroadcastForm />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add admin/src/app/promotions/ admin/src/app/broadcast/ admin/src/components/promotions/ admin/src/components/broadcast/
git commit -m "feat: promotions + broadcast pages — create promotion, launch broadcast with filters"
```

---

## Task 7: Bot Settings + Corrections Pages

**Files:**
- Create: `admin/src/hooks/use-bot-config.ts`
- Create: `admin/src/components/settings/BotConfigForm.tsx`
- Create: `admin/src/app/settings/page.tsx`
- Create: `admin/src/app/corrections/page.tsx`
- Create: `admin/src/app/scheduler/page.tsx`
- Create: `admin/tests/components/BotConfigForm.test.tsx`

- [ ] **Step 1: Write failing test**

`admin/tests/components/BotConfigForm.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({
    data: { tone: 'friendly', persona_name: 'Aina', handoff_threshold: '0.6', language_fallback: 'bm' },
    isLoading: false,
  }),
  useMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
}))

import { BotConfigForm } from '@/components/settings/BotConfigForm'

describe('BotConfigForm', () => {
  it('renders persona name field with current value', () => {
    render(<BotConfigForm />)
    const input = screen.getByDisplayValue('Aina')
    expect(input).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd admin && npx vitest run tests/components/BotConfigForm.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Create src/hooks/use-bot-config.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useBotConfig() {
  return useQuery({
    queryKey: ['bot-config'],
    queryFn: () => api.get<Record<string, string>>('/bot-config'),
  })
}

export function useUpdateBotConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (updates: Record<string, string>) => api.put('/bot-config', updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bot-config'] }),
  })
}
```

- [ ] **Step 4: Create BotConfigForm.tsx**

```typescript
'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBotConfig, useUpdateBotConfig } from '@/hooks/use-bot-config'

interface FormData {
  tone: string
  persona_name: string
  language_fallback: string
  handoff_threshold: string
  owner_phone: string
  handoff_hold_msg_bm: string
  handoff_hold_msg_zh: string
  handoff_hold_msg_ta: string
  handoff_hold_msg_en: string
}

export function BotConfigForm() {
  const { data } = useBotConfig()
  const update = useUpdateBotConfig()
  const { register, handleSubmit, reset, setValue } = useForm<FormData>()

  useEffect(() => { if (data) reset(data) }, [data, reset])

  return (
    <form onSubmit={handleSubmit(d => update.mutate(d))} className="space-y-6 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Persona Name</Label>
          <Input {...register('persona_name')} />
        </div>
        <div>
          <Label>Tone</Label>
          <Select onValueChange={v => setValue('tone', v)} defaultValue={data?.tone}>
            <SelectTrigger><SelectValue placeholder="Select tone" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Default Language</Label>
          <Select onValueChange={v => setValue('language_fallback', v)} defaultValue={data?.language_fallback}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bm">Bahasa Malaysia</SelectItem>
              <SelectItem value="zh">Mandarin</SelectItem>
              <SelectItem value="ta">Tamil</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Handoff Threshold (0.0–1.0)</Label>
          <Input type="number" step="0.05" min="0" max="1" {...register('handoff_threshold')} />
        </div>
        <div className="col-span-2">
          <Label>Owner WhatsApp Number</Label>
          <Input {...register('owner_phone')} placeholder="60123456789" />
        </div>
      </div>
      <div className="space-y-3">
        <p className="font-medium text-sm">Handoff Hold Messages</p>
        {(['bm', 'zh', 'ta', 'en'] as const).map(lang => (
          <div key={lang}>
            <Label>{lang.toUpperCase()}</Label>
            <Textarea {...register(`handoff_hold_msg_${lang}`)} rows={2} />
          </div>
        ))}
      </div>
      <Button type="submit" disabled={update.isPending}>
        {update.isPending ? 'Saving...' : 'Save Settings'}
      </Button>
      {update.isSuccess && <p className="text-sm text-green-600">Saved.</p>}
    </form>
  )
}
```

- [ ] **Step 5: Create settings page**

`admin/src/app/settings/page.tsx`:
```typescript
import { BotConfigForm } from '@/components/settings/BotConfigForm'

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Bot Settings</h1>
      <BotConfigForm />
    </div>
  )
}
```

- [ ] **Step 6: Create corrections page**

`admin/src/app/corrections/page.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function CorrectionsPage() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['corrections'],
    queryFn: () => api.get<any[]>('/corrections'),
  })
  const [editing, setEditing] = useState<string | null>(null)
  const [corrected, setCorrected] = useState('')

  const save = useMutation({
    mutationFn: ({ messageId, originalReply, correctedReply, intent }: any) =>
      api.post('/corrections', { messageId, originalReply, correctedReply, intent }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['corrections'] }); setEditing(null) }
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/corrections/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['corrections'] }),
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Corrections</h1>
      <p className="text-sm text-gray-500">
        Review bot replies. Mark incorrect ones and provide the correct reply — saved as few-shot examples.
      </p>
      <div className="space-y-3">
        {data?.map(c => (
          <div key={c.id} className="border rounded-md p-4 bg-white space-y-2">
            {c.customer_message && (
              <p className="text-xs text-gray-400">Customer: {c.customer_message}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-red-600 mb-1">Original bot reply</p>
                <p className="text-sm bg-red-50 p-2 rounded">{c.original_reply}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-green-600 mb-1">Corrected reply</p>
                <p className="text-sm bg-green-50 p-2 rounded">{c.corrected_reply}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Intent: {c.intent}</span>
              <Button size="sm" variant="ghost" className="ml-auto text-red-500"
                onClick={() => remove.mutate(c.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
        {(!data || data.length === 0) && (
          <p className="text-sm text-gray-400">No corrections yet. Add corrections from conversation detail.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create scheduler page**

`admin/src/app/scheduler/page.tsx`:
```typescript
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export default function SchedulerPage() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['scheduler-jobs'],
    queryFn: () => api.get<any[]>('/scheduler/jobs'),
    refetchInterval: 30_000,
  })

  const cancel = useMutation({
    mutationFn: (id: string) => api.delete(`/scheduler/jobs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduler-jobs'] }),
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Scheduler</h1>
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Customer', 'Phone', 'Type', 'Step', 'Scheduled', ''].map(h => (
                <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map(job => (
              <tr key={job.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{job.name ?? '—'}</td>
                <td className="px-4 py-2 font-mono text-xs">{job.phone}</td>
                <td className="px-4 py-2">
                  <Badge variant="outline">{job.type}</Badge>
                </td>
                <td className="px-4 py-2 font-mono text-xs">{job.step ?? '—'}</td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {format(new Date(job.scheduled_at), 'dd MMM yyyy HH:mm')}
                </td>
                <td className="px-4 py-2">
                  <Button size="sm" variant="ghost" className="text-red-500"
                    onClick={() => cancel.mutate(job.id)}>
                    Cancel
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

```bash
cd admin && npx vitest run tests/components/BotConfigForm.test.tsx
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add admin/src/app/settings/ admin/src/app/corrections/ admin/src/app/scheduler/ admin/src/hooks/use-bot-config.ts admin/src/components/settings/
git commit -m "feat: settings, corrections, scheduler pages — bot config, corrections review, job management"
```

---

## Task 8: Full Test Run + Production Build

- [ ] **Step 1: Run full test suite**

```bash
cd admin && npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 2: Production build**

```bash
cd admin && npm run build
```

Expected: Build completes with no errors.

- [ ] **Step 3: Start admin locally**

```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_API_URL and NEXT_PUBLIC_API_KEY
npm run dev
```

Open `http://localhost:3001` — verify all 8 pages load and connect to backend.

- [ ] **Step 4: Set up Cloudflare Tunnel**

```bash
# Install cloudflared (once)
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

cloudflared tunnel create limauai-admin
cloudflared tunnel route dns limauai-admin admin.limauais.my

# Start tunnel (add to PM2 ecosystem)
cloudflared tunnel run --url http://localhost:3001 limauai-admin
```

- [ ] **Step 5: Final commit**

```bash
git add admin/
git commit -m "feat: admin UI complete — all 8 pages, Cloudflare Tunnel config"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Dashboard — live conversations (open/handoff/resolved), handoff alerts, quick reply — Task 3
- [x] Customers — list/search/filter, Excel import — Task 4
- [x] Knowledge Base — CRUD, document upload — Task 5
- [x] Gap analysis tab — Task 5
- [x] Promotions — create, multilingual templates — Task 6
- [x] Broadcast — select audience, schedule, launch — Task 6
- [x] Scheduler — view/cancel upcoming jobs — Task 7
- [x] Bot Settings — tone, persona, handoff threshold, hold messages per language, owner phone — Task 7
- [x] Corrections — review past replies, add corrections — Task 7
- [x] Cloudflare Tunnel setup — Task 8
