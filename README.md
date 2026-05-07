# LimauAI

Self-hosted WhatsApp AI chatbot for Malaysian car insurance and road tax renewal. Multilingual (BM / ZH / TA / EN), RAG knowledge base, proactive renewal reminders, admin dashboard.

## Features

- **WhatsApp integration** via Baileys (multi-device, no browser required)
- **AI-powered conversations** — GPT-4o-mini classifies intent, retrieves relevant KB entries, generates contextual replies
- **Multilingual** — auto-detects Bahasa Melayu, Chinese, Tamil, English
- **Renewal scheduler** — proactive follow-ups at T-30, T-14, T-3, T+1 days before expiry
- **Broadcast** — send promotions to filtered customer segments (10 msg/min rate limit)
- **Escalation / handoff** — routes to human agent on complaint, low confidence, or "human" keywords
- **Admin dashboard** — manage customers, conversations, knowledge base, promotions, bot config

## Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js 20 + TypeScript (ESM) |
| WhatsApp | Baileys |
| AI | OpenAI GPT-4o-mini + text-embedding-3-small |
| Database | PostgreSQL 16 + pgvector |
| Queue | BullMQ + Redis 7 |
| Admin UI | Next.js 14 + Tailwind + TanStack Query |
| Process manager | PM2 |
| Tunnel | Cloudflare Tunnel |

## Quick Start

### Prerequisites

- Docker Desktop
- Node.js 20+
- PM2 (`npm i -g pm2`)
- OpenAI API key

### Setup

```bash
cp .env.example .env
# Fill in DATABASE_URL, REDIS_URL, OPENAI_API_KEY, ADMIN_API_KEY, OWNER_PHONE
```

### Deploy (Windows)

```powershell
.\deploy.ps1
```

This starts Postgres + Redis via Docker, builds backend + admin UI, runs migrations, seeds default config, and starts all processes with PM2.

### Dev mode

```bash
# Terminal 1 — backend
npm run dev

# Terminal 2 — admin UI
cd admin && npm run dev
```

Backend: http://localhost:3001  
Admin UI: http://localhost:3000

## Architecture

```
WA message → language-detector → context-manager
           → intent-router (GPT-4o-mini)
           → [handoff? → alert owner]
           → kb-retriever (pgvector)
           → ai-engine → reply
           → tagger → context-manager persists
```

## Environment Variables

See `.env.example` for all required variables.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `OPENAI_API_KEY` | OpenAI API key |
| `ADMIN_API_KEY` | Secret key for admin API |
| `OWNER_PHONE` | Phone number for escalation alerts |
| `BAILEYS_SESSION_PATH` | Path to store WA session files |
| `PORT` | Backend port (default 3001) |

## License

MIT
