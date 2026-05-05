# LimauAI — WhatsApp AI Chatbot Design Spec

**Date:** 2026-05-05
**Domain:** Car insurance + roadtax renewal, Malaysia
**Status:** Approved

---

## 1. Overview

LimauAI is a self-hosted WhatsApp AI chatbot for a Malaysian car insurance and roadtax renewal business. It replaces Luluchat as the WhatsApp transport layer, adding an AI intelligence layer with conversation memory, multilingual support, knowledge base RAG, auto-tagging, proactive renewal follow-ups, broadcast, and a web admin dashboard.

**Primary language:** Bahasa Malaysia
**Secondary languages:** Mandarin, Tamil, English

---

## 2. Architecture

### Pattern: Modular Monolith → Microservices

Single codebase with clean module boundaries. Inter-module communication via BullMQ message queue so each module can be extracted to its own process/repo when scale demands it without logic rewrites.

### Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| WA Connector | Baileys (unofficial WhatsApp Multi-Device) |
| API Server | Express.js |
| Job Queue | BullMQ + Redis |
| Database | PostgreSQL + pgvector extension |
| LLM | OpenAI GPT-4o-mini (default) + GPT-4o (complex intents) |
| Admin UI | Next.js |
| Process Manager | PM2 |
| Hosting (initial) | Local machine + Cloudflare Tunnel |
| Hosting (production) | VPS — 4 vCPU, 8GB RAM, 80GB SSD, Ubuntu 22.04 |
| Domain | limauais.my (Exabytes) |

### Modules

```
wa-connector       — Baileys session, send/receive WA messages
intent-router      — classify incoming message intent + confidence score
language-detector  — detect BM / ZH / TA / EN per message
context-manager    — load/save last 20 messages of conversation history from PostgreSQL
kb-retriever       — FAQ + document RAG lookup via pgvector
ai-engine          — build prompt (tone + KB context + corrections), call OpenAI
tagger             — auto-tag conversation after resolution
scheduler          — proactive renewal follow-up + broadcast jobs via BullMQ
handoff-manager    — detect escalation triggers, alert owner, send hold message
admin-api          — REST API backing the Next.js dashboard
```

---

## 3. Message Flow

```
Customer sends WA message
        ↓
wa-connector (Baileys receives)
        ↓
language-detector → detect BM / ZH / TA / EN
        ↓
context-manager → load last 20 messages for this customer
        ↓
intent-router → classify intent:
    renewal_inquiry | roadtax_inquiry | quotation_request |
    payment_status | document_upload | promotion_inquiry |
    complaint | escalation | general_faq | unknown
        ↓
    ┌──────────────────┬─────────────────────┐
    │                  │                     │
kb-retriever       ai-engine          handoff-manager
(FAQ + RAG)    (GPT-4o-mini)        (if escalation triggered)
    └──────────────────┴─────────────────────┘
                       ↓
              response-builder
              (apply tone config + detected language)
                       ↓
              wa-connector (send reply via Baileys)
                       ↓
              tagger (auto-tag conversation)
                       ↓
              context-manager (persist to DB)
```

### Handoff Trigger Conditions

- Intent classified as `complaint` or `escalation`
- Confidence score below configured threshold (default 60%)
- Customer sends keyword: "human" / "agent" / "manusia" / "人工" / "agen"
- 3+ consecutive `unknown` intents in same conversation

### Handoff Actions (both fire simultaneously)

1. Send customer a hold message in their detected language: "Please wait, our agent will attend to you shortly."
2. Send owner a WA alert: `⚠️ Handoff needed: {name} ({phone}) | Intent: {intent} | Language: {lang} | Last message: {snippet}`

---

## 4. Data Model

```sql
customers
  id, phone, name, email, language,
  renewal_date, car_plate, insurer,
  senang_customer_id,
  consent BOOLEAN DEFAULT false,
  consent_given_at TIMESTAMP,
  source ENUM('excel_import', 'bot_captured'),
  created_at, updated_at

conversations
  id, customer_id,
  status ENUM('open', 'handoff', 'resolved'),
  tags TEXT[],
  created_at, updated_at

messages
  id, conversation_id,
  role ENUM('user', 'bot', 'system'),
  content TEXT,
  intent VARCHAR,
  language VARCHAR,
  confidence FLOAT,
  created_at

knowledge_base
  id, title, content TEXT,
  embedding VECTOR(1536),
  category VARCHAR,
  created_at, updated_at

bot_corrections
  id, message_id,
  original_reply TEXT,
  corrected_reply TEXT,
  intent VARCHAR,
  created_at

promotions
  id, name, description,
  start_date, end_date,
  message_template_bm TEXT,
  message_template_zh TEXT,
  message_template_ta TEXT,
  message_template_en TEXT,
  active BOOLEAN,
  created_at

customer_promotions
  id, customer_id, promotion_id,
  status ENUM('pending', 'sent', 'converted'),
  sent_at

quotations
  id, customer_id,
  quotation_ref VARCHAR,
  quotation_url TEXT,        -- external insurer/comparison website URL
  insurer VARCHAR,
  amount DECIMAL,
  status ENUM('draft', 'sent', 'accepted', 'expired'),
  created_at

payments
  id, customer_id, quotation_id,
  senang_transaction_id VARCHAR,
  payment_method VARCHAR,
  amount DECIMAL,
  status ENUM('pending', 'paid', 'failed'),
  paid_at

follow_up_jobs
  id, customer_id,
  type ENUM('renewal_reminder', 'quote_followup', 'promotion', 'broadcast'),
  step VARCHAR,              -- e.g. 't30', 't14', 't3', 't1'
  ref_id UUID,               -- promotion_id if type=promotion
  scheduled_at, sent_at,
  status ENUM('pending', 'sent', 'cancelled')

bot_config
  key VARCHAR PRIMARY KEY,
  value TEXT
  -- keys: tone, persona_name, language_fallback, handoff_threshold,
  --       handoff_hold_msg_bm, handoff_hold_msg_zh, handoff_hold_msg_ta,
  --       handoff_hold_msg_en, owner_phone
```

---

## 5. Renewal Follow-up Scheduler

All messages sent in customer's detected language. `follow_up_jobs` tracks current step per customer to prevent duplicate sends.

```
T-30 days
  Action: Send consent request
  Message: "Your {insurer} insurance expires in 30 days. Want us to help with renewal?"
  YES → consent=true, consent_given_at saved, proceed to T-14 with quote
  NO  → mark cancelled, no further automated messages
  No reply → proceed to T-14 as reminder

T-14 days
  IF consent=yes (from T-30):
    Send: "Your quote is ready. Click here to get your renewal quote: {quotation_url}"
    (quotation_url = external insurer website, manually set by admin or per-insurer default)
  IF no reply at T-30:
    Resend consent request reminder
    YES → consent=true, send quote URL immediately
    NO  → mark cancelled

T-3 days
  IF consent=yes:
    Send: "3 days left! Your renewal quote: {quotation_url}"
  IF still no consent:
    Gentle nudge only, no quote link

T+1 day
  Send: "Your policy may have lapsed. Contact us now."
  (regardless of consent — safety message)
```

---

## 6. Broadcast

Admin-triggered bulk WA message to a filtered customer segment.

- **Rate limit:** 10 messages/minute via BullMQ rate limiter (prevents WhatsApp ban)
- **Audience:** filter by tag, language, insurer, renewal month, or manual selection
- **Message:** uses promotion template in customer's detected language
- **Tracking:** sent / replied / converted per customer per broadcast (WA Personal has no delivery receipts)
- **Scheduling:** send now or schedule for future datetime

---

## 7. Knowledge Base & Gap Analysis

- Admin uploads FAQ entries or documents (PDF, DOCX) via admin dashboard
- Documents auto-chunked and embedded via OpenAI `text-embedding-3-small`
- Stored in pgvector, retrieved via cosine similarity at query time
- **Gap analysis:** dashboard surfaces intents where bot responded with low confidence or fallback — shows admin what KB content is missing

---

## 8. AI Engine

Each response built from 3 layers:

1. **System prompt** — loaded from `bot_config`: tone (formal/friendly/casual), persona name, language instruction
2. **KB context** — top-3 relevant KB chunks retrieved via RAG
3. **Corrections** — few-shot examples from `bot_corrections` matching current intent

Model selection:
- `gpt-4o-mini` — default (fast, cheap)
- `gpt-4o` — escalated for complex multi-turn intents (quotation negotiation, complaint handling)

---

## 9. Admin Dashboard

Served by Next.js, exposed via Cloudflare Tunnel at `admin.limauais.my`.

| Section | Features |
|---|---|
| **Dashboard** | Live conversations (open/handoff/resolved), unread count, handoff alerts, quick reply |
| **Customers** | List/search/filter, Excel import (drag & drop), customer detail (history, quotations, payments, tags) |
| **Knowledge Base** | Add/edit/delete FAQ, upload documents, gap analysis view |
| **Promotions** | Create promotion, multilingual templates, tag customers |
| **Broadcast** | Select audience, schedule or send now, delivery + conversion tracking |
| **Scheduler** | View upcoming follow-up jobs, manual override |
| **Bot Settings** | Tone slider, persona name, language fallback, handoff threshold, hold messages per language, owner WA number |
| **Corrections** | Review past bot replies, mark bad reply, enter corrected reply (saved as few-shot) |

---

## 10. IT Integration — Quotation Webhook

Existing IT system generates quotation link and posts to our backend:

```
POST /api/webhook/quotation
{
  "phone": "+601xxxxxxxx",
  "quotation_url": "https://insurer.com/quote/abc123",
  "quotation_ref": "QT-2026-001",
  "insurer": "Etiqa",
  "amount": 1200.00
}
```

Our system saves to `quotations` table and sends WA message to customer via Baileys.

---

## 11. Error Handling & Resilience

| Failure | Handling |
|---|---|
| Baileys disconnect | Auto-reconnect with exponential backoff. Session credentials persisted to disk (no QR rescan). After 3 failed reconnects → dashboard alert + error log |
| OpenAI API failure | Retry 3x with backoff. If all fail → send hold message to customer + handoff alert to owner |
| WA send failure | BullMQ retry queue, up to 5 retries. If still fails → dashboard alert |
| Broadcast abuse | 10 msgs/min hard rate limit via BullMQ |
| Data loss | PostgreSQL daily backup via pg_dump → local + Cloudflare R2. Redis AOF persistence for BullMQ jobs |

---

## 12. Auto-Tagging Taxonomy

Applied automatically after conversation resolved:

- `insurance-renewal`
- `roadtax-renewal`
- `quotation-sent`
- `quotation-accepted`
- `payment-confirmed`
- `document-uploaded`
- `complaint`
- `handoff`
- `promotion-converted`
- `language-bm` / `language-zh` / `language-ta` / `language-en`

---

## 13. Deployment Path

**Phase 1 — Local development:**
- Run all services on local machine via PM2
- Admin dashboard tunneled via Cloudflare Tunnel
- PostgreSQL + Redis running locally

**Phase 2 — Production VPS:**
- Migrate to Exabytes or Hetzner VPS (4 vCPU, 8GB RAM, Ubuntu 22.04)
- PM2 cluster mode
- Nginx reverse proxy
- SSL via Cloudflare

**Phase 3 — Microservices (when needed):**
- Extract high-load modules (ai-engine, scheduler) to separate processes
- Point BullMQ to shared Redis instance
- No logic rewrites required due to message bus isolation
