# API wrapper patterns and design decisions

This document explains the rationale and key design decisions for the thin wrapper functions used around calls to the FPL API (see `lib/fpl-api.ts`). It covers why wrappers exist, caching and rate-limit strategies, testing guidance, and when to change behaviour.

## Why use wrapper functions

- Single source of truth for endpoints: avoid duplicating URL strings across the codebase.
- Clear intent and typing: each wrapper returns a specific typed value (e.g. `Promise<ManagerHistory>`), improving IDE autocomplete and preventing mistakes.
- Centralized behaviour: retries, headers, rate-limit handling, logging, and auth changes can be made in one place (`fetchFPL`) and complemented by wrappers.
- Caching and side-effects: wrappers encapsulate caching (e.g. `picksCache`, `playerSummaryCache`) so callers do not need to implement duplicate-request logic.
- Testability: tests can stub or mock wrapper functions instead of global `fetch`, making unit tests simpler and less brittle.

## Key concepts in `lib/fpl-api.ts`

- `fetchFPL(endpoint)`: low-level fetch with retry and basic rate-limit handling. All HTTP requests go through this helper.
- Wrapper functions (e.g. `getManagerHistory`, `getGameWeekPicks`): thin functions that call `fetchFPL` with a specific endpoint and may add caching or other small behaviours.
- Caches:
  - `bootstrapCache` (in-memory, optional file cache in development) — used by `getBootstrapData()`.
  - `liveCache`, `picksCache`, `playerSummaryCache` — shared maps to avoid duplicate requests across the app.

## Caching and rate-limit strategy

- `fetchFPL` implements simple retry logic and handles `429` responses by reading the `Retry-After` header when present.
- Avoid aggressive batching without backoff. If you add heavier parallelization, consider exponential backoff and circuit-breaker behaviour.

### Local vs Production caching

- Local / Dev
  - You typically run a single dev server process. In-memory caches are effective and predictable for a single process and speed up iteration.
  - The repo enables an optional dev file cache for bootstrap data (`.cache/fpl-bootstrap.json`) to persist across dev server restarts and reduce fetches while developing.
  - Helpers like `saveManagerDataMock()` write to `.cache` to produce local fixtures for debugging.

- Production (Vercel / serverless)
  - Production is multi-instance and ephemeral: in-memory caches only live for a single instance and are lost on cold starts or instance restarts.
  - The file system is read-only on Vercel except for `/tmp`, which is ephemeral and not shared across instances, so file-based caches are not suitable for global caching in production.
  - Relying on per-instance caches in production can lead to inconsistent behaviour across replicas and frequent cache misses.

- Recommendations
  - Keep the dev file cache for local convenience, but guard it behind `NODE_ENV === 'development'` (as is already implemented).
  - Use small in-memory maps (e.g. `picksCache`, `playerSummaryCache`) for per-request de-duplication and short-lived benefits within a single instance.
  - For cross-instance or long-lived caching in production, use an external shared cache (Redis, Memcached, or Vercel Edge KV / Platform Cache) with appropriate TTLs and invalidation.
  - Consider build-time fetching or ISR (Next.js revalidate) for semi-static data (like bootstrap) to avoid runtime calls where possible.
  - Always design for cache misses and preserve robust retry/backoff and rate-limit handling in `fetchFPL`.

---

*** End Patch

## Testing & mocking

- Prefer mocking wrapper functions (e.g. `getManagerHistory`) in unit tests. This keeps tests independent from network details and lets you craft small, focused fixtures.
- Use `saveManagerDataMock()` (development helper) for generating local mock fixtures if needed.

## When to change or extend

- Add telemetry (metrics/tracing) inside `fetchFPL` or specific wrappers for slow endpoints.
- Move to a more advanced HTTP client if you need features like connection pooling or advanced retry policies — keep the wrapper API stable so callers are unaffected.

## Example usage

Call `getGameWeekPicks(managerId, gw)` instead of `fetchFPL('/entry/${id}/event/${gw}/picks/')` — you get caching and a stable API.

---
Last updated: 2026-01-03
