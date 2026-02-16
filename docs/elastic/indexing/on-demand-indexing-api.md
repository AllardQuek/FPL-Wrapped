# On-Demand Indexing API (Async + Chunked)

This document describes how on-demand indexing currently works in this repo, and how to use it safely with Elastic Agent Builder workflows.

---

## Why this architecture

Large league indexing can take minutes and is at risk of serverless runtime limits if done in one request.  
To reduce timeout risk, indexing is split into:

1. **Queue** an execution (`execution_id`)
2. **Run chunks** of work (bounded steps per call)
3. **Poll status** until completed/failed

This is implemented with persisted execution state in Elasticsearch index:

- `fpl-indexing-executions`

---

## Implemented API surface

### 0) Single-call orchestrator (recommended for simplest agent setup)

- **Route:** `POST /api/index/orchestrate`
- **File:** `app/api/index/orchestrate/route.ts`

This endpoint creates an execution and runs chunk iterations in the same request with bounded limits.

Request body supports:

- `type`: `league` or `manager`
- `league_id` or `manager_id` (based on type)
- `from_gw`, `to_gw`
- `max_steps` (1–50)
- `max_iterations` (1–30)

For Agent Builder, the recommended workflow (`docs/elastic/workflows/index-and-wait.yaml`) intentionally pins:

- `max_steps: 5`
- `max_iterations: 8`

This avoids letting the LLM choose unsafe runtime knobs.

Response:

- `200` with `status: completed` when finished within this call
- `202` with `status: running` + `execution_id` when more work remains

If response is `running`, continue with `run` + `status` endpoints.

### 1) Run execution chunk

- **Route:** `POST /api/index/run/{execution_id}`
- **File:** `app/api/index/run/[execution_id]/route.ts`
- **Body (optional):**

```json
{
  "max_steps": 5
}
```

- `max_steps` controls how much work runs in one invocation (1–50 enforced in runner).

### 2) Check execution status

- **Route:** `GET /api/index/status/{execution_id}`
- **File:** `app/api/index/status/[execution_id]/route.ts`
- **Returns:** execution status + progress counters + timestamps.

---

## Execution model

Execution state and progress are managed by:

- `lib/elasticsearch/indexing-executions.ts`
- `lib/elasticsearch/indexing-runner.ts`

Core behavior:

- State is persisted after each chunk.
- Runner resumes from saved pointers (`current_gw`, `current_manager_index`).
- Terminal states: `completed` or `failed`.

---

## Elastic Agent Builder workflows

Current workflow files:

- `docs/elastic/workflows/index-and-wait.yaml` (single-tool orchestrator, recommended)
- `docs/elastic/workflows/run-index-execution.yaml` (run chunk)
- `docs/elastic/workflows/get-index-status.yaml` (poll status)

### Recommended workflow orchestration in the agent

1. User asks about league/manager data not in index.
2. Agent calls `index-fpl-and-wait`.
3. If result status is `completed`, proceed to answer original query.
4. If result status is `running`, use returned `execution_id` and loop:
  - call `get-fpl-indexing-status`
  - if status is `running`, call `run-fpl-indexing-execution`
  - stop when status is `completed` or `failed`
5. On `completed`, retry original analytics query.

### Suggested guardrails in agent instructions

- Do not run unbounded loops; cap iterations.
- For large ranges/leagues, use smaller `max_steps` (e.g., 3–10).
- Surface progress to user every cycle.
- If status is `failed`, return error and suggest retry.

---

## Local and production testing

Smoke-test script:

- `scripts/test-indexing-async-api.ts`
- npm command: `pnpm test:indexing:async`

Examples:

```bash
# Local manager test
pnpm test:indexing:async -- --base http://localhost:3000 --mode manager --manager 1 --from 1 --to 1

# Local league test
pnpm test:indexing:async -- --base http://localhost:3000 --mode league --league 2109037 --from 1 --to 1

# Production target
pnpm test:indexing:async -- --base https://fpl-wrapped-live.vercel.app --mode manager --manager 1 --from 1 --to 1
```

---

## Production notes and limits

- This design is safer than synchronous full-index calls, but still requires repeated run invocations.
- Without a scheduler/queue trigger (cron, task queue, etc.), executions progress only when `run` is called.
- Verify deployed routes/methods in production before Agent Builder rollout.
- Add endpoint auth for write/run routes before exposing broadly.

---

## Next hardening steps (recommended)

1. Add scheduler to call `/api/index/run/{execution_id}` automatically.
2. Add execution lock/lease to prevent concurrent double-running.
3. Add pagination for full league manager discovery beyond first standings page.
4. Add retention cleanup for stale execution docs.
5. Add auth guard (secret/header) for queue and run endpoints.
