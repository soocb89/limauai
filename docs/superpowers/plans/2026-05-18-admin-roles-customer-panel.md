# Admin Roles + Customer Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin/agent role hierarchy with page-level access control, a right-side customer info panel triggered by the pencil icon in the conversation header, and webhook-triggered tag storage on customers.

**Architecture:** Add `admin_users` DB table; backend issues a JWT (signed with `SESSION_SECRET`) on username+password login; Next.js middleware verifies the JWT and blocks agent access to restricted pages; a `RoleProvider` context exposes role to client components; `CustomerInfoPanel` slides in from the right when the pencil icon is clicked; webhook route gains tag-merge support.

**Tech Stack:** PostgreSQL (new table), `bcryptjs` + `jsonwebtoken` (backend), `jose` (Next.js Edge middleware), React context (role), TanStack Query (panel data), Tailwind (panel UI)

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/db/migrations/018_admin_users.sql` | `admin_users` table |
| Create | `src/db/seed-admin.ts` | Script: seed default admin user |
| Create | `src/modules/admin-api/routes/auth.ts` | Login + create-user endpoints |
| Modify | `src/modules/admin-api/index.ts` | Mount auth router before `requireApiKey` |
| Modify | `src/modules/admin-api/routes/webhook.ts` | Add tags merge to customer upsert |
| Modify | `admin/src/app/login/page.tsx` | Add username field |
| Modify | `admin/src/app/api/auth/login/route.ts` | Forward to backend login, store JWT cookie |
| Modify | `admin/middleware.ts` | Verify JWT, block agent routes, set `x-user-role` header |
| Create | `admin/src/components/RoleProvider.tsx` | Context provider + `useRole()` hook |
| Modify | `admin/src/app/(dashboard)/layout.tsx` | Read role from header, wrap in `RoleProvider` |
| Modify | `admin/src/components/Sidebar.tsx` | Accept `role` prop, filter NAV by role |
| Modify | `admin/src/app/(dashboard)/promotions/page.tsx` | Hide write actions for agent role |
| Modify | `admin/src/hooks/use-customers.ts` | Add `useCustomer(id)` hook |
| Create | `admin/src/components/CustomerInfoPanel.tsx` | Customer detail panel component |
| Modify | `admin/src/components/QuickReply.tsx` | Replace inline edit with `onOpenPanel` callback |
| Modify | `admin/src/app/(dashboard)/dashboard/page.tsx` | Manage panel state, render panel beside QuickReply |

---

## Task 1: DB Migration — admin_users table

**Files:**
- Create: `src/db/migrations/018_admin_users.sql`

- [ ] **Step 1: Write the migration**

```sql
-- src/db/migrations/018_admin_users.sql
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 2: Run the migration**

```bash
npm run db:migrate
```

Expected output: Migration applied without errors. Verify with `\d admin_users` in psql if needed.

- [ ] **Step 3: Commit**

```bash
git add src/db/migrations/018_admin_users.sql
git commit -m "feat: add admin_users table for role-based auth"
```

---

## Task 2: Backend — install auth packages + seed script

**Files:**
- Create: `src/db/seed-admin.ts`

- [ ] **Step 1: Install packages**

```bash
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

- [ ] **Step 2: Add `SESSION_SECRET` to backend `.env`**

Open `L:\Project\CSProject\.env` and add:

```
SESSION_SECRET=<same value as admin/.env.local SESSION_SECRET>
```

- [ ] **Step 3: Write seed-admin script**

```typescript
// src/db/seed-admin.ts
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db } from './index.js'

const username = process.env.ADMIN_USERNAME ?? 'admin'
const password = process.env.ADMIN_API_KEY
if (!password) { console.error('ADMIN_API_KEY required'); process.exit(1) }

const hash = await bcrypt.hash(password, 10)
await db.query(
  `INSERT INTO admin_users (username, password_hash, role)
   VALUES ($1, $2, 'admin')
   ON CONFLICT (username) DO NOTHING`,
  [username, hash]
)
console.log(`Admin user "${username}" seeded.`)
process.exit(0)
```

- [ ] **Step 4: Add npm script to `package.json`**

In the `scripts` section, add:

```json
"db:seed-admin": "tsx src/db/seed-admin.ts"
```

- [ ] **Step 5: Run seed**

```bash
npm run db:seed-admin
```

Expected: `Admin user "admin" seeded.`

- [ ] **Step 6: Commit**

```bash
git add src/db/seed-admin.ts package.json
git commit -m "feat: seed default admin user with bcrypt password"
```

---

## Task 3: Backend — auth router (login + create user)

**Files:**
- Create: `src/modules/admin-api/routes/auth.ts`

- [ ] **Step 1: Write auth router**

```typescript
// src/modules/admin-api/routes/auth.ts
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from '../../../db/index.js'
import { requireApiKey } from '../middleware/auth.js'

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' })
  }

  const { rows } = await db.query(
    'SELECT id, password_hash, role FROM admin_users WHERE username = $1',
    [username]
  )
  const user = rows[0]
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const secret = process.env.SESSION_SECRET
  if (!secret) return res.status(500).json({ error: 'SESSION_SECRET not configured' })

  const token = jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '7d' })
  res.json({ token, role: user.role })
})

// Create a new agent user — requires admin API key
authRouter.post('/users', requireApiKey, async (req, res) => {
  const { username, password, role = 'agent' } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' })
  }
  if (!['admin', 'agent'].includes(role)) {
    return res.status(400).json({ error: 'role must be admin or agent' })
  }
  const hash = await bcrypt.hash(password, 10)
  const { rows } = await db.query(
    `INSERT INTO admin_users (username, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id, username, role, created_at`,
    [username, hash, role]
  )
  res.json(rows[0])
})
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/admin-api/routes/auth.ts
git commit -m "feat: add auth router — login (JWT) + create user"
```

---

## Task 4: Backend — wire auth router before global API key check

**Files:**
- Modify: `src/modules/admin-api/index.ts`

- [ ] **Step 1: Import and mount auth router before `requireApiKey`**

Replace the current content of `src/modules/admin-api/index.ts` with:

```typescript
import { Router } from 'express'
import { requireApiKey } from './middleware/auth.js'
import { authRouter } from './routes/auth.js'
import { customersRouter } from './routes/customers.js'
import { conversationsRouter } from './routes/conversations.js'
import { kbRouter } from './routes/knowledge-base.js'
import { promotionsRouter } from './routes/promotions.js'
import { broadcastRouter } from './routes/broadcast.js'
import { schedulerRouter } from './routes/scheduler.js'
import { botConfigRouter } from './routes/bot-config.js'
import { correctionsRouter } from './routes/corrections.js'
import { webhookRouter } from './routes/webhook.js'
import { testRouter } from './routes/test.js'
import { webhooksRouter } from './routes/webhooks.js'
import { waStatusRouter } from './routes/wa-status.js'

export const adminRouter = Router()

// /auth/login is public — mount before requireApiKey
adminRouter.use('/auth', authRouter)

adminRouter.use(requireApiKey)
adminRouter.use('/customers', customersRouter)
adminRouter.use('/conversations', conversationsRouter)
adminRouter.use('/kb', kbRouter)
adminRouter.use('/promotions', promotionsRouter)
adminRouter.use('/broadcast', broadcastRouter)
adminRouter.use('/scheduler', schedulerRouter)
adminRouter.use('/bot-config', botConfigRouter)
adminRouter.use('/corrections', correctionsRouter)
adminRouter.use('/test', testRouter)
adminRouter.use('/webhooks', webhooksRouter)
adminRouter.use('/wa', waStatusRouter)

export const webhookRouter_ = webhookRouter
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Expected: compiles without errors.

- [ ] **Step 3: Test login manually**

```bash
curl -X POST http://localhost:3001/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<ADMIN_API_KEY value>"}'
```

Expected response: `{"token":"<jwt>","role":"admin"}`

- [ ] **Step 4: Commit**

```bash
git add src/modules/admin-api/index.ts
git commit -m "feat: mount auth router before requireApiKey middleware"
```

---

## Task 5: Backend — webhook tags support

**Files:**
- Modify: `src/modules/admin-api/routes/webhook.ts`

- [ ] **Step 1: Add tag parsing and merge to the customer upsert**

In `webhookRouter.post('/w/:token', ...)`, replace the customer upsert block (lines 33–45) with:

```typescript
  // Parse tags from payload: comma-separated string or JSON array
  let incomingTags: string[] = []
  if (body.tags) {
    if (typeof body.tags === 'string') {
      incomingTags = body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    } else if (Array.isArray(body.tags)) {
      incomingTags = body.tags.map(String).filter(Boolean)
    }
  }

  const { rows: upserted } = await db.query(
    `INSERT INTO customers (phone, name, car_plate, insurer, tags, source)
     VALUES ($1, $2, $3, $4, $5::text[], 'bot_captured')
     ON CONFLICT (phone) DO UPDATE SET
       name = COALESCE(EXCLUDED.name, customers.name),
       car_plate = COALESCE(EXCLUDED.car_plate, customers.car_plate),
       insurer = COALESCE(EXCLUDED.insurer, customers.insurer),
       tags = CASE
         WHEN cardinality(EXCLUDED.tags) > 0
         THEN array(SELECT DISTINCT unnest(customers.tags || EXCLUDED.tags))
         ELSE customers.tags
       END,
       updated_at = NOW()
     RETURNING id, language, name`,
    [normalizedPhone, name ?? null, car_plate ?? null, insurer ?? null, incomingTags]
  )
```

> Note: The `tags` column already exists on `customers` (migration 013). The insert now includes it; existing rows merge incoming tags rather than overwriting.

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/modules/admin-api/routes/webhook.ts
git commit -m "feat: webhook merges tags into customer.tags on trigger"
```

---

## Task 6: Frontend — install jose, update login page (add username field)

**Files:**
- Modify: `admin/src/app/login/page.tsx`

- [ ] **Step 1: Install jose in admin**

```bash
cd admin && npm install jose
```

- [ ] **Step 2: Update login page to collect username**

Replace `admin/src/app/login/page.tsx` with:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        router.push('/dashboard')
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Invalid credentials')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 border rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">LimauAI Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !username || !password}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/app/login/page.tsx admin/package.json admin/package-lock.json
git commit -m "feat: login page accepts username + password"
```

---

## Task 7: Frontend — update Next.js login API route to call backend

**Files:**
- Modify: `admin/src/app/api/auth/login/route.ts`

- [ ] **Step 1: Replace route to forward credentials to backend and store JWT**

```typescript
// admin/src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const backendUrl = process.env.BACKEND_URL
  const backendRes = await fetch(`${backendUrl}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!backendRes.ok) {
    const body = await backendRes.json().catch(() => ({}))
    return NextResponse.json(
      { error: body.error ?? 'Invalid credentials' },
      { status: 401 }
    )
  }

  const { token } = await backendRes.json()

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/app/api/auth/login/route.ts
git commit -m "feat: login API route forwards to backend JWT auth"
```

---

## Task 8: Frontend — update middleware for JWT verification + role-based routing

**Files:**
- Modify: `admin/middleware.ts`

- [ ] **Step 1: Replace middleware with JWT-aware version**

```typescript
// admin/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const AGENT_BLOCKED = [
  '/knowledge-base',
  '/webhooks',
  '/broadcast',
  '/scheduler',
  '/settings',
  '/corrections',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/auth')) return NextResponse.next()

  const token = request.cookies.get('admin_session')?.value

  if (!token) {
    if (pathname === '/login') return NextResponse.next()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const role = (payload.role as string) ?? 'agent'

    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (role === 'agent' && AGENT_BLOCKED.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    const res = NextResponse.next()
    res.headers.set('x-user-role', role)
    return res
  } catch {
    if (pathname === '/login') return NextResponse.next()
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.delete('admin_session')
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/middleware.ts
git commit -m "feat: middleware verifies JWT, blocks agent from restricted pages"
```

---

## Task 9: Frontend — RoleProvider context + useRole hook

**Files:**
- Create: `admin/src/components/RoleProvider.tsx`

- [ ] **Step 1: Write the provider**

```typescript
// admin/src/components/RoleProvider.tsx
'use client'

import { createContext, useContext } from 'react'

const RoleContext = createContext<'admin' | 'agent'>('agent')

export function RoleProvider({
  role,
  children,
}: {
  role: 'admin' | 'agent'
  children: React.ReactNode
}) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>
}

export function useRole() {
  return useContext(RoleContext)
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/components/RoleProvider.tsx
git commit -m "feat: RoleProvider context and useRole hook"
```

---

## Task 10: Frontend — update DashboardLayout to read role and provide it

**Files:**
- Modify: `admin/src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Read role from middleware header, wrap children in RoleProvider**

```typescript
// admin/src/app/(dashboard)/layout.tsx
import { headers } from 'next/headers'
import { Sidebar } from '@/components/Sidebar'
import { RoleProvider } from '@/components/RoleProvider'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const role = (headers().get('x-user-role') ?? 'agent') as 'admin' | 'agent'
  return (
    <RoleProvider role={role}>
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar role={role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </RoleProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/app/(dashboard)/layout.tsx
git commit -m "feat: dashboard layout reads JWT role and provides it via context"
```

---

## Task 11: Frontend — update Sidebar to filter nav by role

**Files:**
- Modify: `admin/src/components/Sidebar.tsx`

- [ ] **Step 1: Accept role prop, filter NAV for agent**

Replace `admin/src/components/Sidebar.tsx` with:

```typescript
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
  { href: '/dashboard', label: 'Conversations', icon: MessageSquare, adminOnly: false },
  { href: '/customers', label: 'Customers', icon: Users, adminOnly: false },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen, adminOnly: true },
  { href: '/promotions', label: 'Promotions', icon: Megaphone, adminOnly: false },
  { href: '/broadcast', label: 'Broadcast', icon: Zap, adminOnly: true },
  { href: '/scheduler', label: 'Scheduler', icon: Clock, adminOnly: true },
  { href: '/webhooks', label: 'Webhooks', icon: Webhook, adminOnly: true },
  { href: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
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

export function Sidebar({ role }: { role: 'admin' | 'agent' }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const visibleNav = role === 'admin' ? NAV : NAV.filter(n => !n.adminOnly)

  return (
    <aside className="w-56 shrink-0 border-r bg-sidebar flex flex-col h-[100dvh] sticky top-0">
      <div className="px-4 py-5 font-semibold text-base border-b tracking-tight text-sidebar-foreground">
        LimauAI
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon }) => {
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
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/components/Sidebar.tsx
git commit -m "feat: Sidebar filters nav links by admin/agent role"
```

---

## Task 12: Frontend — disable promotions write actions for agent

**Files:**
- Modify: `admin/src/app/(dashboard)/promotions/page.tsx`

- [ ] **Step 1: Read the current promotions page**

Open `admin/src/app/(dashboard)/promotions/page.tsx` and identify all write action buttons: create promotion button, edit promotion button, tag customers button. These need to be hidden when role is `'agent'`.

- [ ] **Step 2: Add `useRole` and conditionally render write actions**

At the top of the `PromotionsPage` component:

```typescript
import { useRole } from '@/components/RoleProvider'

// inside component:
const role = useRole()
const isAgent = role === 'agent'
```

Then for each write-action button/section, wrap with:

```tsx
{!isAgent && (
  <Button onClick={handleCreatePromotion}>New Promotion</Button>
)}
```

Apply the same `{!isAgent && ...}` guard to all edit and tag-customers buttons within the promotions page. The page itself remains visible and browseable for agents — only mutation controls are hidden.

- [ ] **Step 3: Commit**

```bash
git add admin/src/app/(dashboard)/promotions/page.tsx
git commit -m "feat: promotions page is view-only for agent role"
```

---

## Task 13: Frontend — add useCustomer hook

**Files:**
- Modify: `admin/src/hooks/use-customers.ts`

- [ ] **Step 1: Add `useCustomer` (single customer fetch) to the hook file**

Add the following to `admin/src/hooks/use-customers.ts` after the existing `useCustomers` function:

```typescript
export function useCustomer(id: string | null) {
  return useQuery<Customer>({
    queryKey: ['customer', id],
    queryFn: () => apiFetch(`/admin/customers/${id}`),
    enabled: id !== null,
  })
}
```

Also update `useUpdateCustomer` to also invalidate the single-customer query and conversations:

```typescript
export function useUpdateCustomer(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Pick<Customer, 'name' | 'car_plate' | 'insurer' | 'renewal_date' | 'tags' | 'custom_fields' | 'status'>>) =>
      apiFetch(`/admin/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer', id] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/hooks/use-customers.ts
git commit -m "feat: add useCustomer hook for single customer fetch"
```

---

## Task 14: Frontend — CustomerInfoPanel component

**Files:**
- Create: `admin/src/components/CustomerInfoPanel.tsx`

- [ ] **Step 1: Write the panel component**

```typescript
// admin/src/components/CustomerInfoPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { useCustomer, useUpdateCustomer } from '@/hooks/use-customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { X } from 'lucide-react'

interface Props {
  customerId: string
  onClose: () => void
}

export function CustomerInfoPanel({ customerId, onClose }: Props) {
  const { data: customer, isLoading } = useCustomer(customerId)
  const update = useUpdateCustomer(customerId)

  const [name, setName] = useState('')
  const [carPlate, setCarPlate] = useState('')
  const [insurer, setInsurer] = useState('')
  const [renewalDate, setRenewalDate] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => {
    if (!customer) return
    setName(customer.name ?? '')
    setCarPlate(customer.car_plate ?? '')
    setInsurer(customer.insurer ?? '')
    setRenewalDate(customer.renewal_date ? customer.renewal_date.slice(0, 10) : '')
    setTagsInput(customer.tags.join(', '))
  }, [customer])

  async function handleSave() {
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    await update.mutateAsync({ name, car_plate: carPlate, insurer, renewal_date: renewalDate || null, tags })
    toast.success('Customer updated')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-sm">Customer Info</span>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isLoading || !customer ? (
        <p className="text-sm text-muted-foreground p-4">Loading…</p>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <p className="text-sm font-medium">{customer.phone}</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="panel-name" className="text-xs">Name</Label>
            <Input id="panel-name" value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="panel-plate" className="text-xs">Car Plate</Label>
            <Input id="panel-plate" value={carPlate} onChange={e => setCarPlate(e.target.value)} className="h-8 text-sm" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="panel-insurer" className="text-xs">Insurer</Label>
            <Input id="panel-insurer" value={insurer} onChange={e => setInsurer(e.target.value)} className="h-8 text-sm" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="panel-renewal" className="text-xs">Renewal Date</Label>
            <Input id="panel-renewal" type="date" value={renewalDate} onChange={e => setRenewalDate(e.target.value)} className="h-8 text-sm" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="panel-tags" className="text-xs">Tags (comma-separated)</Label>
            <Input id="panel-tags" value={tagsInput} onChange={e => setTagsInput(e.target.value)} className="h-8 text-sm" placeholder="vip, renewal, follow-up" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <p className="text-sm capitalize">{customer.status}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Language</Label>
            <p className="text-sm uppercase">{customer.language ?? '—'}</p>
          </div>

          {Object.keys(customer.custom_fields).length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Custom Fields</Label>
              <div className="space-y-1">
                {Object.entries(customer.custom_fields).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-sm">
                    <span className="text-muted-foreground w-28 shrink-0 truncate">{k}</span>
                    <span className="font-medium truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={update.isPending} className="w-full" size="sm">
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/components/CustomerInfoPanel.tsx
git commit -m "feat: CustomerInfoPanel — editable customer details slide-in"
```

---

## Task 15: Frontend — wire QuickReply pencil to panel, update dashboard layout

**Files:**
- Modify: `admin/src/components/QuickReply.tsx`
- Modify: `admin/src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Update QuickReply to accept `onOpenPanel` and remove inline name edit**

Replace `admin/src/components/QuickReply.tsx` with:

```typescript
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
```

- [ ] **Step 2: Update dashboard/page.tsx to manage panel state and render CustomerInfoPanel**

Replace `admin/src/app/(dashboard)/dashboard/page.tsx` with:

```typescript
'use client'

import { useState } from 'react'
import { useConversations, useConversationCounts } from '@/hooks/use-conversations'
import { ConversationList } from '@/components/ConversationList'
import { QuickReply } from '@/components/QuickReply'
import { CustomerInfoPanel } from '@/components/CustomerInfoPanel'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'

export default function DashboardPage() {
  const [status, setStatus] = useState('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showPanel, setShowPanel] = useState(false)
  const { data: conversations = [], isLoading } = useConversations(status)
  const { data: counts } = useConversationCounts()
  const selected = conversations.find((c) => c.id === selectedId)
  const filtered = conversations.filter(c =>
    !search || (c.name ?? '').toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  )

  function handleSelect(id: string) {
    setSelectedId(id)
    setShowPanel(false)
  }

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
            <ConversationList conversations={filtered} selectedId={selectedId} onSelect={handleSelect} />
          </div>
        )}
      </div>

      <div className="flex-1 flex gap-4 min-w-0">
        <div className="flex-1 border rounded-lg overflow-hidden min-w-0">
          {selected ? (
            <QuickReply
              conversationId={selected.id}
              customerId={selected.customer_id}
              currentStatus={selected.status}
              phone={selected.phone}
              customerName={selected.name}
              onOpenPanel={() => setShowPanel(true)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Select a conversation
            </div>
          )}
        </div>

        {selected && showPanel && (
          <div className="w-72 shrink-0 border rounded-lg overflow-hidden">
            <CustomerInfoPanel
              customerId={selected.customer_id}
              onClose={() => setShowPanel(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build admin to verify no type errors**

```bash
cd admin && npm run build
```

Expected: build succeeds. Fix any TypeScript errors before committing.

- [ ] **Step 4: Commit**

```bash
git add admin/src/components/QuickReply.tsx admin/src/app/(dashboard)/dashboard/page.tsx
git commit -m "feat: pencil icon opens CustomerInfoPanel slide-in from conversation header"
```

---

## Task 16: Build + Deploy

- [ ] **Step 1: Build backend**

```bash
npm run build
```

- [ ] **Step 2: Build admin**

```bash
cd admin && npm run build
```

- [ ] **Step 3: Restart all processes**

```bash
npm run build && npx pm2 restart limauai
cd admin && npm run build && cd .. && npx pm2 restart limauai-admin
```

- [ ] **Step 4: Verify login with username+password**

Navigate to `admin.limauais.my/login`, enter username `admin` and password (same as `ADMIN_API_KEY`). Should redirect to `/dashboard`.

- [ ] **Step 5: Verify agent role**

POST to `/admin/auth/users` with API key to create an agent account:

```bash
curl -X POST http://localhost:3001/admin/auth/users \
  -H "X-Api-Key: <ADMIN_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"username":"agent1","password":"agentpass","role":"agent"}'
```

Log in as `agent1`. Verify: Knowledge Base, Broadcast, Scheduler, Webhooks, Settings, Corrections links are absent from sidebar. Promotions shows no create/edit buttons.

- [ ] **Step 6: Verify panel**

Open a conversation → click pencil icon → right-side panel appears showing customer details. Edit name → Save → name updates in header.

- [ ] **Step 7: Verify webhook tags**

POST to a webhook endpoint with a `tags` field:

```bash
curl -X POST http://localhost:3001/admin/wa/w/<token> \
  -H "Content-Type: application/json" \
  -d '{"phone":"60129760883","name":"Test","tags":"vip,renewal"}'
```

Open customer panel for that phone — tags `vip` and `renewal` should appear.

---

## Self-Review Checklist

**Spec coverage:**
- [x] Admin = full access → all NAV links shown, all write ops available
- [x] Agent = edit conversations + customers, view promotions → NAV filtered, promotions write hidden
- [x] Pencil icon in conversation header → opens right-side panel
- [x] Panel shows name, phone, car_plate, insurer, renewal_date, tags, custom_fields
- [x] Webhook stores tags into customer.tags

**Placeholder scan:** None found — all steps contain exact code.

**Type consistency:**
- `Customer` interface (use-customers.ts) matches backend PATCH fields used in CustomerInfoPanel
- `QuickReply` now requires `onOpenPanel: () => void` — dashboard/page.tsx passes it
- `Sidebar` now requires `role: 'admin' | 'agent'` — layout.tsx passes it
- `RoleProvider` accepts `role: 'admin' | 'agent'` — layout.tsx passes correct type
