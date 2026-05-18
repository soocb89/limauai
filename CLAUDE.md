# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

LimauAI — self-hosted WhatsApp AI chatbot for Malaysian car insurance/road tax renewal. Multilingual (BM/ZH/TA/EN), RAG knowledge base, proactive renewal scheduling, admin dashboard. Public repo: https://github.com/soocb89/limauai

## Commands

```bash
# Development
npm run dev                  # Backend (tsx hot-reload)
cd admin && npm run dev      # Admin dashboard (Next.js, separate terminal)

# Build & Production
npm run build                # tsc + copy SQL migrations to dist/
npm run start                # node dist/index.js
npm run pm2:start            # Build + PM2 start all processes
npm run pm2:logs             # Tail PM2 logs
npm run pm2:restart          # Restart backend only (no build)

# IMPORTANT: After any src/ change, always build before restart:
npm run build && npx pm2 restart limauai

# After any admin/ change, build admin before restart:
cd admin && npm run build && cd .. && npx pm2 restart limauai-admin

# Database
npm run db:migrate           # Apply SQL migrations (idempotent)
npm run db:seed              # Insert default bot_config rows
npm run db:seed-admin        # Seed default admin user (username=admin, password=ADMIN_API_KEY)

# Tests
npm test                     # Run vitest once
npm run test:watch           # Watch mode
npx vitest run tests/modules/intent-router.test.ts  # Single test file
```

## Architecture

**Pattern:** Modular monolith. BullMQ message bus isolates async work for future microservice extraction.

### Message Pipeline (`src/pipeline.ts`)

Every inbound WhatsApp message flows through this sequence:

```
WA message → language-detector → context-manager (load last 20 msgs) + loadBotConfig()
           → [handoff status? → save message, exit — admin handling]
           → pre-filter (identity/jailbreak? → hard-coded reply, no OpenAI call)
           → [handoff keyword? → triggerHandoff, exit]
           → intent-router (gpt-4o-mini JSON classify)
           → [shouldHandoff? → triggerHandoff, exit]
           → kb-retriever + loadCorrections (parallel)
           → ai-engine (build system prompt + OpenAI call)
           → wa-connector sends reply
           → tagger → context-manager persists
```

### Core Modules (`src/modules/`)

| Module | Responsibility |
|--------|---------------|
| `wa-connector` | Baileys session, QR, reconnect (max 5, exponential backoff), `sendText()`. Reads `lid-mapping-*_reverse.json` from session folder at startup to resolve @lid JIDs. |
| `wa-connector/status.ts` | WA status state (`disconnected`/`connecting`/`qr_ready`/`connected`) + QR string |
| `wa-connector/sender.ts` | `sendText()` with `waitReady()` guard (15s timeout) |
| `language-detector` | ZH/TA regex → BM keyword set (30% threshold) → EN keyword set (30% threshold) → franc-min → fallback 'bm' |
| `context-manager` | Load/save conversation + messages; tracks consecutive 'unknown' intents. Loads `status IN ('open','handoff')` conversations — handoff conversations are preserved, not re-created. |
| `intent-router` | gpt-4o-mini → `{intent, confidence}` JSON |
| `kb-retriever` | OpenAI text-embedding-3-small → pgvector cosine similarity, top 3 |
| `ai-engine` | Compose system prompt → gpt-4o-mini/gpt-4o reply |
| `ai-engine/pre-filter.ts` | Hard-coded intercept for identity questions ("are you AI?") and jailbreak attempts. Returns fixed multilingual reply, bypasses OpenAI entirely. |
| `ai-engine/prompt-builder.ts` | Builds agent-style system prompt: role as human agent, language instruction, AI-denial rule, KB context, corrections, custom_instructions from bot_config |
| `handoff-manager` | Escalation triggers: complaint/escalation intent, confidence < threshold, handoff keywords, 3+ consecutive unknowns |
| `tagger` | Post-conversation auto-tags |
| `scheduler` | BullMQ workers: renewal queue (T-30/T-14/T-3/T+1), broadcast queue (10 msgs/min limit) |
| `admin-api` | Express router: auth, customers, conversations, KB, promotions, broadcast, bot-config, corrections, webhook, wa-status |
| `admin-api/routes/auth.ts` | JWT login (`POST /admin/auth/login` — public), user CRUD (`GET/POST/DELETE /admin/auth/users`, `PATCH /admin/auth/users/:id/password` — all require API key) |

### Admin Dashboard (`admin/`)

Next.js 14 + React 18 + Tailwind + TanStack Query. Protected by two auth layers:
1. **Cloudflare Access** (email OTP at CDN edge) — `admin.limauais.my`
2. **Next.js middleware** (`admin/middleware.ts`) — verifies `admin_session` JWT cookie using `jose`; blocks agent role from restricted pages; redirects to `/login` on failure

**Role system:** `admin` = full access. `agent` = Conversations + Customers + Promotions (view-only) only. Role stored in JWT, verified in middleware + re-verified directly in `(dashboard)/layout.tsx` via `cookies()` + `jwtVerify`.

Key pages:
- `/dashboard` — conversations list + inline reply panel + **CustomerInfoPanel** (pencil icon opens right-side slide-in with editable customer fields: name, car_plate, insurer, renewal_date, tags; read-only: phone, status, language, custom_fields)
- `/customers` — inline edit for name, car_plate, tags, custom_fields; lead→customer promotion
- `/knowledge-base` — KB CRUD + document upload + gap analysis *(admin only)*
- `/promotions` — promotions list; write actions hidden for agent role
- `/webhooks` — webhook builder with custom fields + `{{field}}` message templates *(admin only)*
- `/settings` — bot config including `custom_instructions` appended to every system prompt *(admin only)*
- `/users` — admin user management: list all users, create (username/password/role), reset password, delete *(admin only)*

### Conversation Status Flow

- `open` — AI replies automatically
- `handoff` — admin has taken over; messages saved but AI silent; new messages from customer go into same conversation (not new one)
- `resolved` — closed

Admin can toggle: **Pause AI (Handoff)** / **Resume AI** / **Resolve** buttons in conversation panel.

### Infrastructure

- **Database:** PostgreSQL 16 + pgvector; `src/db/` — pool export, migration runner, seed
- **Queue:** BullMQ + Redis 7 via `src/redis/index.ts`
- **Process Manager:** PM2 — 3 apps: `limauai` (backend), `limauai-admin` (Next.js), `cloudflared` (tunnel)
- **Tunnel:** Cloudflare tunnel → `admin.limauais.my` (admin UI on port 3000)
- **Docker:** `docker-compose.yml` runs PostgreSQL + Redis with named volumes

### Key DB Tables

`customers` (with `tags TEXT[]`, `custom_fields JSONB`, `status VARCHAR` lead/customer), `conversations` (status: open/handoff/resolved), `messages`, `knowledge_base` (pgvector 1536-dim), `bot_corrections`, `promotions`, `quotations`, `payments`, `follow_up_jobs`, `bot_config` (key-value: tone, persona_name, model, owner_phone, handoff_threshold, max_unknowns, custom_instructions), `webhooks` (token, fields JSONB, message_template), `admin_users` (id UUID, username, password_hash bcrypt, role admin/agent, created_at)

### Environment Variables

Backend `.env` — required: `DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY`, `ADMIN_API_KEY`, `OWNER_PHONE`, `BAILEYS_SESSION_PATH`, `PORT`, `SESSION_SECRET`

Admin `admin/.env.local` — required: `BACKEND_URL`, `ADMIN_API_KEY`, `SESSION_SECRET`

> `SESSION_SECRET` must be identical in both files — backend signs JWTs with it, admin middleware verifies them.

### WA Connector — LID Resolution

WhatsApp multi-device sends messages with `@lid` JIDs. On startup, `startWAConnector()` reads all `lid-mapping-*_reverse.json` files from `BAILEYS_SESSION_PATH` to pre-populate the `lidToPhone` Map. Without this, messages from multi-device contacts are dropped.

### Webhook Route (`POST /admin/wa/w/:token`)

- Accepts query params OR JSON body (merged: `{...req.query, ...req.body}`)
- Upserts customer (phone, name, car_plate, insurer)
- Merges `tags` field into `customer.tags` — accepts comma-separated string (`"vip,renewal"`) or JSON array; uses `array(SELECT DISTINCT unnest(...))` to deduplicate without overwriting existing tags
- Renders `{{field}}` template from webhook `message_template`
- Sends WA message via `sendText()`
- Saves sent message to conversation history (role: 'bot')

### Auth Flow

1. User POSTs `{username, password}` to `/api/auth/login` (Next.js route)
2. Next.js route forwards to `POST /admin/auth/login` (backend, public — mounted before `requireApiKey`)
3. Backend verifies bcrypt hash, signs JWT `{sub, role}` with `SESSION_SECRET` (7d expiry), returns `{token, role}`
4. Next.js stores JWT in `admin_session` httpOnly cookie
5. Middleware (`admin/middleware.ts`) verifies JWT on every request, blocks agent from restricted paths
6. `(dashboard)/layout.tsx` re-verifies JWT from cookie directly to set `RoleProvider` context for client components

### Creating Admin Users

```bash
# Seed default admin (uses ADMIN_API_KEY as password)
npm run db:seed-admin

# Create agent via API
curl -X POST http://localhost:3001/admin/auth/users \
  -H "X-Api-Key: <ADMIN_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"username":"agent1","password":"pass","role":"agent"}'

# Or use the /users page in the admin dashboard (admin role required)
```

### TypeScript Config

Strict mode, ESM, ES2022 target. Module resolution: `node16`. Path alias: `@/*` → `src/*`.

## Testing

Tests in `tests/modules/` (unit) and `tests/api/` (integration). Setup file: `tests/setup.ts`. Framework: Vitest 4 with Node environment.

## Design Spec

Full spec + implementation plan: `docs/superpowers/specs/2026-05-05-limauai-whatsapp-chatbot-design.md` and `docs/superpowers/plans/2026-05-05-limauai-backend.md`
