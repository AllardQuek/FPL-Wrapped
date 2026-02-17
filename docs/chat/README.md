# FPL Chat Product (Elastic-Powered)

This README documents the chat product in FPL Wrapped: what it supports today, how it works, and how to run/operate it.

## What this product is

The chat product is an FPL-specific conversational assistant powered by **Elastic Agent Builder** and backed by the `fpl-gameweek-decisions` index.

It is available through:
- Web chat UI: `/chat`
- Telegram bot: webhook-driven bot flow
- Telegram Mini App: in-chat mini-apps with chart rendering (see Telegram section)

---

## Core capabilities

### 1) On-demand indexing (when data is missing)

Implemented support for async, chunked indexing with resumable executions:
- `POST /api/index/orchestrate` (recommended single-call orchestrator with bounded iterations)
- `POST /api/index/run/{execution_id}` (manual continuation)
- `GET /api/index/status/{execution_id}` (status/progress)
- `POST /api/index` (streaming legacy/manual indexing path)

Agent workflows are documented and ready for use:
- `docs/chat/es-workflows/index-and-wait.yaml`
- `docs/chat/es-workflows/run-index-execution.yaml`
- `docs/chat/es-workflows/get-index-status.yaml`
- `docs/chat/es-workflows/check-fpl-indexed-data.yaml`

### 2) Coverage preflight checks

Before analysis, the agent can verify indexed coverage for league/manager + GW/range using:
- `fpl.check-indexed-data` workflow

This helps avoid false “no data” responses and enables indexing only missing GW ranges.

### 3) Variety of custom tools for different query types

The tool strategy is split by job:
- **Index Search tool** (`fpl.search_decisions`) for flexible exploratory lookups
- **Specialized ES|QL tools** for accurate aggregations/rankings (captaincy spread, chip usage, points hits, differentials, etc.)
- **Indexing workflows** for missing data remediation

Rationale and definitions:
- `docs/chat/es-tools/mini-league-agent-tools.md`

### 4) Tailored FPL system prompt

The prompt is tuned for:
- strict FPL-only scope
- index/schema constraints
- league/gameweek parsing rules
- preflight/indexing policy
- response style (FPL language, concise, contextual)

Reference:
- `docs/chat/CHAT-SYSTEM-PROMPT.md`

### 5) Streaming chat with tool/reasoning visibility

Web/API streaming is implemented with SSE:
- `POST /api/chat` streams chunks from Elastic `/api/agent_builder/converse/async`
- UI renders streaming answer text, tool-call lifecycle, and reasoning updates
- conversation continuity via returned `conversation_id`

Main code:
- `app/api/chat/route.ts`
- `lib/chat/elastic-agent.ts`
- `app/chat/page.tsx`

### 6) Charts support (Vega / Vega-Lite)

Supported chart flow:
- Agent can return `<visualization tool-result-id="..." />` + fenced `vega-lite` blocks
- UI parses and renders charts inline
- Vega specs are sanitized (URL stripping + secure loader)
- Theme enforcement keeps visuals aligned with app style and avoids unsafe external data loads

Additional rendering targets:
- Charts are rendered inline in the web UI from `<visualization tool-result-id="..." />` tags and fenced `vega-lite` blocks.
- Chart rendering is also supported in Telegram Mini Apps (Vega-Lite specs produced by the agent are mapped into mini-app views), enabling inline visuals inside Telegram conversations.

Main code/docs:
- `lib/chat/charts.ts`
- `app/chat/page.tsx`
- `docs/chat/vega-chart-formatting.md`
- `docs/chat/vega-chart-format-approaches.md`

### Personalisation — Manager personas & tones

- Manager personas: the web UI exposes a set of curated manager personas (e.g. `PEP`, `ARTETA`, `AMORIM`, `MOURINHO`) surfaced in the chat header and persona lab. Each persona has a short description, traits, colour/emoji and an image; selecting one injects that persona's identity into the agent prompt so responses read like that manager.
- Tone selection: users can pick a response tone (configured in `lib/chat/constants.ts`) such as `Balanced`, `Savage Roast`, `Eternal Optimist`, or `Pure Delulu`. The selected tone is injected into the final prompt and affects how the agent phrases its answers.
- UI surface: `app/chat/page.tsx`, `components/chat/ChatHeader.tsx` and `components/chat/ChatInput.tsx` provide the selection controls and featured personas. Persona images are loaded via `getPersonaImagePath`.
- Telegram parity: the Telegram bot supports the same persona + tone settings (the bot uses the same `PERSONA_MAP` and `TONE_CONFIG`), and mini-app flows will reuse these settings where applicable.

### 7) Telegram bot integration

Implemented bot features include:
- `/chat`, direct-message prompts, `/index_manager`, `/index_league`
- webhook immediate ACK + background processing to prevent Telegram retry storms
- update deduplication middleware by `update_id`
- safe HTML formatting + message chunking for Telegram limits
- per-chat conversation continuity with retry on expired conversations

Telegram Mini Apps and charts:
- Core chat features are replicated in Telegram, including support for chart rendering inside Telegram Mini Apps (Vega-Lite specs provided by the agent are rendered inside mini-app views).
- The bot and mini-app flows reuse the same agent tooling and `conversationId` continuity where applicable.

Main code/docs:
- `app/api/webhook/telegram/route.ts`
- `lib/chat/telegram-bot.ts`
- `docs/architecture/telegram-bot.md`
- `scripts/setup-telegram-webhook.ts`

---

## High-level architecture

```text
User (Web / Telegram)
   ↓
Next.js API routes
   ├─ /api/chat (SSE stream)
   ├─ /api/webhook/telegram (non-blocking webhook)
   └─ /api/index/* (orchestration/run/status)
   ↓
Elastic Agent Builder (Kibana API)
   ↓
Elasticsearch index: fpl-gameweek-decisions
```

---

## API surface summary

### Chat
- `POST /api/chat`
  - Input: `{ question, conversationId?, includeVegaHint? }`
  - Output: SSE stream (`content`, `reasoning`, `toolCall`, `toolResult`, `conversationId`, `done`)

### Telegram webhook
- `POST /api/webhook/telegram`
  - Returns fast `200` and runs bot handling in background
- `GET /api/webhook/telegram`
  - basic health + webhook URL info

### Indexing
- `POST /api/index/orchestrate`
  - queue/resume and process bounded chunks (`max_steps`, `max_iterations`)
- `POST /api/index/run/{execution_id}`
  - process next chunk
- `GET /api/index/status/{execution_id}`
  - progress and terminal status
- `POST /api/index`
  - streaming progress route (legacy/manual)

---

## Environment variables

Required for chat:
- `ELASTICSEARCH_URL`
- `ELASTICSEARCH_API_KEY`
- `ELASTIC_AGENT_ID`

Optional chat debugging:
- `DEBUG_AGENT=true`
- `AGENT_LOG_FILE=<path>`

Required for Telegram integration:
- `TELEGRAM_BOT_TOKEN`
- `NEXT_PUBLIC_APP_URL` (recommended for links/webhook metadata)

Feature flags (if used in your environment setup):
- `ENABLE_ELASTICSEARCH=true`
- `ENABLE_CHAT=true`
- `ENABLE_MINI_LEAGUE_REPORTS=true`

Reference:
- `lib/config/features.ts`

---

## Local setup

1. Install dependencies

```bash
pnpm install
```

2. Configure environment in `.env.local` with the variables above.

3. Run app

```bash
pnpm dev
```

4. Open chat

- `http://localhost:3000/chat`

Note: the web UI persists a selected league id in localStorage under the key `fpl_wrapped_league_id` so your league selection is remembered between sessions.

5. (Optional) Set Telegram webhook

```bash
npx tsx scripts/setup-telegram-webhook.ts <your_base_url>/api/webhook/telegram
```

---

## Testing & operations

Useful scripts:
- `pnpm test:indexing:async` — smoke-test async indexing API behavior
- `pnpm es:health` — basic ES connectivity check
- `pnpm es:init` — initialize index assets

Operational runbook:
- `docs/chat/indexing/on-demand-indexing-api.md`

---

## Known design principles

- FPL-only assistant scope
- Prefer existing tools before ad-hoc query generation
- Check indexed coverage before declaring missing data
- Index only missing scope/range when possible
- Stream partial responses for better UX
- Keep Telegram webhook non-blocking and idempotent-ish (dedupe)

---

## Related docs

- `docs/chat/CHAT-SYSTEM-PROMPT.md`
- `docs/chat/es-tools/mini-league-agent-tools.md`
- `docs/chat/indexing/on-demand-indexing-api.md`
- `docs/architecture/telegram-bot.md`
- `docs/chat/vega-chart-formatting.md`
- `docs/chat/requirements/plan-chat.md`
