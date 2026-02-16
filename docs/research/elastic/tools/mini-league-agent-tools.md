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

## Tools 2–9 — ES|QL Tools (aggregation queries)

For queries that **require** `STATS`, `COUNT`, `SUM`, `AVG`, `STD_DEV`, etc.  
Index Search can't aggregate — these ES|QL tools fill that gap.

> **All parameters are REQUIRED.** ES|QL cannot handle null parameter values (causes `verification_exception` and `Cannot inline parameter of unsupported type`). The LLM agent determines values from conversation context.

### Syntax reminders

- Sort: `SORT field DESC` (not `SORT -field`)
- Agg functions: `COUNT_DISTINCT` (not `DISTINCT_COUNT`), `STD_DEV` (not `STDDEV`)
- Text fields: use `manager_name.keyword` in `BY` / `KEEP` clauses
- League filter: `?league_id IN (league_ids)`

---

### Tool 2: `fpl.captaincy_spread`

Counts how many managers in the league picked each captain. Identifies consensus picks vs differentials.

**Params:** `?GW` (integer, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| WHERE gameweek == ?GW AND ?league_id IN (league_ids)
| STATS picks = COUNT(*) BY captain.name
| SORT picks DESC
```

---

### Tool 3: `fpl.captaincy_results`

Captain picks with actual points scored. Shows which captain choice paid off post-GW.

**Params:** `?GW` (integer, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| WHERE gameweek == ?GW AND ?league_id IN (league_ids)
| STATS picks = COUNT(*),
        avg_captain_pts = AVG(captain.points),
        total_captain_pts = SUM(captain.points)
    BY captain.name
| SORT avg_captain_pts DESC
```

---

### Tool 4: `fpl.chip_usage`

Counts chip usage across the league for a GW.

**Params:** `?GW` (integer, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| WHERE gameweek == ?GW AND ?league_id IN (league_ids)
| STATS chip_count = COUNT(*) BY chip_used
| SORT chip_count DESC
```

---

### Tool 5: `fpl.bench_points_ranking`

Points left on bench per manager. Higher = more wasted points.

**Params:** `?GW` (integer, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| WHERE gameweek == ?GW AND ?league_id IN (league_ids)
| STATS benched_points = SUM(points_on_bench) BY manager_id, manager_name.keyword
| SORT benched_points DESC
```

---

### Tool 6: `fpl.bench_boost_roi`

Bench Boost chip ROI — how many bench points each BB user got. Returns empty if nobody played bench_boost this GW.

**Params:** `?GW` (integer, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| WHERE gameweek == ?GW AND chip_used == "bench_boost" AND ?league_id IN (league_ids)
| STATS bench_boost_points = SUM(points_on_bench) BY manager_id, manager_name.keyword
| SORT bench_boost_points DESC
```

---

### Tool 7: `fpl.hot_cold_streaks`

Rolling N-week total points per manager. Identifies hot streaks and cold slumps.

**Params:** `?GW` (integer, required), `?N` (integer, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| WHERE gameweek >= (?GW - ?N + 1) AND gameweek <= ?GW
    AND ?league_id IN (league_ids)
| STATS recent_points = SUM(gw_points) BY manager_id, manager_name.keyword
| SORT recent_points DESC
```

---

### Tool 8: `fpl.consistency_score`

Season-long consistency — standard deviation of weekly points. Lower volatility = more consistent.

**Params:** `?SEASON` (keyword, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| WHERE season == ?SEASON AND ?league_id IN (league_ids)
| STATS volatility = STD_DEV(gw_points),
        avg_pts = AVG(gw_points),
        gws = COUNT(*)
    BY manager_id, manager_name.keyword
| SORT volatility ASC
```

---

### Tool 9: `fpl.season_summary`

Season-long aggregate stats for each manager in a league.

**Params:** `?SEASON` (keyword, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| WHERE season == ?SEASON AND ?league_id IN (league_ids)
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

### Tool 10: `fpl.manager_profiles`

Rich per-manager profile card for the league. Captures team-building style (team value), captaincy variety, chip strategy, and total performance in one query.

**Params:** `?SEASON` (keyword, required), `?league_id` (integer, required)

```esql
FROM fpl-gameweek-decisions
| WHERE season == ?SEASON AND ?league_id IN (league_ids)
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
| WHERE gameweek == ?GW AND ?league_id IN (league_ids)
| MV_EXPAND transfer_in_names
| STATS transfers_in = COUNT(*) BY transfer_in_names
| SORT transfers_in DESC
```

**`fpl.differential_detection`** — players owned by ≤ N managers

```esql
FROM fpl-gameweek-decisions
| WHERE gameweek == ?GW AND ?league_id IN (league_ids)
| MV_EXPAND starter_names
| STATS owners = COUNT_DISTINCT(manager_id) BY starter_names
| WHERE owners <= ?N
| SORT owners ASC
```

**`fpl.template_core_players`** — most-owned starters

```esql
FROM fpl-gameweek-decisions
| WHERE gameweek == ?GW AND ?league_id IN (league_ids)
| MV_EXPAND starter_names
| STATS owner_count = COUNT(*) BY starter_names
| SORT owner_count DESC
```

**`fpl.hit_takers`** — managers who took transfer hits

```esql
FROM fpl-gameweek-decisions
| WHERE gameweek == ?GW AND ?league_id IN (league_ids) AND total_transfer_cost > 0
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
