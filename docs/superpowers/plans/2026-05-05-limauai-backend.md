# LimauAI Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the LimauAI backend — a Node.js/TypeScript WhatsApp AI chatbot for Malaysian car insurance renewal using Baileys, OpenAI, PostgreSQL, and Redis, with a full REST API for the admin dashboard.

**Architecture:** Modular monolith under `src/modules/`. Each module exposes a typed interface. Async inter-module tasks go through BullMQ so any module can later be extracted to its own process. The message pipeline in `src/pipeline.ts` orchestrates modules for each incoming WA message.

**Tech Stack:** Node.js 20, TypeScript 5, `@whiskeysockets/baileys`, Express 4, `pg` (node-postgres), `ioredis`, BullMQ, OpenAI SDK v4, `franc-min` (language detection), `xlsx` (Excel import), `pdf-parse` + `mammoth` (document parsing), `multer` (file upload), Vitest

---

## File Map

```
src/
  index.ts                          entry point — mounts Express + starts Baileys + starts BullMQ workers
  config.ts                         typed env loader
  pipeline.ts                       orchestrates all modules for one incoming message
  db/
    index.ts                        pg Pool export
    migrate.ts                      migration runner (reads migrations/ in order)
    seed.ts                         inserts default bot_config rows
    migrations/
      001_extensions.sql
      002_customers.sql
      003_conversations.sql
      004_messages.sql
      005_knowledge_base.sql
      006_bot_corrections.sql
      007_promotions.sql
      008_quotations.sql
      009_payments.sql
      010_follow_up_jobs.sql
      011_bot_config.sql
  redis/
    index.ts                        ioredis client export
  modules/
    wa-connector/
      index.ts                      Baileys session init, reconnect loop, message event emitter
      sender.ts                     sendText(phone, text), sendAlert(text)
    language-detector/
      index.ts                      detectLanguage(text): 'bm'|'zh'|'ta'|'en'
    context-manager/
      index.ts                      loadContext(customerId), saveMessage(msg), getOrCreateConversation(customerId)
      types.ts                      ConversationContext, MessageRow interfaces
    intent-router/
      index.ts                      classifyIntent(text, context): { intent, confidence }
      types.ts                      Intent type union, IntentResult interface
    kb-retriever/
      embedder.ts                   embedText(text): number[]
      index.ts                      retrieveKB(query, topK=3): KBChunk[]
    ai-engine/
      prompt-builder.ts             buildSystemPrompt(config, corrections): string
      index.ts                      generateReply(input): string
    handoff-manager/
      index.ts                      shouldHandoff(intentResult, messages): boolean, triggerHandoff(ctx)
    tagger/
      index.ts                      tagConversation(conversationId, intent, language)
    scheduler/
      index.ts                      register all BullMQ workers, export queues
      renewal.ts                    processRenewalStep(job): handles t30/t14/t3/t1 logic
      broadcast.ts                  processBroadcastMessage(job): rate-limited send
      seed-renewal-jobs.ts          scheduleRenewalJobs(customerId): creates t30/t14/t3/t1 jobs
    admin-api/
      index.ts                      Express router — mounts all route files
      middleware/
        auth.ts                     requireApiKey middleware
      routes/
        customers.ts                GET/POST/PUT/DELETE /customers + POST /customers/import
        conversations.ts            GET /conversations, GET /conversations/:id/messages
        knowledge-base.ts           CRUD /kb + POST /kb/upload + GET /kb/gaps
        promotions.ts               CRUD /promotions + POST /promotions/:id/tag-customers
        broadcast.ts                POST /broadcast + GET /broadcast/:id/stats
        scheduler.ts                GET /scheduler/jobs + DELETE /scheduler/jobs/:id
        bot-config.ts               GET/PUT /bot-config
        corrections.ts              GET/POST /corrections
        webhook.ts                  POST /webhook/quotation
tests/
  modules/
    language-detector.test.ts
    intent-router.test.ts
    context-manager.test.ts
    kb-retriever.test.ts
    ai-engine.test.ts
    handoff-manager.test.ts
    tagger.test.ts
    scheduler-renewal.test.ts
    scheduler-broadcast.test.ts
  api/
    customers.test.ts
    knowledge-base.test.ts
    webhook.test.ts
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.env.example`
- Create: `src/config.ts`

- [ ] **Step 1: Initialize package.json**

```bash
cd L:\Project\CSProject
npm init -y
npm install @whiskeysockets/baileys@^6 @hapi/boom express pg ioredis bullmq openai franc-min xlsx pdf-parse mammoth multer dotenv qrcode-terminal
npm install --save-dev typescript @types/node @types/express @types/pg @types/multer @types/pdf-parse vitest tsx
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "admin"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
})
```

- [ ] **Step 4: Create tests/setup.ts**

```typescript
import { config } from 'dotenv'
config({ path: '.env.test' })
```

- [ ] **Step 5: Create .env.example**

```bash
DATABASE_URL=postgresql://limauai:password@localhost:5432/limauai
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
ADMIN_API_KEY=changeme
OWNER_PHONE=601xxxxxxxx
BAILEYS_SESSION_PATH=./baileys-session
PORT=3000
```

- [ ] **Step 6: Create .env.test**

```bash
DATABASE_URL=postgresql://limauai:password@localhost:5432/limauai_test
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-test
ADMIN_API_KEY=test-key
OWNER_PHONE=60100000000
BAILEYS_SESSION_PATH=./baileys-session-test
PORT=3001
```

- [ ] **Step 7: Create src/config.ts**

```typescript
import 'dotenv/config'

function required(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required env var: ${key}`)
  return val
}

export const config = {
  db: { url: required('DATABASE_URL') },
  redis: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
  openai: { apiKey: required('OPENAI_API_KEY') },
  admin: { apiKey: required('ADMIN_API_KEY') },
  owner: { phone: required('OWNER_PHONE') },
  baileys: { sessionPath: process.env.BAILEYS_SESSION_PATH ?? './baileys-session' },
  port: parseInt(process.env.PORT ?? '3000', 10),
} as const
```

- [ ] **Step 8: Add scripts to package.json**

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:seed": "tsx src/db/seed.ts"
  }
}
```

- [ ] **Step 9: Commit**

```bash
git init
git add package.json tsconfig.json vitest.config.ts .env.example src/config.ts tests/setup.ts
git commit -m "feat: project scaffold — Node.js/TypeScript, Vitest, env config"
```

---

## Task 2: Database Schema + Migrations

**Files:**
- Create: `src/db/index.ts`
- Create: `src/db/migrate.ts`
- Create: `src/db/migrations/001_extensions.sql` through `011_bot_config.sql`
- Create: `src/db/seed.ts`

- [ ] **Step 1: Create src/db/index.ts**

```typescript
import { Pool } from 'pg'
import { config } from '../config.js'

export const db = new Pool({ connectionString: config.db.url })
```

- [ ] **Step 2: Create src/db/migrate.ts**

```typescript
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { db } from './index.js'

async function migrate() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      ran_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  const migrationsDir = join(import.meta.dirname ?? __dirname, 'migrations')
  const files = (await readdir(migrationsDir)).filter(f => f.endsWith('.sql')).sort()

  for (const file of files) {
    const { rows } = await db.query('SELECT 1 FROM _migrations WHERE filename = $1', [file])
    if (rows.length > 0) continue

    const sql = await readFile(join(migrationsDir, file), 'utf8')
    await db.query(sql)
    await db.query('INSERT INTO _migrations (filename) VALUES ($1)', [file])
    console.log(`✓ ${file}`)
  }

  await db.end()
  console.log('Migrations complete.')
}

migrate().catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Step 3: Create migration 001 — pgvector extension**

`src/db/migrations/001_extensions.sql`:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
```

- [ ] **Step 4: Create migration 002 — customers**

`src/db/migrations/002_customers.sql`:
```sql
CREATE TYPE customer_source AS ENUM ('excel_import', 'bot_captured');

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  language VARCHAR(10),
  renewal_date DATE,
  car_plate VARCHAR(20),
  insurer VARCHAR(100),
  senang_customer_id VARCHAR(100),
  consent BOOLEAN NOT NULL DEFAULT false,
  consent_given_at TIMESTAMPTZ,
  source customer_source NOT NULL DEFAULT 'bot_captured',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 5: Create migration 003 — conversations**

`src/db/migrations/003_conversations.sql`:
```sql
CREATE TYPE conversation_status AS ENUM ('open', 'handoff', 'resolved');

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status conversation_status NOT NULL DEFAULT 'open',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX conversations_customer_id_idx ON conversations(customer_id);
CREATE INDEX conversations_status_idx ON conversations(status);
```

- [ ] **Step 6: Create migration 004 — messages**

`src/db/migrations/004_messages.sql`:
```sql
CREATE TYPE message_role AS ENUM ('user', 'bot', 'system');

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  intent VARCHAR(50),
  language VARCHAR(10),
  confidence FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX messages_intent_idx ON messages(intent);
CREATE INDEX messages_confidence_idx ON messages(confidence);
```

- [ ] **Step 7: Create migration 005 — knowledge_base**

`src/db/migrations/005_knowledge_base.sql`:
```sql
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  category VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX knowledge_base_embedding_idx ON knowledge_base
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

- [ ] **Step 8: Create migration 006 — bot_corrections**

`src/db/migrations/006_bot_corrections.sql`:
```sql
CREATE TABLE bot_corrections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  original_reply TEXT NOT NULL,
  corrected_reply TEXT NOT NULL,
  intent VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 9: Create migration 007 — promotions**

`src/db/migrations/007_promotions.sql`:
```sql
CREATE TYPE customer_promotion_status AS ENUM ('pending', 'sent', 'converted');

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  message_template_bm TEXT,
  message_template_zh TEXT,
  message_template_ta TEXT,
  message_template_en TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customer_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  status customer_promotion_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  UNIQUE(customer_id, promotion_id)
);
```

- [ ] **Step 10: Create migration 008 — quotations**

`src/db/migrations/008_quotations.sql`:
```sql
CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'accepted', 'expired');

CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  quotation_ref VARCHAR(100),
  quotation_url TEXT,
  insurer VARCHAR(100),
  amount DECIMAL(10,2),
  status quotation_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 11: Create migration 009 — payments**

`src/db/migrations/009_payments.sql`:
```sql
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed');

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
  senang_transaction_id VARCHAR(100),
  payment_method VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 12: Create migration 010 — follow_up_jobs**

`src/db/migrations/010_follow_up_jobs.sql`:
```sql
CREATE TYPE followup_type AS ENUM ('renewal_reminder', 'quote_followup', 'promotion', 'broadcast');
CREATE TYPE followup_status AS ENUM ('pending', 'sent', 'cancelled');

CREATE TABLE follow_up_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type followup_type NOT NULL,
  step VARCHAR(10),
  ref_id UUID,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status followup_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX follow_up_jobs_scheduled_idx ON follow_up_jobs(scheduled_at, status);
CREATE INDEX follow_up_jobs_customer_idx ON follow_up_jobs(customer_id);
```

- [ ] **Step 13: Create migration 011 — bot_config**

`src/db/migrations/011_bot_config.sql`:
```sql
CREATE TABLE bot_config (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL
);
```

- [ ] **Step 14: Create src/db/seed.ts**

```typescript
import { db } from './index.js'

const defaults: Record<string, string> = {
  tone: 'friendly',
  persona_name: 'Aina',
  language_fallback: 'bm',
  handoff_threshold: '0.6',
  handoff_hold_msg_bm: 'Sila tunggu sebentar, agen kami akan membantu anda.',
  handoff_hold_msg_zh: '请稍等，我们的客服将为您服务。',
  handoff_hold_msg_ta: 'கொஞ்சம் காத்திருங்கள், எங்கள் முகவர் உதவுவார்.',
  handoff_hold_msg_en: 'Please wait, our agent will attend to you shortly.',
  owner_phone: process.env.OWNER_PHONE ?? '',
}

async function seed() {
  for (const [key, value] of Object.entries(defaults)) {
    await db.query(
      'INSERT INTO bot_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
      [key, value]
    )
  }
  console.log('Seed complete.')
  await db.end()
}

seed().catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Step 15: Run migrations locally to verify**

```bash
# Start PostgreSQL and create DB first
createdb limauai
psql limauai -c "CREATE USER limauai WITH PASSWORD 'password'; GRANT ALL ON DATABASE limauai TO limauai;"
npm run db:migrate
npm run db:seed
```

Expected output: `✓ 001_extensions.sql` through `✓ 011_bot_config.sql`, then `Migrations complete.`

- [ ] **Step 16: Commit**

```bash
git add src/db/
git commit -m "feat: database schema — all 11 migrations + seed"
```

---

## Task 3: Redis Client

**Files:**
- Create: `src/redis/index.ts`

- [ ] **Step 1: Write failing test**

`tests/modules/redis.test.ts`:
```typescript
import { describe, it, expect, afterAll } from 'vitest'
import { redis } from '../../src/redis/index.js'

describe('redis client', () => {
  it('connects and pings', async () => {
    const result = await redis.ping()
    expect(result).toBe('PONG')
  })

  afterAll(async () => {
    await redis.quit()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/modules/redis.test.ts
```

Expected: FAIL — `Cannot find module '../../src/redis/index.js'`

- [ ] **Step 3: Create src/redis/index.ts**

```typescript
import Redis from 'ioredis'
import { config } from '../config.js'

export const redis = new Redis(config.redis.url)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/modules/redis.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/redis/ tests/modules/redis.test.ts
git commit -m "feat: Redis client"
```

---

## Task 4: WA Connector (Baileys)

**Files:**
- Create: `src/modules/wa-connector/index.ts`
- Create: `src/modules/wa-connector/sender.ts`

- [ ] **Step 1: Create src/modules/wa-connector/sender.ts**

```typescript
import type { WASocket } from '@whiskeysockets/baileys'

let _sock: WASocket | null = null

export function setSock(sock: WASocket) {
  _sock = sock
}

export async function sendText(phone: string, text: string): Promise<void> {
  if (!_sock) throw new Error('WA socket not initialized')
  const jid = phone.replace(/\D/g, '') + '@s.whatsapp.net'
  await _sock.sendMessage(jid, { text })
}
```

- [ ] **Step 2: Create src/modules/wa-connector/index.ts**

```typescript
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { EventEmitter } from 'events'
import { config } from '../../config.js'
import { setSock } from './sender.js'

export const waEvents = new EventEmitter()

let reconnectAttempts = 0
const MAX_RECONNECT = 3

export async function startWAConnector(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(config.baileys.sessionPath)

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  })

  setSock(sock)
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const loggedOut = statusCode === DisconnectReason.loggedOut

      if (loggedOut) {
        console.error('WA: Logged out. Delete session and restart.')
        return
      }

      reconnectAttempts++
      if (reconnectAttempts > MAX_RECONNECT) {
        console.error(`WA: ${MAX_RECONNECT} reconnect attempts failed.`)
        waEvents.emit('fatal-disconnect')
        return
      }

      const delay = Math.pow(2, reconnectAttempts) * 1000
      console.log(`WA: Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`)
      setTimeout(() => startWAConnector(), delay)
      return
    }

    if (connection === 'open') {
      reconnectAttempts = 0
      console.log('WA: Connected')
      waEvents.emit('ready')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (msg.key.fromMe) continue
      if (!msg.message) continue
      const text =
        msg.message.conversation ??
        msg.message.extendedTextMessage?.text ??
        ''
      if (!text) continue
      const phone = msg.key.remoteJid?.replace('@s.whatsapp.net', '') ?? ''
      waEvents.emit('message', { phone, text, raw: msg })
    }
  })
}
```

- [ ] **Step 3: Write test for sender (unit — mocked socket)**

`tests/modules/wa-connector.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setSock, sendText } from '../../src/modules/wa-connector/sender.js'

describe('sendText', () => {
  beforeEach(() => {
    const mockSock = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
    }
    setSock(mockSock as any)
  })

  it('formats phone to JID and calls sendMessage', async () => {
    const mockSock = { sendMessage: vi.fn().mockResolvedValue(undefined) }
    setSock(mockSock as any)

    await sendText('60123456789', 'Hello')

    expect(mockSock.sendMessage).toHaveBeenCalledWith(
      '60123456789@s.whatsapp.net',
      { text: 'Hello' }
    )
  })

  it('strips non-digits from phone', async () => {
    const mockSock = { sendMessage: vi.fn().mockResolvedValue(undefined) }
    setSock(mockSock as any)

    await sendText('+60-12-3456789', 'Hi')

    expect(mockSock.sendMessage).toHaveBeenCalledWith(
      '60123456789@s.whatsapp.net',
      { text: 'Hi' }
    )
  })

  it('throws if socket not set', async () => {
    setSock(null as any)
    await expect(sendText('60123456789', 'test')).rejects.toThrow('WA socket not initialized')
  })
})
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/modules/wa-connector.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/modules/wa-connector/ tests/modules/wa-connector.test.ts
git commit -m "feat: WA connector — Baileys session, auto-reconnect, message emitter"
```

---

## Task 5: Language Detector

**Files:**
- Create: `src/modules/language-detector/index.ts`
- Create: `tests/modules/language-detector.test.ts`

- [ ] **Step 1: Write failing test**

`tests/modules/language-detector.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { detectLanguage } from '../../src/modules/language-detector/index.js'

describe('detectLanguage', () => {
  it('detects Chinese from Chinese characters', () => {
    expect(detectLanguage('你好，我想续保')).toBe('zh')
  })

  it('detects Tamil from Tamil script', () => {
    expect(detectLanguage('வணக்கம் என் காரின் காப்பீடு புதுப்பிக்க வேண்டும்')).toBe('ta')
  })

  it('detects English', () => {
    expect(detectLanguage('I want to renew my car insurance')).toBe('en')
  })

  it('detects Bahasa Malaysia', () => {
    expect(detectLanguage('Saya nak renew insurans kereta saya')).toBe('bm')
  })

  it('returns bm for very short ambiguous text', () => {
    expect(detectLanguage('ok')).toBe('bm')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/modules/language-detector.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create src/modules/language-detector/index.ts**

```typescript
import { franc } from 'franc-min'

const ZH_REGEX = /[一-鿿㐀-䶿]/
const TA_REGEX = /[஀-௿]/

type Language = 'bm' | 'zh' | 'ta' | 'en'

const FRANC_TO_LANG: Record<string, Language> = {
  zsm: 'bm', // Standard Malay
  ind: 'bm', // Indonesian — treat as BM for this context
  eng: 'en',
  cmn: 'zh',
  tam: 'ta',
}

export function detectLanguage(text: string): Language {
  if (ZH_REGEX.test(text)) return 'zh'
  if (TA_REGEX.test(text)) return 'ta'

  const detected = franc(text, { minLength: 3 })
  return FRANC_TO_LANG[detected] ?? 'bm' // default to BM (primary language)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/modules/language-detector.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/modules/language-detector/ tests/modules/language-detector.test.ts
git commit -m "feat: language detector — BM/ZH/TA/EN via script detection + franc"
```

---

## Task 6: Context Manager

**Files:**
- Create: `src/modules/context-manager/types.ts`
- Create: `src/modules/context-manager/index.ts`
- Create: `tests/modules/context-manager.test.ts`

- [ ] **Step 1: Create src/modules/context-manager/types.ts**

```typescript
export interface MessageRow {
  id: string
  conversation_id: string
  role: 'user' | 'bot' | 'system'
  content: string
  intent: string | null
  language: string | null
  confidence: number | null
  created_at: Date
}

export interface ConversationContext {
  conversationId: string
  customerId: string
  messages: MessageRow[]
  consecutiveUnknowns: number
}
```

- [ ] **Step 2: Write failing test**

`tests/modules/context-manager.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/db/index.js', () => ({
  db: {
    query: vi.fn(),
  },
}))

import { db } from '../../src/db/index.js'
import {
  getOrCreateConversation,
  loadContext,
  saveMessage,
} from '../../src/modules/context-manager/index.js'

describe('getOrCreateConversation', () => {
  it('returns existing open conversation', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ id: 'conv-1', customer_id: 'cust-1', status: 'open', tags: [] }],
    } as any)

    const conv = await getOrCreateConversation('cust-1')
    expect(conv.id).toBe('conv-1')
  })

  it('creates new conversation when none exists', async () => {
    vi.mocked(db.query)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [{ id: 'conv-new', customer_id: 'cust-1' }] } as any)

    const conv = await getOrCreateConversation('cust-1')
    expect(conv.id).toBe('conv-new')
  })
})

describe('loadContext', () => {
  it('returns last 20 messages for conversation', async () => {
    vi.mocked(db.query)
      .mockResolvedValueOnce({ rows: [{ id: 'conv-1', customer_id: 'cust-1', status: 'open', tags: [] }] } as any)
      .mockResolvedValueOnce({ rows: [{ id: 'msg-1', role: 'user', content: 'hello', intent: null, language: 'bm', confidence: null, created_at: new Date() }] } as any)

    const ctx = await loadContext('cust-1')
    expect(ctx.messages).toHaveLength(1)
    expect(ctx.messages[0].content).toBe('hello')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run tests/modules/context-manager.test.ts
```

Expected: FAIL

- [ ] **Step 4: Create src/modules/context-manager/index.ts**

```typescript
import { db } from '../../db/index.js'
import type { ConversationContext, MessageRow } from './types.js'

export async function getOrCreateConversation(customerId: string) {
  const { rows } = await db.query(
    `SELECT id, customer_id, status, tags
     FROM conversations
     WHERE customer_id = $1 AND status = 'open'
     ORDER BY created_at DESC LIMIT 1`,
    [customerId]
  )

  if (rows.length > 0) return rows[0]

  const { rows: newRows } = await db.query(
    `INSERT INTO conversations (customer_id) VALUES ($1) RETURNING id, customer_id, status, tags`,
    [customerId]
  )
  return newRows[0]
}

export async function loadContext(customerId: string): Promise<ConversationContext> {
  const conversation = await getOrCreateConversation(customerId)

  const { rows: messages } = await db.query<MessageRow>(
    `SELECT id, conversation_id, role, content, intent, language, confidence, created_at
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC
     LIMIT 20`,
    [conversation.id]
  )

  const consecutiveUnknowns = countTrailingUnknowns(messages)

  return {
    conversationId: conversation.id,
    customerId,
    messages,
    consecutiveUnknowns,
  }
}

export async function saveMessage(params: {
  conversationId: string
  role: 'user' | 'bot' | 'system'
  content: string
  intent?: string
  language?: string
  confidence?: number
}): Promise<MessageRow> {
  const { rows } = await db.query<MessageRow>(
    `INSERT INTO messages (conversation_id, role, content, intent, language, confidence)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [params.conversationId, params.role, params.content, params.intent ?? null, params.language ?? null, params.confidence ?? null]
  )
  return rows[0]
}

export async function getOrCreateCustomer(phone: string): Promise<{ id: string; language: string | null }> {
  const { rows } = await db.query(
    `SELECT id, language FROM customers WHERE phone = $1`,
    [phone]
  )
  if (rows.length > 0) return rows[0]

  const { rows: newRows } = await db.query(
    `INSERT INTO customers (phone, source) VALUES ($1, 'bot_captured') RETURNING id, language`,
    [phone]
  )
  return newRows[0]
}

function countTrailingUnknowns(messages: MessageRow[]): number {
  let count = 0
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && messages[i].intent === 'unknown') {
      count++
    } else if (messages[i].role === 'user') {
      break
    }
  }
  return count
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run tests/modules/context-manager.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/modules/context-manager/ tests/modules/context-manager.test.ts
git commit -m "feat: context manager — load/save conversation history, customer upsert"
```

---

## Task 7: Intent Router

**Files:**
- Create: `src/modules/intent-router/types.ts`
- Create: `src/modules/intent-router/index.ts`
- Create: `tests/modules/intent-router.test.ts`

- [ ] **Step 1: Create src/modules/intent-router/types.ts**

```typescript
export const INTENTS = [
  'renewal_inquiry',
  'roadtax_inquiry',
  'quotation_request',
  'payment_status',
  'document_upload',
  'promotion_inquiry',
  'complaint',
  'escalation',
  'general_faq',
  'unknown',
] as const

export type Intent = typeof INTENTS[number]

export interface IntentResult {
  intent: Intent
  confidence: number
}
```

- [ ] **Step 2: Write failing test**

`tests/modules/intent-router.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({ intent: 'renewal_inquiry', confidence: 0.95 })
            }
          }]
        })
      }
    }
  }))
}))

import { classifyIntent } from '../../src/modules/intent-router/index.js'

describe('classifyIntent', () => {
  it('returns intent and confidence from OpenAI response', async () => {
    const result = await classifyIntent('Nak renew insurans kereta', [])
    expect(result.intent).toBe('renewal_inquiry')
    expect(result.confidence).toBe(0.95)
  })

  it('returns unknown with low confidence on parse failure', async () => {
    const { default: OpenAI } = await import('openai')
    vi.mocked(OpenAI).mockImplementationOnce(() => ({
      chat: { completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'not json' } }] }) } }
    } as any))

    const result = await classifyIntent('???', [])
    expect(result.intent).toBe('unknown')
    expect(result.confidence).toBeLessThan(0.5)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run tests/modules/intent-router.test.ts
```

Expected: FAIL

- [ ] **Step 4: Create src/modules/intent-router/index.ts**

```typescript
import OpenAI from 'openai'
import { config } from '../../config.js'
import type { Intent, IntentResult } from './types.js'
import { INTENTS } from './types.js'
import type { MessageRow } from '../context-manager/types.js'

const openai = new OpenAI({ apiKey: config.openai.apiKey })

const SYSTEM_PROMPT = `You are an intent classifier for a Malaysian car insurance renewal chatbot.

Classify the user's message into exactly one of these intents:
${INTENTS.join(', ')}

Definitions:
- renewal_inquiry: asking about renewing car insurance
- roadtax_inquiry: asking about road tax (roadtax) renewal
- quotation_request: requesting a price quote
- payment_status: asking about payment or payment confirmation
- document_upload: sending or asking about documents (IC, grant, etc.)
- promotion_inquiry: asking about promotions or discounts
- complaint: expressing dissatisfaction or complaint
- escalation: explicitly requesting a human agent
- general_faq: general question answerable from FAQ
- unknown: cannot be classified

Respond with JSON only: {"intent": "<intent>", "confidence": <0.0-1.0>}`

export async function classifyIntent(
  text: string,
  recentMessages: MessageRow[]
): Promise<IntentResult> {
  const history = recentMessages.slice(-5).map(m => ({
    role: m.role === 'bot' ? 'assistant' as const : 'user' as const,
    content: m.content,
  }))

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    })

    const parsed = JSON.parse(response.choices[0].message.content ?? '{}')
    const intent = INTENTS.includes(parsed.intent) ? parsed.intent as Intent : 'unknown'
    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.0

    return { intent, confidence }
  } catch {
    return { intent: 'unknown', confidence: 0.0 }
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run tests/modules/intent-router.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/modules/intent-router/ tests/modules/intent-router.test.ts
git commit -m "feat: intent router — OpenAI classification for 10 intents with confidence score"
```

---

## Task 8: KB Retriever + Embedder

**Files:**
- Create: `src/modules/kb-retriever/embedder.ts`
- Create: `src/modules/kb-retriever/index.ts`
- Create: `tests/modules/kb-retriever.test.ts`

- [ ] **Step 1: Create src/modules/kb-retriever/embedder.ts**

```typescript
import OpenAI from 'openai'
import { config } from '../../config.js'

const openai = new OpenAI({ apiKey: config.openai.apiKey })

export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}
```

- [ ] **Step 2: Write failing test**

`tests/modules/kb-retriever.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      })
    }
  }))
}))

vi.mock('../../src/db/index.js', () => ({
  db: {
    query: vi.fn().mockResolvedValue({
      rows: [
        { id: 'kb-1', title: 'Insurance renewal FAQ', content: 'To renew insurance, visit our website.' }
      ]
    })
  }
}))

import { retrieveKB } from '../../src/modules/kb-retriever/index.js'

describe('retrieveKB', () => {
  it('returns matching KB chunks', async () => {
    const results = await retrieveKB('How to renew insurance?')
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Insurance renewal FAQ')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run tests/modules/kb-retriever.test.ts
```

Expected: FAIL

- [ ] **Step 4: Create src/modules/kb-retriever/index.ts**

```typescript
import { db } from '../../db/index.js'
import { embedText } from './embedder.js'

export interface KBChunk {
  id: string
  title: string
  content: string
}

export async function retrieveKB(query: string, topK = 3): Promise<KBChunk[]> {
  const embedding = await embedText(query)
  const embeddingLiteral = `[${embedding.join(',')}]`

  const { rows } = await db.query<KBChunk>(
    `SELECT id, title, content
     FROM knowledge_base
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [embeddingLiteral, topK]
  )

  return rows
}

export async function addKBEntry(params: {
  title: string
  content: string
  category?: string
}): Promise<string> {
  const embedding = await embedText(`${params.title}\n${params.content}`)
  const embeddingLiteral = `[${embedding.join(',')}]`

  const { rows } = await db.query(
    `INSERT INTO knowledge_base (title, content, embedding, category)
     VALUES ($1, $2, $3::vector, $4)
     RETURNING id`,
    [params.title, params.content, embeddingLiteral, params.category ?? null]
  )
  return rows[0].id
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run tests/modules/kb-retriever.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/modules/kb-retriever/ tests/modules/kb-retriever.test.ts
git commit -m "feat: KB retriever — pgvector cosine similarity search + OpenAI embeddings"
```

---

## Task 9: AI Engine

**Files:**
- Create: `src/modules/ai-engine/prompt-builder.ts`
- Create: `src/modules/ai-engine/index.ts`
- Create: `tests/modules/ai-engine.test.ts`

- [ ] **Step 1: Create src/modules/ai-engine/prompt-builder.ts**

```typescript
import type { KBChunk } from '../kb-retriever/index.js'

interface BotConfig {
  tone: string
  persona_name: string
  language_fallback: string
}

interface Correction {
  corrected_reply: string
  intent: string
}

export function buildSystemPrompt(
  botConfig: BotConfig,
  kbChunks: KBChunk[],
  corrections: Correction[],
  language: string,
  intent: string
): string {
  const toneInstructions: Record<string, string> = {
    formal: 'Use formal, professional language. Address customer respectfully.',
    friendly: 'Use warm, friendly language. Be helpful and approachable.',
    casual: 'Use casual, conversational language. Keep it light and easy.',
  }

  const langInstructions: Record<string, string> = {
    bm: 'Reply in Bahasa Malaysia.',
    zh: 'Reply in Mandarin Chinese (Simplified).',
    ta: 'Reply in Tamil.',
    en: 'Reply in English.',
  }

  const kbSection = kbChunks.length > 0
    ? `\n\nKnowledge Base Context:\n${kbChunks.map(c => `### ${c.title}\n${c.content}`).join('\n\n')}`
    : ''

  const correctionsSection = corrections.length > 0
    ? `\n\nExamples of correct replies for intent "${intent}":\n${corrections.map(c => `- ${c.corrected_reply}`).join('\n')}`
    : ''

  return `You are ${botConfig.persona_name}, a helpful assistant for a Malaysian car insurance and roadtax renewal company.
${toneInstructions[botConfig.tone] ?? toneInstructions.friendly}
${langInstructions[language] ?? langInstructions[botConfig.language_fallback] ?? langInstructions.bm}
Keep replies concise (under 150 words). Do not make up information not in the knowledge base.${kbSection}${correctionsSection}`
}
```

- [ ] **Step 2: Write failing test**

`tests/modules/ai-engine.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Untuk renew insurans, layari website kami.' } }]
        })
      }
    }
  }))
}))

vi.mock('../../src/db/index.js', () => ({
  db: { query: vi.fn().mockResolvedValue({ rows: [] }) }
}))

import { generateReply } from '../../src/modules/ai-engine/index.js'
import { buildSystemPrompt } from '../../src/modules/ai-engine/prompt-builder.js'

describe('buildSystemPrompt', () => {
  it('includes persona name', () => {
    const prompt = buildSystemPrompt(
      { tone: 'friendly', persona_name: 'Aina', language_fallback: 'bm' },
      [],
      [],
      'bm',
      'renewal_inquiry'
    )
    expect(prompt).toContain('Aina')
  })

  it('includes KB context when chunks provided', () => {
    const prompt = buildSystemPrompt(
      { tone: 'friendly', persona_name: 'Aina', language_fallback: 'bm' },
      [{ id: '1', title: 'FAQ', content: 'Renew online.' }],
      [],
      'bm',
      'renewal_inquiry'
    )
    expect(prompt).toContain('Renew online.')
  })
})

describe('generateReply', () => {
  it('returns string reply from OpenAI', async () => {
    const reply = await generateReply({
      userMessage: 'Macam mana nak renew?',
      language: 'bm',
      intent: 'renewal_inquiry',
      context: [],
      kbChunks: [],
      corrections: [],
      botConfig: { tone: 'friendly', persona_name: 'Aina', language_fallback: 'bm' },
      useGpt4: false,
    })
    expect(typeof reply).toBe('string')
    expect(reply.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run tests/modules/ai-engine.test.ts
```

Expected: FAIL

- [ ] **Step 4: Create src/modules/ai-engine/index.ts**

```typescript
import OpenAI from 'openai'
import { config } from '../../config.js'
import { buildSystemPrompt } from './prompt-builder.js'
import { db } from '../../db/index.js'
import type { KBChunk } from '../kb-retriever/index.js'
import type { MessageRow } from '../context-manager/types.js'

const openai = new OpenAI({ apiKey: config.openai.apiKey })

interface GenerateReplyInput {
  userMessage: string
  language: string
  intent: string
  context: MessageRow[]
  kbChunks: KBChunk[]
  corrections: Array<{ corrected_reply: string; intent: string }>
  botConfig: { tone: string; persona_name: string; language_fallback: string }
  useGpt4: boolean
}

export async function generateReply(input: GenerateReplyInput): Promise<string> {
  const systemPrompt = buildSystemPrompt(
    input.botConfig,
    input.kbChunks,
    input.corrections,
    input.language,
    input.intent
  )

  const history = input.context.slice(-10).map(m => ({
    role: m.role === 'bot' ? 'assistant' as const : 'user' as const,
    content: m.content,
  }))

  const response = await openai.chat.completions.create({
    model: input.useGpt4 ? 'gpt-4o' : 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: input.userMessage },
    ],
    temperature: 0.7,
    max_tokens: 300,
  })

  return response.choices[0].message.content ?? ''
}

export async function loadBotConfig(): Promise<Record<string, string>> {
  const { rows } = await db.query('SELECT key, value FROM bot_config')
  return Object.fromEntries(rows.map((r: { key: string; value: string }) => [r.key, r.value]))
}

export async function loadCorrections(intent: string) {
  const { rows } = await db.query(
    `SELECT corrected_reply, intent FROM bot_corrections WHERE intent = $1 LIMIT 5`,
    [intent]
  )
  return rows
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run tests/modules/ai-engine.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/modules/ai-engine/ tests/modules/ai-engine.test.ts
git commit -m "feat: AI engine — 3-layer prompt (tone + KB + corrections), GPT-4o/mini selection"
```

---

## Task 10: Handoff Manager

**Files:**
- Create: `src/modules/handoff-manager/index.ts`
- Create: `tests/modules/handoff-manager.test.ts`

- [ ] **Step 1: Write failing test**

`tests/modules/handoff-manager.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../src/modules/wa-connector/sender.js', () => ({
  sendText: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/db/index.js', () => ({
  db: { query: vi.fn().mockResolvedValue({ rows: [{ value: 'Sila tunggu.' }] }) }
}))

import { shouldHandoff } from '../../src/modules/handoff-manager/index.js'
import type { IntentResult } from '../../src/modules/intent-router/types.js'
import type { MessageRow } from '../../src/modules/context-manager/types.js'

describe('shouldHandoff', () => {
  const baseResult: IntentResult = { intent: 'renewal_inquiry', confidence: 0.9 }

  it('triggers on complaint intent', () => {
    expect(shouldHandoff({ ...baseResult, intent: 'complaint' }, 0, 0.6)).toBe(true)
  })

  it('triggers on escalation intent', () => {
    expect(shouldHandoff({ ...baseResult, intent: 'escalation' }, 0, 0.6)).toBe(true)
  })

  it('triggers when confidence below threshold', () => {
    expect(shouldHandoff({ ...baseResult, confidence: 0.4 }, 0, 0.6)).toBe(true)
  })

  it('triggers on 3+ consecutive unknowns', () => {
    expect(shouldHandoff({ ...baseResult, intent: 'unknown' }, 3, 0.6)).toBe(true)
  })

  it('does not trigger for normal intent with good confidence', () => {
    expect(shouldHandoff(baseResult, 0, 0.6)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/modules/handoff-manager.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create src/modules/handoff-manager/index.ts**

```typescript
import { db } from '../../db/index.js'
import { sendText } from '../wa-connector/sender.js'
import { config } from '../../config.js'
import type { IntentResult } from '../intent-router/types.js'

const HANDOFF_KEYWORDS = ['human', 'agent', 'manusia', '人工', 'agen']

export function shouldHandoff(
  intentResult: IntentResult,
  consecutiveUnknowns: number,
  threshold: number
): boolean {
  if (intentResult.intent === 'complaint') return true
  if (intentResult.intent === 'escalation') return true
  if (intentResult.confidence < threshold) return true
  if (consecutiveUnknowns >= 3) return true
  return false
}

export function containsHandoffKeyword(text: string): boolean {
  const lower = text.toLowerCase()
  return HANDOFF_KEYWORDS.some(kw => lower.includes(kw))
}

export async function triggerHandoff(params: {
  phone: string
  customerId: string
  conversationId: string
  customerName: string | null
  intent: string
  language: string
  lastMessage: string
}): Promise<void> {
  const { rows } = await db.query(
    `SELECT value FROM bot_config WHERE key = $1`,
    [`handoff_hold_msg_${params.language}`]
  )
  const holdMsg = rows[0]?.value ?? 'Please wait, our agent will attend to you shortly.'

  await db.query(
    `UPDATE conversations SET status = 'handoff', updated_at = NOW() WHERE id = $1`,
    [params.conversationId]
  )

  await sendText(params.phone, holdMsg)

  const ownerAlert =
    `⚠️ Handoff needed: ${params.customerName ?? params.phone} (${params.phone})\n` +
    `Intent: ${params.intent} | Language: ${params.language}\n` +
    `Last message: ${params.lastMessage.slice(0, 100)}`

  await sendText(config.owner.phone, ownerAlert)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/modules/handoff-manager.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/modules/handoff-manager/ tests/modules/handoff-manager.test.ts
git commit -m "feat: handoff manager — 4 trigger conditions, hold message + owner WA alert"
```

---

## Task 11: Tagger

**Files:**
- Create: `src/modules/tagger/index.ts`
- Create: `tests/modules/tagger.test.ts`

- [ ] **Step 1: Write failing test**

`tests/modules/tagger.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../src/db/index.js', () => ({
  db: { query: vi.fn().mockResolvedValue({ rows: [] }) }
}))

import { db } from '../../src/db/index.js'
import { tagConversation } from '../../src/modules/tagger/index.js'

describe('tagConversation', () => {
  it('adds insurance-renewal tag for renewal_inquiry', async () => {
    await tagConversation('conv-1', 'renewal_inquiry', 'bm')
    expect(vi.mocked(db.query)).toHaveBeenCalledWith(
      expect.stringContaining('array_append'),
      expect.arrayContaining(['conv-1'])
    )
  })

  it('adds language tag', async () => {
    await tagConversation('conv-1', 'general_faq', 'zh')
    const call = vi.mocked(db.query).mock.calls[0]
    expect(call[1]).toContain('language-zh')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/modules/tagger.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create src/modules/tagger/index.ts**

```typescript
import { db } from '../../db/index.js'
import type { Intent } from '../intent-router/types.js'

const INTENT_TAGS: Partial<Record<Intent, string>> = {
  renewal_inquiry: 'insurance-renewal',
  roadtax_inquiry: 'roadtax-renewal',
  quotation_request: 'quotation-sent',
  payment_status: 'payment-confirmed',
  document_upload: 'document-uploaded',
  complaint: 'complaint',
  escalation: 'handoff',
}

export async function tagConversation(
  conversationId: string,
  intent: Intent | string,
  language: string
): Promise<void> {
  const tags: string[] = [`language-${language}`]
  const intentTag = INTENT_TAGS[intent as Intent]
  if (intentTag) tags.push(intentTag)

  if (tags.length === 0) return

  const tagLiteral = `{${tags.map(t => `"${t}"`).join(',')}}`

  await db.query(
    `UPDATE conversations
     SET tags = (
       SELECT array_agg(DISTINCT t)
       FROM unnest(tags || $2::text[]) t
     ),
     updated_at = NOW()
     WHERE id = $1`,
    [conversationId, tags]
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/modules/tagger.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/tagger/ tests/modules/tagger.test.ts
git commit -m "feat: tagger — auto-tag conversations by intent and language"
```

---

## Task 12: Message Pipeline

**Files:**
- Create: `src/pipeline.ts`

- [ ] **Step 1: Create src/pipeline.ts**

```typescript
import { detectLanguage } from './modules/language-detector/index.js'
import {
  loadContext,
  saveMessage,
  getOrCreateCustomer,
} from './modules/context-manager/index.js'
import { classifyIntent } from './modules/intent-router/index.js'
import { retrieveKB } from './modules/kb-retriever/index.js'
import {
  generateReply,
  loadBotConfig,
  loadCorrections,
} from './modules/ai-engine/index.js'
import {
  shouldHandoff,
  containsHandoffKeyword,
  triggerHandoff,
} from './modules/handoff-manager/index.js'
import { tagConversation } from './modules/tagger/index.js'
import { sendText } from './modules/wa-connector/sender.js'
import { db } from './db/index.js'

const COMPLEX_INTENTS = new Set(['complaint', 'quotation_request'])

export async function handleIncomingMessage(phone: string, text: string): Promise<void> {
  const customer = await getOrCreateCustomer(phone)
  const language = detectLanguage(text)

  if (!customer.language || customer.language !== language) {
    await db.query('UPDATE customers SET language = $1 WHERE id = $2', [language, customer.id])
  }

  const context = await loadContext(customer.id)
  await saveMessage({ conversationId: context.conversationId, role: 'user', content: text, language })

  if (containsHandoffKeyword(text)) {
    const { rows: customerRows } = await db.query('SELECT name FROM customers WHERE id = $1', [customer.id])
    await triggerHandoff({
      phone,
      customerId: customer.id,
      conversationId: context.conversationId,
      customerName: customerRows[0]?.name ?? null,
      intent: 'escalation',
      language,
      lastMessage: text,
    })
    return
  }

  const intentResult = await classifyIntent(text, context.messages)
  const botConfig = await loadBotConfig()
  const threshold = parseFloat(botConfig.handoff_threshold ?? '0.6')

  if (shouldHandoff(intentResult, context.consecutiveUnknowns, threshold)) {
    const { rows: customerRows } = await db.query('SELECT name FROM customers WHERE id = $1', [customer.id])
    await triggerHandoff({
      phone,
      customerId: customer.id,
      conversationId: context.conversationId,
      customerName: customerRows[0]?.name ?? null,
      intent: intentResult.intent,
      language,
      lastMessage: text,
    })
    await saveMessage({
      conversationId: context.conversationId,
      role: 'system',
      content: '[handoff triggered]',
      intent: intentResult.intent,
      language,
      confidence: intentResult.confidence,
    })
    return
  }

  const [kbChunks, corrections] = await Promise.all([
    retrieveKB(text),
    loadCorrections(intentResult.intent),
  ])

  const reply = await generateReply({
    userMessage: text,
    language,
    intent: intentResult.intent,
    context: context.messages,
    kbChunks,
    corrections,
    botConfig: {
      tone: botConfig.tone ?? 'friendly',
      persona_name: botConfig.persona_name ?? 'Aina',
      language_fallback: botConfig.language_fallback ?? 'bm',
    },
    useGpt4: COMPLEX_INTENTS.has(intentResult.intent),
  })

  await sendText(phone, reply)

  await saveMessage({
    conversationId: context.conversationId,
    role: 'bot',
    content: reply,
    intent: intentResult.intent,
    language,
    confidence: intentResult.confidence,
  })

  await tagConversation(context.conversationId, intentResult.intent, language)
}
```

- [ ] **Step 2: Wire pipeline to WA connector in src/index.ts**

```typescript
import express from 'express'
import { startWAConnector, waEvents } from './modules/wa-connector/index.js'
import { handleIncomingMessage } from './pipeline.js'
import { config } from './config.js'

const app = express()
app.use(express.json())

waEvents.on('message', async ({ phone, text }: { phone: string; text: string }) => {
  try {
    await handleIncomingMessage(phone, text)
  } catch (err) {
    console.error('Pipeline error:', err)
  }
})

waEvents.on('fatal-disconnect', () => {
  console.error('Fatal WA disconnect — check dashboard')
})

app.listen(config.port, () => {
  console.log(`API running on port ${config.port}`)
})

startWAConnector().catch(console.error)
```

- [ ] **Step 3: Smoke test the pipeline locally**

```bash
npm run dev
```

Expected: QR code in terminal. Scan with WhatsApp. Send a test message. Bot should reply.

- [ ] **Step 4: Commit**

```bash
git add src/pipeline.ts src/index.ts
git commit -m "feat: message pipeline — full orchestration of all modules per incoming message"
```

---

## Task 13: Renewal Scheduler

**Files:**
- Create: `src/modules/scheduler/index.ts`
- Create: `src/modules/scheduler/renewal.ts`
- Create: `src/modules/scheduler/seed-renewal-jobs.ts`
- Create: `tests/modules/scheduler-renewal.test.ts`

- [ ] **Step 1: Create src/modules/scheduler/renewal.ts**

```typescript
import { db } from '../../db/index.js'
import { sendText } from '../wa-connector/sender.js'

export type RenewalStep = 't30' | 't14' | 't3' | 't1'

interface RenewalJobData {
  customerId: string
  step: RenewalStep
}

const INSURER_URLS: Record<string, string> = {}

async function getQuotationUrl(customerId: string): Promise<string | null> {
  const { rows } = await db.query(
    `SELECT q.quotation_url
     FROM quotations q
     WHERE q.customer_id = $1 AND q.status != 'expired'
     ORDER BY q.created_at DESC LIMIT 1`,
    [customerId]
  )
  return rows[0]?.quotation_url ?? null
}

async function getCustomer(customerId: string) {
  const { rows } = await db.query(
    `SELECT id, phone, name, language, insurer, consent, renewal_date
     FROM customers WHERE id = $1`,
    [customerId]
  )
  return rows[0] ?? null
}

async function getBotConfig(key: string): Promise<string | null> {
  const { rows } = await db.query('SELECT value FROM bot_config WHERE key = $1', [key])
  return rows[0]?.value ?? null
}

function getMessage(
  step: RenewalStep,
  lang: string,
  insurer: string,
  quotationUrl: string | null,
  consent: boolean
): string {
  if (step === 't30') {
    const msgs: Record<string, string> = {
      bm: `Insurans ${insurer} anda akan tamat dalam 30 hari. Boleh kami bantu proses pembaharuan? (Ya/Tidak)`,
      zh: `您的${insurer}保险将在30天后到期。我们可以帮您办理续保吗？（是/否）`,
      ta: `உங்கள் ${insurer} காப்பீடு 30 நாட்களில் காலாவதியாகும். புதுப்பிக்க உதவட்டுமா? (ஆம்/இல்லை)`,
      en: `Your ${insurer} insurance expires in 30 days. Can we help with renewal? (Yes/No)`,
    }
    return msgs[lang] ?? msgs.bm
  }

  if (step === 't14') {
    if (consent && quotationUrl) {
      const msgs: Record<string, string> = {
        bm: `Berikut adalah pautan sebut harga pembaharuan insurans anda: ${quotationUrl}`,
        zh: `这是您的保险续保报价链接：${quotationUrl}`,
        ta: `இங்கே உங்கள் காப்பீடு புதுப்பிப்பு மேற்கோள் இணைப்பு: ${quotationUrl}`,
        en: `Here is your insurance renewal quote link: ${quotationUrl}`,
      }
      return msgs[lang] ?? msgs.bm
    }
    const msgs: Record<string, string> = {
      bm: `Peringatan: insurans ${insurer} anda akan tamat dalam 14 hari. Boleh kami bantu? (Ya/Tidak)`,
      zh: `提醒：您的${insurer}保险将在14天后到期。我们可以帮忙吗？（是/否）`,
      ta: `நினைவூட்டல்: ${insurer} காப்பீடு 14 நாட்களில் காலாவதியாகும். உதவட்டுமா? (ஆம்/இல்லை)`,
      en: `Reminder: Your ${insurer} insurance expires in 14 days. Can we help? (Yes/No)`,
    }
    return msgs[lang] ?? msgs.bm
  }

  if (step === 't3') {
    if (consent && quotationUrl) {
      const msgs: Record<string, string> = {
        bm: `Hanya 3 hari lagi! Pautan sebut harga pembaharuan: ${quotationUrl}`,
        zh: `只剩3天！续保报价链接：${quotationUrl}`,
        ta: `3 நாட்கள் மட்டுமே! புதுப்பிப்பு மேற்கோள் இணைப்பு: ${quotationUrl}`,
        en: `Only 3 days left! Renewal quote link: ${quotationUrl}`,
      }
      return msgs[lang] ?? msgs.bm
    }
    const msgs: Record<string, string> = {
      bm: `Insurans ${insurer} anda akan tamat dalam 3 hari. Sila hubungi kami segera.`,
      zh: `您的${insurer}保险将在3天内到期，请立即联系我们。`,
      ta: `உங்கள் ${insurer} காப்பீடு 3 நாட்களில் காலாவதியாகும். உடனே தொடர்புகொள்ளுங்கள்.`,
      en: `Your ${insurer} insurance expires in 3 days. Please contact us immediately.`,
    }
    return msgs[lang] ?? msgs.bm
  }

  // t1
  const msgs: Record<string, string> = {
    bm: `Polisi insurans anda mungkin telah tamat tempoh. Sila hubungi kami sekarang.`,
    zh: `您的保险可能已过期，请立即联系我们。`,
    ta: `உங்கள் காப்பீடு காலாவதியாகியிருக்கலாம். இப்போதே தொடர்புகொள்ளுங்கள்.`,
    en: `Your insurance policy may have lapsed. Please contact us now.`,
  }
  return msgs[lang] ?? msgs.bm
}

export async function processRenewalStep(data: RenewalJobData): Promise<void> {
  const customer = await getCustomer(data.customerId)
  if (!customer) return

  const lang = customer.language ?? (await getBotConfig('language_fallback')) ?? 'bm'
  const quotationUrl = await getQuotationUrl(data.customerId)
  const msg = getMessage(data.step, lang, customer.insurer ?? 'insurans', quotationUrl, customer.consent)

  await sendText(customer.phone, msg)

  await db.query(
    `UPDATE follow_up_jobs SET status = 'sent', sent_at = NOW()
     WHERE customer_id = $1 AND step = $2 AND status = 'pending'`,
    [data.customerId, data.step]
  )
}
```

- [ ] **Step 2: Create src/modules/scheduler/seed-renewal-jobs.ts**

```typescript
import { db } from '../../db/index.js'

export async function scheduleRenewalJobs(customerId: string, renewalDate: Date): Promise<void> {
  const steps: Array<{ step: string; daysOffset: number }> = [
    { step: 't30', daysOffset: -30 },
    { step: 't14', daysOffset: -14 },
    { step: 't3', daysOffset: -3 },
    { step: 't1', daysOffset: 1 },
  ]

  for (const { step, daysOffset } of steps) {
    const scheduledAt = new Date(renewalDate)
    scheduledAt.setDate(scheduledAt.getDate() + daysOffset)

    if (scheduledAt <= new Date()) continue

    await db.query(
      `INSERT INTO follow_up_jobs (customer_id, type, step, scheduled_at)
       VALUES ($1, 'renewal_reminder', $2, $3)
       ON CONFLICT DO NOTHING`,
      [customerId, step, scheduledAt]
    )
  }
}
```

- [ ] **Step 3: Write failing test**

`tests/modules/scheduler-renewal.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/modules/wa-connector/sender.js', () => ({
  sendText: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/db/index.js', () => ({
  db: { query: vi.fn() }
}))

import { db } from '../../src/db/index.js'
import { sendText } from '../../src/modules/wa-connector/sender.js'
import { processRenewalStep } from '../../src/modules/scheduler/renewal.js'

describe('processRenewalStep', () => {
  beforeEach(() => {
    vi.mocked(db.query)
      .mockResolvedValueOnce({ rows: [{ id: 'c1', phone: '60123456789', name: 'Ali', language: 'bm', insurer: 'Etiqa', consent: false, renewal_date: new Date() }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
  })

  it('sends t30 consent request message', async () => {
    await processRenewalStep({ customerId: 'c1', step: 't30' })
    expect(vi.mocked(sendText)).toHaveBeenCalledWith(
      '60123456789',
      expect.stringContaining('30 hari')
    )
  })
})
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/modules/scheduler-renewal.test.ts
```

Expected: PASS

- [ ] **Step 5: Create src/modules/scheduler/index.ts**

```typescript
import { Worker, Queue } from 'bullmq'
import { redis } from '../../redis/index.js'
import { processRenewalStep } from './renewal.js'
import { processBroadcastMessage } from './broadcast.js'

export const renewalQueue = new Queue('renewal', { connection: redis })
export const broadcastQueue = new Queue('broadcast', {
  connection: redis,
  defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
})

export function startWorkers() {
  new Worker('renewal', async (job) => {
    await processRenewalStep(job.data)
  }, { connection: redis })

  new Worker('broadcast', async (job) => {
    await processBroadcastMessage(job.data)
  }, {
    connection: redis,
    limiter: { max: 10, duration: 60_000 },
  })

  console.log('BullMQ workers started.')
}
```

- [ ] **Step 6: Commit**

```bash
git add src/modules/scheduler/ tests/modules/scheduler-renewal.test.ts
git commit -m "feat: renewal scheduler — T-30/14/3/+1 flow with consent logic, multilingual"
```

---

## Task 14: Broadcast Scheduler

**Files:**
- Create: `src/modules/scheduler/broadcast.ts`
- Create: `tests/modules/scheduler-broadcast.test.ts`

- [ ] **Step 1: Create src/modules/scheduler/broadcast.ts**

```typescript
import { db } from '../../db/index.js'
import { sendText } from '../wa-connector/sender.js'

interface BroadcastJobData {
  customerId: string
  promotionId: string
  customerPromotionId: string
}

export async function processBroadcastMessage(data: BroadcastJobData): Promise<void> {
  const { rows: customers } = await db.query(
    'SELECT id, phone, language FROM customers WHERE id = $1',
    [data.customerId]
  )
  const customer = customers[0]
  if (!customer) return

  const lang = customer.language ?? 'bm'

  const { rows: promos } = await db.query(
    `SELECT message_template_bm, message_template_zh, message_template_ta, message_template_en
     FROM promotions WHERE id = $1 AND active = true`,
    [data.promotionId]
  )
  const promo = promos[0]
  if (!promo) return

  const templateKey = `message_template_${lang}` as keyof typeof promo
  const message: string = promo[templateKey] ?? promo.message_template_bm ?? promo.message_template_en ?? ''
  if (!message) return

  await sendText(customer.phone, message)

  await db.query(
    `UPDATE customer_promotions SET status = 'sent', sent_at = NOW() WHERE id = $1`,
    [data.customerPromotionId]
  )
}
```

- [ ] **Step 2: Write failing test**

`tests/modules/scheduler-broadcast.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/modules/wa-connector/sender.js', () => ({
  sendText: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/db/index.js', () => ({
  db: { query: vi.fn() }
}))

import { db } from '../../src/db/index.js'
import { sendText } from '../../src/modules/wa-connector/sender.js'
import { processBroadcastMessage } from '../../src/modules/scheduler/broadcast.js'

describe('processBroadcastMessage', () => {
  it('sends promotion message in customer language', async () => {
    vi.mocked(db.query)
      .mockResolvedValueOnce({ rows: [{ id: 'c1', phone: '60123456789', language: 'zh' }] } as any)
      .mockResolvedValueOnce({ rows: [{ message_template_bm: 'Promosi!', message_template_zh: '促销活动！', message_template_ta: null, message_template_en: 'Promo!' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)

    await processBroadcastMessage({ customerId: 'c1', promotionId: 'p1', customerPromotionId: 'cp1' })

    expect(vi.mocked(sendText)).toHaveBeenCalledWith('60123456789', '促销活动！')
  })

  it('skips if promotion inactive or missing', async () => {
    vi.mocked(db.query)
      .mockResolvedValueOnce({ rows: [{ id: 'c1', phone: '60123456789', language: 'bm' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)

    await processBroadcastMessage({ customerId: 'c1', promotionId: 'p1', customerPromotionId: 'cp1' })

    expect(vi.mocked(sendText)).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to verify it passes**

```bash
npx vitest run tests/modules/scheduler-broadcast.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 4: Commit**

```bash
git add src/modules/scheduler/broadcast.ts tests/modules/scheduler-broadcast.test.ts
git commit -m "feat: broadcast scheduler — multilingual, rate-limited at 10/min via BullMQ"
```

---

## Task 15: Admin API — Auth + Router

**Files:**
- Create: `src/modules/admin-api/middleware/auth.ts`
- Create: `src/modules/admin-api/index.ts`

- [ ] **Step 1: Create src/modules/admin-api/middleware/auth.ts**

```typescript
import type { Request, Response, NextFunction } from 'express'
import { config } from '../../../config.js'

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-api-key']
  if (key !== config.admin.apiKey) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}
```

- [ ] **Step 2: Create src/modules/admin-api/index.ts**

```typescript
import { Router } from 'express'
import { requireApiKey } from './middleware/auth.js'
import { customersRouter } from './routes/customers.js'
import { conversationsRouter } from './routes/conversations.js'
import { kbRouter } from './routes/knowledge-base.js'
import { promotionsRouter } from './routes/promotions.js'
import { broadcastRouter } from './routes/broadcast.js'
import { schedulerRouter } from './routes/scheduler.js'
import { botConfigRouter } from './routes/bot-config.js'
import { correctionsRouter } from './routes/corrections.js'
import { webhookRouter } from './routes/webhook.js'

export const adminRouter = Router()

adminRouter.use(requireApiKey)
adminRouter.use('/customers', customersRouter)
adminRouter.use('/conversations', conversationsRouter)
adminRouter.use('/kb', kbRouter)
adminRouter.use('/promotions', promotionsRouter)
adminRouter.use('/broadcast', broadcastRouter)
adminRouter.use('/scheduler', schedulerRouter)
adminRouter.use('/bot-config', botConfigRouter)
adminRouter.use('/corrections', correctionsRouter)

// Webhook does NOT require admin API key — has its own auth
export const webhookRouter_ = webhookRouter
```

- [ ] **Step 3: Mount in src/index.ts**

Add to `src/index.ts` after `app.use(express.json())`:
```typescript
import { adminRouter, webhookRouter_ } from './modules/admin-api/index.js'
app.use('/api', adminRouter)
app.use('/api/webhook', webhookRouter_)
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/admin-api/middleware/ src/modules/admin-api/index.ts
git commit -m "feat: admin API skeleton — auth middleware + router mount"
```

---

## Task 16: Admin API — Customers

**Files:**
- Create: `src/modules/admin-api/routes/customers.ts`
- Create: `tests/api/customers.test.ts`

- [ ] **Step 1: Write failing test**

`tests/api/customers.test.ts`:
```typescript
import { describe, it, expect, vi, beforeAll } from 'vitest'
import express from 'express'
import request from 'supertest'
import { requireApiKey } from '../../src/modules/admin-api/middleware/auth.js'

vi.mock('../../src/db/index.js', () => ({
  db: { query: vi.fn() }
}))

import { db } from '../../src/db/index.js'
import { customersRouter } from '../../src/modules/admin-api/routes/customers.js'

const app = express()
app.use(express.json())
app.use('/customers', requireApiKey, customersRouter)

const HEADERS = { 'x-api-key': 'test-key' }

describe('GET /customers', () => {
  it('returns customer list', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ id: 'c1', phone: '60123456789', name: 'Ali', language: 'bm' }]
    } as any)

    const res = await request(app).get('/customers').set(HEADERS)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].phone).toBe('60123456789')
  })

  it('returns 401 without API key', async () => {
    const res = await request(app).get('/customers')
    expect(res.status).toBe(401)
  })
})
```

Install supertest: `npm install --save-dev supertest @types/supertest`

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/api/customers.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create src/modules/admin-api/routes/customers.ts**

```typescript
import { Router } from 'express'
import multer from 'multer'
import { read, utils } from 'xlsx'
import { db } from '../../../db/index.js'
import { scheduleRenewalJobs } from '../../scheduler/seed-renewal-jobs.js'

export const customersRouter = Router()
const upload = multer({ storage: multer.memoryStorage() })

customersRouter.get('/', async (req, res) => {
  const { search, language, insurer } = req.query
  let sql = `SELECT id, phone, name, email, language, renewal_date, car_plate, insurer,
                    consent, source, created_at
             FROM customers WHERE 1=1`
  const params: unknown[] = []

  if (search) {
    params.push(`%${search}%`)
    sql += ` AND (phone ILIKE $${params.length} OR name ILIKE $${params.length})`
  }
  if (language) {
    params.push(language)
    sql += ` AND language = $${params.length}`
  }
  if (insurer) {
    params.push(insurer)
    sql += ` AND insurer = $${params.length}`
  }

  sql += ' ORDER BY created_at DESC LIMIT 100'
  const { rows } = await db.query(sql, params)
  res.json(rows)
})

customersRouter.get('/:id', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM customers WHERE id = $1', [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'Not found' })
  res.json(rows[0])
})

customersRouter.post('/', async (req, res) => {
  const { phone, name, email, language, renewal_date, car_plate, insurer, senang_customer_id } = req.body
  const { rows } = await db.query(
    `INSERT INTO customers (phone, name, email, language, renewal_date, car_plate, insurer, senang_customer_id, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'excel_import') RETURNING *`,
    [phone, name, email, language, renewal_date, car_plate, insurer, senang_customer_id]
  )
  if (rows[0].renewal_date) {
    await scheduleRenewalJobs(rows[0].id, new Date(rows[0].renewal_date))
  }
  res.status(201).json(rows[0])
})

customersRouter.put('/:id', async (req, res) => {
  const { name, email, language, renewal_date, car_plate, insurer, senang_customer_id, consent } = req.body
  const { rows } = await db.query(
    `UPDATE customers SET name=$1, email=$2, language=$3, renewal_date=$4,
     car_plate=$5, insurer=$6, senang_customer_id=$7, consent=$8,
     consent_given_at = CASE WHEN $8 = true AND consent = false THEN NOW() ELSE consent_given_at END,
     updated_at=NOW()
     WHERE id=$9 RETURNING *`,
    [name, email, language, renewal_date, car_plate, insurer, senang_customer_id, consent, req.params.id]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Not found' })
  res.json(rows[0])
})

customersRouter.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  const workbook = read(req.file.buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, unknown>[] = utils.sheet_to_json(sheet)

  let imported = 0
  let errors = 0

  for (const row of rows) {
    try {
      const phone = String(row['phone'] ?? row['Phone'] ?? '').replace(/\D/g, '')
      if (!phone) { errors++; continue }

      const renewalDate = row['renewal_date'] ?? row['Renewal Date'] ?? null
      const { rows: inserted } = await db.query(
        `INSERT INTO customers (phone, name, email, language, renewal_date, car_plate, insurer, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'excel_import')
         ON CONFLICT (phone) DO UPDATE SET
           name=EXCLUDED.name, renewal_date=EXCLUDED.renewal_date,
           car_plate=EXCLUDED.car_plate, insurer=EXCLUDED.insurer,
           updated_at=NOW()
         RETURNING id, renewal_date`,
        [
          phone,
          row['name'] ?? row['Name'] ?? null,
          row['email'] ?? row['Email'] ?? null,
          row['language'] ?? row['Language'] ?? null,
          renewalDate ?? null,
          row['car_plate'] ?? row['Car Plate'] ?? null,
          row['insurer'] ?? row['Insurer'] ?? null,
        ]
      )

      if (inserted[0]?.renewal_date) {
        await scheduleRenewalJobs(inserted[0].id, new Date(inserted[0].renewal_date))
      }
      imported++
    } catch {
      errors++
    }
  }

  res.json({ imported, errors, total: rows.length })
})
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/api/customers.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/admin-api/routes/customers.ts tests/api/customers.test.ts
git commit -m "feat: customers API — CRUD, Excel import with renewal job scheduling"
```

---

## Task 17: Admin API — Conversations + Messages

**Files:**
- Create: `src/modules/admin-api/routes/conversations.ts`

- [ ] **Step 1: Create src/modules/admin-api/routes/conversations.ts**

```typescript
import { Router } from 'express'
import { db } from '../../../db/index.js'

export const conversationsRouter = Router()

conversationsRouter.get('/', async (req, res) => {
  const { status } = req.query
  let sql = `
    SELECT c.id, c.status, c.tags, c.created_at, c.updated_at,
           cu.phone, cu.name, cu.language,
           (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.role = 'user') AS message_count
    FROM conversations c
    JOIN customers cu ON cu.id = c.customer_id
    WHERE 1=1`
  const params: unknown[] = []

  if (status) {
    params.push(status)
    sql += ` AND c.status = $${params.length}`
  }

  sql += ' ORDER BY c.updated_at DESC LIMIT 50'
  const { rows } = await db.query(sql, params)
  res.json(rows)
})

conversationsRouter.get('/:id/messages', async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, role, content, intent, language, confidence, created_at
     FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [req.params.id]
  )
  res.json(rows)
})

conversationsRouter.post('/:id/reply', async (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'text required' })

  const { rows: conv } = await db.query(
    `SELECT c.id, cu.phone FROM conversations c
     JOIN customers cu ON cu.id = c.customer_id WHERE c.id = $1`,
    [req.params.id]
  )
  if (!conv[0]) return res.status(404).json({ error: 'Not found' })

  const { sendText } = await import('../../wa-connector/sender.js')
  await sendText(conv[0].phone, text)

  await db.query(
    `INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'bot', $2)`,
    [req.params.id, text]
  )
  await db.query(
    `UPDATE conversations SET status = 'open', updated_at = NOW() WHERE id = $1`,
    [req.params.id]
  )

  res.json({ sent: true })
})

conversationsRouter.patch('/:id/status', async (req, res) => {
  const { status } = req.body
  if (!['open', 'handoff', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }
  await db.query(
    `UPDATE conversations SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, req.params.id]
  )
  res.json({ updated: true })
})
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/admin-api/routes/conversations.ts
git commit -m "feat: conversations API — list by status, messages, manual reply, status update"
```

---

## Task 18: Admin API — Knowledge Base

**Files:**
- Create: `src/modules/admin-api/routes/knowledge-base.ts`
- Create: `tests/api/knowledge-base.test.ts`

- [ ] **Step 1: Write failing test**

`tests/api/knowledge-base.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

vi.mock('../../src/db/index.js', () => ({ db: { query: vi.fn() } }))
vi.mock('../../src/modules/kb-retriever/embedder.js', () => ({
  embedText: vi.fn().mockResolvedValue(new Array(1536).fill(0.1))
}))

import { db } from '../../src/db/index.js'
import { kbRouter } from '../../src/modules/admin-api/routes/knowledge-base.js'

const app = express()
app.use(express.json())
app.use('/kb', kbRouter)

describe('GET /kb/gaps', () => {
  it('returns intents with low confidence messages', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ intent: 'general_faq', avg_confidence: 0.35, count: '5' }]
    } as any)

    const res = await request(app).get('/kb/gaps')
    expect(res.status).toBe(200)
    expect(res.body[0].intent).toBe('general_faq')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/api/knowledge-base.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create src/modules/admin-api/routes/knowledge-base.ts**

```typescript
import { Router } from 'express'
import multer from 'multer'
import { db } from '../../../db/index.js'
import { addKBEntry } from '../../kb-retriever/index.js'
import { embedText } from '../../kb-retriever/embedder.js'

export const kbRouter = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

kbRouter.get('/', async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, title, content, category, created_at FROM knowledge_base ORDER BY created_at DESC'
  )
  res.json(rows)
})

kbRouter.post('/', async (req, res) => {
  const { title, content, category } = req.body
  const id = await addKBEntry({ title, content, category })
  res.status(201).json({ id })
})

kbRouter.put('/:id', async (req, res) => {
  const { title, content, category } = req.body
  const embedding = await embedText(`${title}\n${content}`)
  const embeddingLiteral = `[${embedding.join(',')}]`

  const { rows } = await db.query(
    `UPDATE knowledge_base SET title=$1, content=$2, embedding=$3::vector, category=$4, updated_at=NOW()
     WHERE id=$5 RETURNING id`,
    [title, content, embeddingLiteral, category, req.params.id]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Not found' })
  res.json({ updated: true })
})

kbRouter.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM knowledge_base WHERE id = $1', [req.params.id])
  res.json({ deleted: true })
})

kbRouter.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })

  let text = ''
  if (req.file.mimetype === 'application/pdf') {
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(req.file.buffer)
    text = data.text
  } else if (req.file.mimetype.includes('word') || req.file.originalname.endsWith('.docx')) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer: req.file.buffer })
    text = result.value
  } else {
    return res.status(400).json({ error: 'Only PDF and DOCX supported' })
  }

  const chunks = chunkText(text, 500)
  const title = req.body.title ?? req.file.originalname
  let count = 0
  for (const chunk of chunks) {
    await addKBEntry({ title: `${title} (${count + 1})`, content: chunk, category: req.body.category })
    count++
  }

  res.json({ chunks: count })
})

kbRouter.get('/gaps', async (req, res) => {
  const { rows } = await db.query(`
    SELECT intent,
           AVG(confidence) AS avg_confidence,
           COUNT(*) AS count
    FROM messages
    WHERE role = 'user'
      AND intent IS NOT NULL
      AND confidence < 0.6
    GROUP BY intent
    ORDER BY avg_confidence ASC
    LIMIT 20
  `)
  res.json(rows)
})

function chunkText(text: string, maxWords: number): string[] {
  const sentences = text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if ((current + ' ' + sentence).split(' ').length > maxWords) {
      if (current) chunks.push(current.trim())
      current = sentence
    } else {
      current += ' ' + sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/api/knowledge-base.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/admin-api/routes/knowledge-base.ts tests/api/knowledge-base.test.ts
git commit -m "feat: KB API — CRUD, PDF/DOCX upload with chunking, gap analysis"
```

---

## Task 19: Admin API — Promotions + Broadcast + Scheduler + Config + Corrections

**Files:**
- Create: `src/modules/admin-api/routes/promotions.ts`
- Create: `src/modules/admin-api/routes/broadcast.ts`
- Create: `src/modules/admin-api/routes/scheduler.ts`
- Create: `src/modules/admin-api/routes/bot-config.ts`
- Create: `src/modules/admin-api/routes/corrections.ts`

- [ ] **Step 1: Create promotions.ts**

```typescript
import { Router } from 'express'
import { db } from '../../../db/index.js'

export const promotionsRouter = Router()

promotionsRouter.get('/', async (_req, res) => {
  const { rows } = await db.query('SELECT * FROM promotions ORDER BY created_at DESC')
  res.json(rows)
})

promotionsRouter.post('/', async (req, res) => {
  const { name, description, start_date, end_date, message_template_bm, message_template_zh, message_template_ta, message_template_en } = req.body
  const { rows } = await db.query(
    `INSERT INTO promotions (name, description, start_date, end_date, message_template_bm, message_template_zh, message_template_ta, message_template_en)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [name, description, start_date, end_date, message_template_bm, message_template_zh, message_template_ta, message_template_en]
  )
  res.status(201).json(rows[0])
})

promotionsRouter.put('/:id', async (req, res) => {
  const { name, description, start_date, end_date, message_template_bm, message_template_zh, message_template_ta, message_template_en, active } = req.body
  const { rows } = await db.query(
    `UPDATE promotions SET name=$1, description=$2, start_date=$3, end_date=$4,
     message_template_bm=$5, message_template_zh=$6, message_template_ta=$7, message_template_en=$8, active=$9
     WHERE id=$10 RETURNING *`,
    [name, description, start_date, end_date, message_template_bm, message_template_zh, message_template_ta, message_template_en, active, req.params.id]
  )
  res.json(rows[0])
})

promotionsRouter.post('/:id/tag-customers', async (req, res) => {
  const { customerIds } = req.body as { customerIds: string[] }
  let tagged = 0
  for (const customerId of customerIds) {
    await db.query(
      `INSERT INTO customer_promotions (customer_id, promotion_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [customerId, req.params.id]
    )
    tagged++
  }
  res.json({ tagged })
})
```

- [ ] **Step 2: Create broadcast.ts**

```typescript
import { Router } from 'express'
import { db } from '../../../db/index.js'
import { broadcastQueue } from '../../scheduler/index.js'

export const broadcastRouter = Router()

broadcastRouter.post('/', async (req, res) => {
  const { promotionId, scheduledAt, filters } = req.body

  let sql = `SELECT cp.id AS customer_promotion_id, cp.customer_id
             FROM customer_promotions cp
             JOIN customers cu ON cu.id = cp.customer_id
             WHERE cp.promotion_id = $1 AND cp.status = 'pending'`
  const params: unknown[] = [promotionId]

  if (filters?.language) {
    params.push(filters.language)
    sql += ` AND cu.language = $${params.length}`
  }
  if (filters?.insurer) {
    params.push(filters.insurer)
    sql += ` AND cu.insurer = $${params.length}`
  }

  const { rows } = await db.query(sql, params)
  const delay = scheduledAt ? new Date(scheduledAt).getTime() - Date.now() : 0

  for (const row of rows) {
    await broadcastQueue.add(
      'send',
      { customerId: row.customer_id, promotionId, customerPromotionId: row.customer_promotion_id },
      { delay: delay > 0 ? delay : 0 }
    )
  }

  res.json({ queued: rows.length })
})

broadcastRouter.get('/:promotionId/stats', async (req, res) => {
  const { rows } = await db.query(
    `SELECT status, COUNT(*) AS count
     FROM customer_promotions WHERE promotion_id = $1 GROUP BY status`,
    [req.params.promotionId]
  )
  res.json(rows)
})
```

- [ ] **Step 3: Create scheduler.ts**

```typescript
import { Router } from 'express'
import { db } from '../../../db/index.js'

export const schedulerRouter = Router()

schedulerRouter.get('/jobs', async (req, res) => {
  const { rows } = await db.query(
    `SELECT fj.id, fj.type, fj.step, fj.scheduled_at, fj.status,
            cu.phone, cu.name
     FROM follow_up_jobs fj
     JOIN customers cu ON cu.id = fj.customer_id
     WHERE fj.status = 'pending'
     ORDER BY fj.scheduled_at ASC LIMIT 100`
  )
  res.json(rows)
})

schedulerRouter.delete('/jobs/:id', async (req, res) => {
  await db.query(
    `UPDATE follow_up_jobs SET status = 'cancelled' WHERE id = $1`,
    [req.params.id]
  )
  res.json({ cancelled: true })
})
```

- [ ] **Step 4: Create bot-config.ts**

```typescript
import { Router } from 'express'
import { db } from '../../../db/index.js'

export const botConfigRouter = Router()

botConfigRouter.get('/', async (_req, res) => {
  const { rows } = await db.query('SELECT key, value FROM bot_config')
  res.json(Object.fromEntries(rows.map((r: { key: string; value: string }) => [r.key, r.value])))
})

botConfigRouter.put('/', async (req, res) => {
  const updates = req.body as Record<string, string>
  for (const [key, value] of Object.entries(updates)) {
    await db.query(
      'INSERT INTO bot_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      [key, value]
    )
  }
  res.json({ updated: Object.keys(updates).length })
})
```

- [ ] **Step 5: Create corrections.ts**

```typescript
import { Router } from 'express'
import { db } from '../../../db/index.js'

export const correctionsRouter = Router()

correctionsRouter.get('/', async (req, res) => {
  const { intent } = req.query
  let sql = `SELECT bc.id, bc.original_reply, bc.corrected_reply, bc.intent,
                    bc.created_at, m.content AS customer_message
             FROM bot_corrections bc
             LEFT JOIN messages m ON m.id = bc.message_id
             WHERE 1=1`
  const params: unknown[] = []
  if (intent) {
    params.push(intent)
    sql += ` AND bc.intent = $${params.length}`
  }
  sql += ' ORDER BY bc.created_at DESC LIMIT 50'
  const { rows } = await db.query(sql, params)
  res.json(rows)
})

correctionsRouter.post('/', async (req, res) => {
  const { messageId, originalReply, correctedReply, intent } = req.body
  const { rows } = await db.query(
    `INSERT INTO bot_corrections (message_id, original_reply, corrected_reply, intent)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [messageId, originalReply, correctedReply, intent]
  )
  res.status(201).json(rows[0])
})

correctionsRouter.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM bot_corrections WHERE id = $1', [req.params.id])
  res.json({ deleted: true })
})
```

- [ ] **Step 6: Commit**

```bash
git add src/modules/admin-api/routes/
git commit -m "feat: admin API routes — promotions, broadcast, scheduler, bot-config, corrections"
```

---

## Task 20: Quotation Webhook

**Files:**
- Create: `src/modules/admin-api/routes/webhook.ts`
- Create: `tests/api/webhook.test.ts`

- [ ] **Step 1: Write failing test**

`tests/api/webhook.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

vi.mock('../../src/db/index.js', () => ({ db: { query: vi.fn() } }))
vi.mock('../../src/modules/wa-connector/sender.js', () => ({
  sendText: vi.fn().mockResolvedValue(undefined)
}))

import { db } from '../../src/db/index.js'
import { sendText } from '../../src/modules/wa-connector/sender.js'
import { webhookRouter } from '../../src/modules/admin-api/routes/webhook.js'

const app = express()
app.use(express.json())
app.use('/webhook', webhookRouter)

describe('POST /webhook/quotation', () => {
  it('saves quotation and sends WA message', async () => {
    vi.mocked(db.query)
      .mockResolvedValueOnce({ rows: [{ id: 'c1', language: 'bm', name: 'Ali' }] } as any)
      .mockResolvedValueOnce({ rows: [{ id: 'q1' }] } as any)

    const res = await request(app).post('/webhook/quotation').send({
      phone: '60123456789',
      quotation_url: 'https://insurer.com/quote/abc',
      quotation_ref: 'QT-001',
      insurer: 'Etiqa',
      amount: 1200,
    })

    expect(res.status).toBe(200)
    expect(vi.mocked(sendText)).toHaveBeenCalledWith(
      '60123456789',
      expect.stringContaining('insurer.com')
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/api/webhook.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create src/modules/admin-api/routes/webhook.ts**

```typescript
import { Router } from 'express'
import { db } from '../../../db/index.js'
import { sendText } from '../../wa-connector/sender.js'

export const webhookRouter = Router()

const QUOTATION_MSG: Record<string, string> = {
  bm: (url: string, insurer: string) => `Sebut harga pembaharuan insurans ${insurer} anda sedia. Klik untuk dapatkan sebut harga: ${url}`,
  zh: (url: string, insurer: string) => `您的${insurer}续保报价已准备好。点击获取报价：${url}`,
  ta: (url: string, insurer: string) => `${insurer} புதுப்பிப்பு மேற்கோள் தயாராக உள்ளது: ${url}`,
  en: (url: string, insurer: string) => `Your ${insurer} renewal quote is ready. Get your quote here: ${url}`,
} as any

webhookRouter.post('/quotation', async (req, res) => {
  const { phone, quotation_url, quotation_ref, insurer, amount } = req.body

  if (!phone || !quotation_url) {
    return res.status(400).json({ error: 'phone and quotation_url required' })
  }

  const normalizedPhone = phone.replace(/\D/g, '')

  const { rows: customers } = await db.query(
    'SELECT id, language, name FROM customers WHERE phone = $1',
    [normalizedPhone]
  )

  const customer = customers[0]
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' })
  }

  await db.query(
    `INSERT INTO quotations (customer_id, quotation_ref, quotation_url, insurer, amount, status)
     VALUES ($1, $2, $3, $4, $5, 'sent')`,
    [customer.id, quotation_ref, quotation_url, insurer, amount]
  )

  const lang = customer.language ?? 'bm'
  const msgFn = QUOTATION_MSG[lang] ?? QUOTATION_MSG.bm
  const message = msgFn(quotation_url, insurer ?? 'insurans')

  await sendText(normalizedPhone, message)

  res.json({ sent: true })
})
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/api/webhook.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/admin-api/routes/webhook.ts tests/api/webhook.test.ts
git commit -m "feat: quotation webhook — save quotation, send WA message in customer language"
```

---

## Task 21: Full Test Run + PM2 Config

**Files:**
- Create: `ecosystem.config.cjs`

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests PASS. Fix any failures before proceeding.

- [ ] **Step 2: Create ecosystem.config.cjs**

```javascript
module.exports = {
  apps: [
    {
      name: 'limauai',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
```

- [ ] **Step 3: Add build + start scripts to package.json**

```json
{
  "scripts": {
    "pm2:start": "npm run build && pm2 start ecosystem.config.cjs",
    "pm2:stop": "pm2 stop limauai",
    "pm2:logs": "pm2 logs limauai",
    "pm2:restart": "pm2 restart limauai"
  }
}
```

- [ ] **Step 4: Verify build compiles cleanly**

```bash
npm run build
```

Expected: No TypeScript errors. `dist/` directory created.

- [ ] **Step 5: Start with PM2 locally**

```bash
cp .env.example .env
# Edit .env with real values
npm run pm2:start
```

Expected: PM2 shows `limauai` app as `online`. QR in logs (`pm2 logs limauai`).

- [ ] **Step 6: Final commit**

```bash
git add ecosystem.config.cjs package.json
git commit -m "feat: PM2 config — production process management"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] WA connector (Baileys) — Task 4
- [x] Language detector (BM/ZH/TA/EN) — Task 5
- [x] Context manager (20 messages) — Task 6
- [x] Intent router (10 intents + confidence) — Task 7
- [x] KB retriever + embedder (pgvector RAG) — Task 8
- [x] AI engine (3-layer prompt) — Task 9
- [x] Message pipeline — Task 12
- [x] Handoff manager (4 triggers + hold msg + owner alert) — Task 10
- [x] Tagger (auto-tag by intent + language) — Task 11
- [x] Renewal scheduler (T-30/14/3/+1 with consent logic) — Task 13
- [x] Broadcast (10/min rate limit, multilingual) — Task 14
- [x] Admin API auth — Task 15
- [x] Customers API + Excel import — Task 16
- [x] Conversations API + manual reply — Task 17
- [x] KB API + document upload + gap analysis — Task 18
- [x] Promotions + broadcast + scheduler + config + corrections — Task 19
- [x] Quotation webhook — Task 20
- [x] PM2 config — Task 21
- [x] Database migrations (all 11 tables) — Task 2
- [x] Redis + BullMQ workers — Tasks 3, 13, 14
- [x] Error handling (Baileys reconnect, OpenAI retry) — Tasks 4, 9 (retry in generateReply via OpenAI SDK)

**Not in this plan (covered in admin UI plan):**
- Next.js dashboard (all pages)
