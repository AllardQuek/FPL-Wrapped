# Chat Architecture (Canonical)

This folder contains the canonical architecture documentation for the FPL chat product.

## Scope policy

- **Current state first**: each doc describes behavior implemented in the codebase today.
- **Roadmap callouts**: short sections labeled "Roadmap" describe intended future behavior.
- **Separation of concerns**: each domain has its own architecture page.

## Reading order

1. [System Overview](./system-flow.md)
2. [Elasticsearch & Indexing Architecture](./elasticsearch-indexing.md)
3. [Elastic Agent Builder Integration](./agent-builder.md)
4. [Charts Storage & Rendering](./charts-storage-rendering.md)
5. [Telegram Integration](./telegram-integration.md)

## Canonical runtime anchors

- Chat API: `app/api/chat/route.ts`
- Agent stream client: `lib/chat/elastic-agent.ts`
- Index orchestration: `app/api/index/orchestrate/route.ts`
- Chart storage: `lib/chat/chart-storage.ts`
- Telegram webhook: `app/api/webhook/telegram/route.ts`

## Related references

- Product overview: [../README.md](../README.md)
- Tool catalog and rationale: [../es-tools/mini-league-agent-tools.md](../es-tools/mini-league-agent-tools.md)
- Indexing API runbook: [../indexing/on-demand-indexing-api.md](../indexing/on-demand-indexing-api.md)
- Telegram operational notes: [../../architecture/telegram-bot.md](../../architecture/telegram-bot.md)
