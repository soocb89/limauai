# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

LimauAI — self-hosted WhatsApp AI chatbot for Malaysian car insurance/road tax renewal. Replaces Luluchat. Multilingual (BM/ZH/TA/EN), RAG knowledge base, proactive renewal scheduling, admin dashboard.

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
npm run pm2:restart          # Restart backend

# Database
npm run db:migrate           # Apply SQL migrations (idempotent)
npm run db:seed              # Insert default bot_config rows

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
WA message → language-detector → context-manager (load last 20 msgs)
           → intent-router (gpt-4o-mini JSON classify)
           → [handoff-manager? → alert owner, exit]
           → kb-retriever (pgvector cosine similarity, top 3)
           → ai-engine (build system prompt + OpenAI call)
           → wa-connector sends reply
           → tagger → context-manager persists
```

### Core Modules (`src/modules/`)

| Module | Responsibility |
|--------|---------------|
| `wa-connector` | Baileys session, QR, reconnect (max 5, exponential backoff), `sendText()` |
| `language-detector` | franc-min → 'bm' / 'zh' / 'ta' / 'en' |
| `context-manager` | Load/save conversation + messages; tracks consecutive 'unknown' intents |
| `intent-router` | gpt-4o-mini → `{intent, confidence}` JSON; intents: renewal_inquiry, quotation_request, complaint, escalation, general_faq, unknown, etc. |
| `kb-retriever` | OpenAI text-embedding-3-small → pgvector search |
| `ai-engine` | Compose system prompt (tone + language + KB + few-shot corrections) → gpt-4o-mini/gpt-4o reply |
| `handoff-manager` | Escalation triggers: complaint/escalation intent, confidence < threshold (60%), keywords "human/manusia/人工", 3+ consecutive unknowns |
| `tagger` | Post-conversation auto-tags (insurance-renewal, complaint, language-*, etc.) |
| `scheduler` | BullMQ workers: renewal queue (T-30/T-14/T-3/T+1), broadcast queue (10 msgs/min limit) |
| `admin-api` | Express router: customers, conversations, KB, promotions, broadcast, bot-config, corrections, webhook |

### Infrastructure

- **Database:** PostgreSQL 16 + pgvector; `src/db/` — pool export, migration runner, seed
- **Queue:** BullMQ + Redis 7 via `src/redis/index.ts`
- **Admin UI:** Next.js 14 + React 18 + Tailwind + TanStack Query in `admin/`; API client at `admin/src/lib/api.ts`
- **Process Manager:** PM2 — 3 apps: `limauai` (backend), `limauai-admin` (Next.js), `cloudflared` (tunnel)
- **Docker:** `docker-compose.yml` runs PostgreSQL + Redis with named volumes

### Key DB Tables

`customers`, `conversations`, `messages`, `knowledge_base` (pgvector 1536-dim embeddings), `bot_corrections` (few-shot training), `promotions`, `quotations`, `payments`, `follow_up_jobs`, `bot_config` (key-value store)

### Environment Variables

See `.env.example` — required: `DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY`, `ADMIN_API_KEY`, `OWNER_PHONE`, `BAILEYS_SESSION_PATH`, `PORT`

### TypeScript Config

Strict mode, ESM, ES2022 target. Module resolution: `node16`. Path alias: `@/*` → `src/*`.

## Testing

Tests in `tests/modules/` (unit) and `tests/api/` (integration). Setup file: `tests/setup.ts`. Framework: Vitest 4 with Node environment.

## Design Spec

Full spec + implementation plan: `docs/superpowers/specs/2026-05-05-limauai-whatsapp-chatbot-design.md` and `docs/superpowers/plans/2026-05-05-limauai-backend.md`
