# FPL Mini-League Agent Tools

Tools for the FPL mini-league report agent, configured in [Elastic Agent Builder](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/tools).

**Index:** `fpl-gameweek-decisions`  
**Schema:** `lib/elasticsearch/fpl-gameweek-decisions-index-schema.json`

---

## Architecture & Design Rationale

### Two tool types, different strengths

| | Index Search Tool | ES|QL Tools |
|---|---|---|
| **How it works** | LLM dynamically generates ES\|QL or query DSL from natural language | Pre-defined query, agent just fills in params |
| **Flexibility** | Any combination of filters — manager, league, GW, season, etc. | Fixed params, all required |
| **Aggregation** | Can generate `STATS` queries but **may get syntax wrong** (e.g. `STDDEV` instead of `STD_DEV`, missing `.keyword`) | **Guaranteed correct** — query is pre-validated |
| **Row limit** | Max 50 rows (hard cap in UI), no pagination | No row limit — aggregation runs server-side |
| **Best for** | Flexible lookups, exploratory questions, any-filter-combo | Analytical patterns: counts, sums, averages, rankings |

### Why not just use Index Search for everything?

The Index Search tool **can** generate aggregation queries dynamically. However, ES|QL tools guarantee correctness for analytical patterns:

- Index Search might use `STDDEV` instead of `STD_DEV` ❌
- Index Search might use `manager_name` instead of `manager_name.keyword` in `BY` clauses ❌
- Index Search might not handle rolling-window arithmetic (`?GW - ?N + 1`) correctly ❌
- Index Search returns max 50 rows — aggregation queries have no such limit ✅

### Why not just use ES|QL tools for everything?

ES|QL tools require **all parameters to be required** — the verifier rejects null values at both save time (`verification_exception`) and execution time (`Cannot inline parameter of unsupported type`). This makes optional/flexible filtering impossible in a single ES|QL tool.

### Decision summary

- **Index Search** → flexible filtering (any combo of manager, league, GW, season)
- **ES|QL tools** → aggregation patterns where correctness matters (STATS, COUNT, SUM, AVG, STD_DEV)
- **Coverage workflow** → preflight check for indexed gameweek coverage before search/indexing

---

## Tool 0 — Indexing Workflows (On-demand)

These workflows can be triggered by the agent when data for a requested league or manager is not found in the index.

See detailed architecture + runbook: `docs/elastic/indexing/on-demand-indexing-api.md`.

### Recommended default: `index-fpl-and-wait`

Use this as the primary indexing tool for the cleanest agent setup. It can complete small jobs in one call and returns `running` + `execution_id` for larger jobs.

**Workflow tool summaries:**
- `fpl.index-and-wait`: Start/continue indexing and attempt to finish within a safe per-request budget (recommended and agent-facing).
- `fpl.run-indexing-execution`: Manual troubleshooting/continuation tool (not agent-facing by default).
- `fpl.get-indexing-status`: Manual troubleshooting/status tool (not agent-facing by default).

**Inputs:**
- `type` (`league` or `manager`)
- `league_id` or `manager_id`
- `from_gw`, `to_gw`
- runtime knobs are fixed in workflow for safety (`max_steps=5`, `max_iterations=8`)

For long-running jobs, call `fpl.index-and-wait` again with the same inputs; backend resume is handled automatically.

### Coverage preflight workflow: `fpl.check-indexed-data`

Use this before query execution when the user asks about a specific league/manager and GW or GW range.

**Why:**
- Avoid empty-result loops caused by partial indexing.
- Detect sparse coverage (for example GW 1-3 and 6-8 present, 4-5 missing).
- Index only missing GWs instead of re-indexing full ranges.

**Inputs:**
- `league_id` (number, optional)
- `manager_id` (number, optional)
- `gameweek` (number, optional)
- `from_gw` (number, optional)
- `to_gw` (number, optional)

**Output expectations:**
- Return present GW coverage (`VALUES(gameweek)`), manager count, and last update marker.
- Agent computes and explains missing GWs from the requested range.

**Agent routing policy:**
- Run `fpl.check-indexed-data` first when coverage uncertainty exists.
- If required GWs are missing, offer `fpl.index-and-wait` scoped only to missing GW range(s).
- If coverage exists, continue with normal search/aggregation tools.

### 1. `run-fpl-indexing-execution`
Processes a chunk of work for an existing execution (manual troubleshooting/continuation only).

**Inputs:**
- `execution_id` (text, required): ID returned by `index-fpl-and-wait`
- `max_steps` (number, optional, default 5): number of gameweek steps per run

**Endpoint:** `POST /api/index/run/{execution_id}`

### 2. `get-fpl-indexing-status`
Fetches status/progress for an execution (manual troubleshooting/status only).

**Inputs:**
- `execution_id` (text, required): ID returned by `index-fpl-and-wait`

**Endpoint:** `GET /api/index/status/{execution_id}`

---

## Tool 1 — Index Search Tool (flexible queries)

This is the **primary tool** for flexible querying. The LLM dynamically generates ES|QL or query DSL based on the user's natural language — no pre-defined params needed, no null-handling issues.

**Use for:** any combination of filters (manager, league, GW, season, etc.) that does NOT require aggregation.

### Configuration (enter in Agent Builder UI)

| Field | Value |
|-------|-------|
| **Tool ID** | `fpl.search_decisions` |
| **Name** | `Search FPL Decisions` |
| **Type** | `Index Search` |
| **Index pattern** | `fpl-gameweek-decisions` |
| **Row limit** | `50` |

### Description

```
Searches FPL gameweek decision records. Each document is one manager's team selection and results for a single gameweek.

Use this tool when the user asks about specific managers, gameweeks, leagues, captaincy picks, chip usage, team value, bench points, transfers, or any combination of filters that does NOT require aggregation (COUNT, SUM, AVG, etc.).

For aggregation queries (e.g. 'which captain was most popular', 'who left the most points on bench', 'total points this season'), ALWAYS use the specialised ES|QL tools instead — they process ALL matching data on the server and return accurate aggregated results.

LIMITATIONS:
- This tool returns a maximum of 50 rows. If the result set is larger, rows beyond 50 are silently dropped.
- Do NOT use this tool when the user needs totals, counts, averages, rankings, or any computation across more than 50 records.
- For season-wide or league-wide analysis, use the ES|QL aggregation tools which have no row limit.

Key fields:
  gameweek (int, 1-38), manager_id (int), manager_name (text),
  league_ids (int array), captain.name (keyword),
  captain.points (int), captain.multiplier (int),
  vice_captain.name (keyword), chip_used (keyword: wildcard,
  bench_boost, triple_captain, free_hit, or null),
  gw_points (int), gw_rank (int), points_on_bench (int),
  team_value (float), bank (float), season (keyword, e.g. '2024-25'),
  team_name (text).

Nested: starters[].name, bench[].name, transfers[].player_in_name

NOTES:
- league_ids is multi-valued — filter with 'terms' query
- manager_name is text — use manager_name.keyword for exact match
- chip_used is null when no chip was used
```

### Custom instructions

```
Always include manager_id, manager_name, and gameweek in results.
When filtering by league, use a terms query on league_ids.
When filtering by manager_name, use match query on manager_name or term query on manager_name.keyword for exact match.
Sort by gw_points DESC by default unless user specifies otherwise.
```

### Example user questions

| User Question | What the LLM generates |
|---------------|----------------------|
| "Who did John captain in GW 25?" | filter manager_name + gameweek, return captain.name |
| "Show GW 25 for league 12345" | filter gameweek + league_ids, return all fields |
| "What chips were used this season?" | filter season, return chip_used |
| "Show transfers for manager 456 in GW 25" | filter manager_id + gameweek, return transfers |
| "Which manager has the best team value?" | filter gameweek, sort by team_value DESC |

---

## Tools 2–11 — ES|QL Tools (aggregation queries)

For queries that **require** `STATS`, `COUNT`, `SUM`, `AVG`, `STD_DEV`, etc.  
Index Search can't aggregate — these ES|QL tools fill that gap.

> **All parameters are REQUIRED.** ES|QL cannot handle null parameter values (causes `verification_exception` and `Cannot inline parameter of unsupported type`). The LLM agent determines values from conversation context. When a tool is scoped to a single league (requires `?league_id`), the season is typically implied by that league — in those cases a separate `?SEASON` parameter is not necessary and the tool omits it (season is inferred from `league_id`).

### Syntax reminders

- Sort: `SORT field DESC` (not `SORT -field`)
- Agg functions: `COUNT_DISTINCT` (not `DISTINCT_COUNT`), `STD_DEV` (not `STDDEV`)
- Text fields: use `manager_name.keyword` in `BY` / `KEEP` clauses
- League filter: `league_ids == ?league_id`

---

### Tool 2: `fpl.captaincy_spread`

Counts how many managers in the league picked each captain. Identifies consensus picks vs differentials.

**Params:** `?GW` (integer, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND league_ids
| WHERE gameweek == ?GW AND league_ids == ?league_id
| STATS picks = COUNT(*) BY captain.name
| SORT picks DESC
```

---

### Tool 3: `fpl.league_size`

Helper ES|QL tool — returns the number of distinct managers in a league for a given gameweek. Use this before `fpl.differential_detection` when `?league_size` is not known.

**Params:** `?GW` (integer, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND league_ids
| WHERE gameweek == ?GW AND league_ids == ?league_id
| STATS league_size = COUNT_DISTINCT(manager_id)
```

Agent guidance: If `?league_size` is not supplied to `fpl.differential_detection`, call `fpl.league_size` first and pass its `league_size` result into `fpl.differential_detection`.

---

### Tool 4: `fpl.captaincy_results`

Captain picks with actual points scored. Shows which captain choice paid off post-GW.

**Params:** `?GW` (integer, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND league_ids
| WHERE gameweek == ?GW AND league_ids == ?league_id
| STATS picks = COUNT(*),
        avg_captain_pts = AVG(captain.points),
        total_captain_pts = SUM(captain.points)
    BY captain.name
| SORT avg_captain_pts DESC
```

---

### Tool 5: `fpl.chip_usage`

Counts chip usage across the league for a GW.

**Params:** `?GW` (integer, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND league_ids
| WHERE gameweek == ?GW AND league_ids == ?league_id
| STATS chip_count = COUNT(*) BY chip_used
| SORT chip_count DESC
```

---

### Tool 6: `fpl.bench_points_ranking`

Points left on bench per manager. Higher = more wasted points.

**Params:** `?GW` (integer, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND league_ids
| WHERE gameweek == ?GW AND league_ids == ?league_id
| STATS benched_points = SUM(points_on_bench) BY manager_id, manager_name.keyword
| SORT benched_points DESC
```

---

### Tool 7: `fpl.bench_boost_roi`

Bench Boost chip ROI — how many bench points each BB user got. Returns empty if nobody played bench_boost this GW.

**Params:** `?GW` (integer, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND league_ids
| WHERE gameweek == ?GW AND chip_used == "bench_boost" AND league_ids == ?league_id
| STATS bench_boost_points = SUM(points_on_bench) BY manager_id, manager_name.keyword
| SORT bench_boost_points DESC
```

---

### Tool 8: `fpl.hot_cold_streaks`

Rolling N-week total points per manager. Identifies hot streaks and cold slumps.

**Params:** `?GW` (integer, required), `?N` (integer, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND league_ids
| WHERE gameweek >= (?GW - ?N + 1) AND gameweek <= ?GW
    AND league_ids == ?league_id
| STATS recent_points = SUM(gw_points) BY manager_id, manager_name.keyword
| SORT recent_points DESC
```

---

### Tool 9: `fpl.consistency_score`

League-season consistency — standard deviation of weekly points (season inferred from the league). Lower volatility = more consistent.

**Params:** `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND league_ids
| WHERE league_ids == ?league_id
| STATS volatility = STD_DEV(gw_points),
        avg_pts = AVG(gw_points),
        gws = COUNT(*)
    BY manager_id, manager_name.keyword
| SORT volatility ASC
```

---

### Tool 10: `fpl.season_summary`

Season-long aggregate stats for each manager in a league (season inferred from the league).

**Params:** `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND league_ids
| WHERE league_ids == ?league_id
| STATS total_pts = SUM(gw_points),
        avg_pts = AVG(gw_points),
        best_gw = MAX(gw_points),
        worst_gw = MIN(gw_points),
        total_benched = SUM(points_on_bench),
        gws_played = COUNT(*)
    BY manager_id, manager_name.keyword
| SORT total_pts DESC
```

---

### Tool 11: `fpl.manager_profiles`

Rich per-manager profile card for the league. Captures team-building style (team value), captaincy variety, chip strategy, and total performance in one query. Season is inferred from the `league_id` provided.

**Params:** `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND league_ids
| WHERE league_ids == ?league_id
| STATS total_gameweeks = COUNT(*),
        total_gw_points = SUM(gw_points),
        avg_team_value = AVG(team_value),
        max_team_value = MAX(team_value),
        chips_used = VALUES(chip_used),
        unique_captains = COUNT_DISTINCT(captain.name)
    BY manager_id, manager_name.keyword, team_name.keyword
| SORT total_gw_points DESC
```

---

### Tool 12: `fpl.manager_season_summary`

Fetches a precomputed season summary for a single manager (also known as "Wrapped") by calling the internal FPL Wrapped manager API. Use this tool when the user asks for a detailed season summary (per-GW data, aggregates, transfers, chips, bench/starting breakdowns) for a specific `manager_id` and you want a single consolidated JSON response rather than assembling many ES queries.

Inputs: `?manager_id` (integer, required)

Implementation notes:
- This tool calls the application manager route (`/api/manager/{id}`) and returns the manager's season summary JSON (aggregates + per-gameweek documents) as produced by the backend.
- Prefer this tool when the backend's summary is sufficient — it avoids multiple ES queries and respects any app-side denormalization or post-processing.
- If additional league-scoped aggregations are needed (e.g. captaincy spread within a league), combine this tool with the ES|QL aggregation tools.

Example usage: "Show me a season summary for manager 456" → call `fpl.manager_season_summary` with `manager_id=456` and return the JSON summary to the agent for rendering or further analysis.

---

## Future — Requires Denormalized Fields

ES|QL cannot access nested fields (`starters`, `bench`, `transfers`). The Index Search Tool **can** query nested fields using nested queries, but cannot aggregate them.

For aggregation over nested data (e.g. "most owned starters", "most transferred-in players"), add denormalized flat MV fields during indexing, then use `MV_EXPAND` in ES|QL.

### Required flat fields (add to indexing pipeline)

| Field | Type | Source |
|-------|------|--------|
| `starter_names` | `keyword[]` | `starters[*].name` |
| `starter_element_types` | `keyword[]` | `starters[*].element_type` |
| `transfer_in_names` | `keyword[]` | `transfers[*].player_in_name` |
| `transfer_count` | `integer` | `transfers.length` |
| `total_transfer_cost` | `integer` | `SUM(transfers[*].cost)` |
| `transfer_timestamps` | `date[]` | `transfers[*].timestamp` |

### Future ES|QL tools (register after denormalization)

**`fpl.transfer_watchlist`** — most transferred-in players

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND league_ids
| WHERE gameweek == ?GW AND league_ids == ?league_id
| MV_EXPAND transfer_in_names
| STATS transfers_in = COUNT(*) BY transfer_in_names
| SORT transfers_in DESC
```

**`fpl.differential_detection`** — players owned by a super-majority (>50%) of managers in the league

This tool identifies template/core players by returning starters that are owned by more than half of the managers in the target league for the specified gameweek.

**Params:** `?GW` (integer, required), `?league_id` (integer, required), `?league_size` (integer, required)

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND league_ids
| WHERE gameweek == ?GW AND league_ids == ?league_id
| MV_EXPAND starter_names
| STATS owners = COUNT_DISTINCT(manager_id) BY starter_names
| WHERE owners > (?league_size * 0.5)
| SORT owners DESC
```

**`fpl.template_core_players`** — most-owned starters

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND league_ids
| WHERE gameweek == ?GW AND league_ids == ?league_id
| MV_EXPAND starter_names
| STATS owner_count = COUNT(*) BY starter_names
| SORT owner_count DESC
```

**`fpl.hit_takers`** — managers who took transfer hits

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND league_ids
| WHERE gameweek == ?GW AND league_ids == ?league_id AND total_transfer_cost > 0
| KEEP manager_id, manager_name.keyword, gw_points, total_transfer_cost, transfer_count
| SORT total_transfer_cost DESC
```

### Denormalization code (add to `indexing-service.ts`)

```typescript
// Add these flat fields during document creation
doc.starter_names = starters.map(s => s.name);
doc.starter_element_types = starters.map(s => s.element_type);
doc.transfer_in_names = transfers.map(t => t.player_in_name);
doc.transfer_timestamps = transfers.map(t => t.timestamp);
doc.transfer_count = transfers.length;
doc.total_transfer_cost = transfers.reduce((sum, t) => sum + (t.cost || 0), 0);
```
