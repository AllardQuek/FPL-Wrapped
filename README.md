# FPL Wrapped + Chat 🏆

![FPL Wrapped](https://img.shields.io/badge/FPL-Wrapped-37003c?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge)

Get personalised FPL insights from two product tracks:

1. **FPL Wrapped** — Your Fantasy Premier League Season in Review - A "Spotify Wrapped" style experience for FPL managers
2. **FPL Chat** — "Chat with your data" assistant for web and Telegram, powered by [Elastic](https://www.elastic.co/)

## FPL Wrapped

**The goal:** to make data exploration fun, personal, and shareable

Inspired by **MBTI's 16 Personalities** framework, FPL Wrapped doesn't just churn out stats, but a **Manager Persona** that captures your FPL "DNA". Are you a Pep Guardiola (the overthinker), a José Mourinho (the pragmatist), or someone else?

*Key Features*

- Transfer analysis and grading
- Captaincy and bench decision analysis
- Chip usage analysis
- Squad contribution breakdown
- Manager persona reveal and summary cards

Start with: [docs/wrapped/README.md](docs/wrapped/README.md)


## FPL Chat

**The goal:** While Wrapped gives users a curated season summary, Chat provides flexible, on-demand answers and comparisons, backed by Elastic Agent Builder and Elasticsearch

*Key Features*

- Generate on-demand queries about FPL data
- Generate custom data visualisations
- Personalise responses with *manager personas* and *tone* customisations (e.g. Delusional Amorim)
- Auditable trails: see what queries and data are accessed via "System Operations"
- Explainable insights: follow the chain of thought reasoning via "Manager Logic"
- Automated indexing of FPL data (best-effort)
- [Manual indexing](https://fpl-wrapped-live.vercel.app/onboard) of FPL data with manager or league ID
- Meet users where they are: [Web UI](https://fpl-wrapped-live.vercel.app/chat) or [Telegram](https://t.me/fpl_chat_bot)

Start with: [docs/chat/README.md](docs/chat/README.md)

## Quick start

### Prerequisites

- Node.js 20+
- pnpm

### Install and run

```bash
pnpm install
pnpm dev
```

Open:

- Wrapped flow: `http://localhost:3000/wrapped/<teamId>`
- Chat UI: `http://localhost:3000/chat`

## Repo structure (high level)

- `app/` — Next.js routes for Wrapped and Chat
- `components/` — UI and card components
- `lib/` — analysis, chat integrations, Elasticsearch, shared utilities
- `docs/wrapped/` — Wrapped product docs (engine, ux, architecture, content, research, scripts)
- `docs/chat/` — Chat product docs (architecture, tools, workflows, indexing, requirements)
- [`docs/DOCUMENTATION_INDEX.md`](docs/DOCUMENTATION_INDEX.md) - Full docs index


## Contributing

Contributions welcome! Open an issue to discuss ideas or bugs, then submit a PR from a branch. Run `pnpm install` and `pnpm dev` to test locally 🙂

Disclaimer: This project is not affiliated with the Premier League — data is from the public FPL API.