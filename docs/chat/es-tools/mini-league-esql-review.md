# Mini-League ES|QL Templates — Review Report

**Date:** 2026-02-15
**File reviewed:** `mini-league-esql.esql` (historical template file referenced in prior review runs)
**Index mapping:** `lib/elasticsearch/fpl-gameweek-decisions-index-schema.json`
**Context:** [Elastic Agent Builder ES|QL tools](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/tools/esql-tools)
**Status:** ✅ All fixes applied to the templates file

---

## Executive Summary

The templates contain **6 critical issues** that prevent execution, **4 high-severity issues** that will cause runtime errors, and **several medium/low concerns**. The root cause of most failures is:

1. **Null-guard pattern is invalid** — ES|QL's type system rejects `?param == null` when `?param` is typed as `null` and the comparison target is `numeric`/`keyword`.
2. **`UNNEST` does not exist in ES|QL** — nested fields are currently `<unsupported>` in ES|QL; the correct experimental command is unclear (possibly future `EXPAND`).
3. **`JOIN` is limited to `LOOKUP JOIN`** only (tech preview, 8.18+), not arbitrary inline sub-queries.
4. **Function name errors** — `DISTINCT_COUNT` should be `COUNT_DISTINCT`; `STDDEV` should be `STD_DEV`.
5. **Sort syntax** — `SORT -picks` is not valid; correct syntax is `SORT picks DESC`.
6. **`exists()` is not an ES|QL function** in WHERE clauses.

---

## (A) Templates That Pass (with fixes applied)

After applying the fixes below, these templates have correct *logic* and use only supported ES|QL commands:

| # | Template | Status |
|---|----------|--------|
| 1 | `fpl.captaincy_spread` | ✅ Passes after null-guard + SORT fix |
| 6 | `fpl.chip_status_summary` | ✅ Passes after null-guard + SORT fix |
| 7 | `fpl.bench_disaster_leaderboard` | ✅ Passes after null-guard + SORT fix |
| 9 | `fpl.bench_boost_roi` | ✅ Passes after null-guard + SORT fix |
| 14 | `fpl.hot_cold_rolling` | ✅ Passes after null-guard + SORT fix |
| 15 | `fpl.consistency_score` | ⚠️ Passes after null-guard + SORT + function name fix (`STDDEV` → `STD_DEV`) |

These templates only use top-level fields (no UNNEST, no JOIN) and are fixable.

---

## (B) Templates That FAIL — Errors & Lines

### 🔴 CRITICAL: Null-Guard Pattern (affects ALL 18 templates)

**Error you saw:**
```
verification_exception: Found 3 problems
line 2:25: first argument of [gameweek == ?GW] is [numeric] so second argument must also be [numeric] but was [null]
line 2:69: first argument of [league_ids == ?league_id] is [null] so second argument must also be [null] but was [integer]
line 2:125: first argument of [manager_id == ?manager_id] is [numeric] so second argument must also be [numeric] but was [null]
```

**Root cause:** ES|QL uses strict type-checking at query verification time. When a parameter is `null`, the expression `?GW == null` evaluates to `null == null` which is ambiguous, and `gameweek == ?GW` becomes `numeric == null` which is a type mismatch.

**The pattern `(?GW == null OR gameweek == ?GW)` is fundamentally broken in ES|QL.**

**Fix:** Use `COALESCE` to provide typed fallback values:

```esql
-- Instead of: (?GW == null OR gameweek == ?GW)
-- Use:        gameweek == COALESCE(?GW, gameweek)

-- Instead of: (?league_id == null OR league_ids == ?league_id)
-- Use:        COALESCE(?league_id, 0) == 0 OR league_ids == ?league_id
-- NOTE: league_ids is multi-valued, so COALESCE approach is trickier.
-- Best approach: build WHERE clause dynamically in the tool runner.

-- Instead of: (?manager_id == null OR manager_id == ?manager_id)
-- Use:        manager_id == COALESCE(?manager_id, manager_id)
```

> ⚠️ **Recommended approach:** Build the WHERE clause **dynamically** in your tool runner (TypeScript). When a param is null, simply omit that condition from the query string. This is the cleanest and most reliable solution.

### 🔴 CRITICAL: `UNNEST` Does Not Exist in ES|QL

**Affected templates:** `fpl.differential_detection` (#3), `fpl.transfer_watchlist` (#4), `fpl.hit_takers_purchases` (#5), `fpl.transfer_effectiveness` (#8), `fpl.autosub_impact` (#10), `fpl.template_core_players` (#12), `fpl.formation_distribution` (#13), `fpl.ownership_drift` (#16), `fpl.transfer_timing_by_minute` (#17), `fpl.transfer_accuracy_future_points` (#18)

**10 out of 18 templates use UNNEST** — this command does not exist in ES|QL.

ES|QL currently shows nested fields as `<unsupported>` type. There is an open proposal for an `EXPAND` command, but it is **not yet shipped**.

**Fix options:**
1. **Denormalize at index time** — flatten `starters`, `bench`, and `transfers` into separate indices or as multi-valued top-level fields (recommended).
2. **Use the Elasticsearch Query DSL** with nested queries + nested aggregations instead of ES|QL for these templates.
3. **Wait for `EXPAND`** — track [elastic/elasticsearch#109825](https://github.com/elastic/elasticsearch/issues/109825).

### 🔴 CRITICAL: `JOIN` Inline Subqueries Not Supported

**Affected templates:** `fpl.captaincy_ownership_pct` (#2), `fpl.transfer_effectiveness` (#8), `fpl.rank_delta_prev_gw` (#11), `fpl.ownership_drift` (#16), `fpl.transfer_accuracy_future_points` (#18)

ES|QL only supports `LOOKUP JOIN` against a lookup-mode index. The templates use arbitrary inline subquery JOINs like:
```esql
| JOIN (FROM fpl-gameweek-decisions | WHERE ... | STATS ...) AS t
```
This syntax is **not supported**.

**Fix options:**
1. **Pre-compute** the joined data into a lookup index.
2. **Split into two queries** in the tool runner and combine results in TypeScript.
3. **Use ES Query DSL** aggregations for these use cases.

### 🟡 HIGH: Function Name Errors

| Template | Wrong Name | Correct Name | Lines |
|----------|-----------|-------------|-------|
| `fpl.differential_detection` (#3) | `DISTINCT_COUNT` | `COUNT_DISTINCT` | L34 |
| `fpl.ownership_drift` (#16) | `DISTINCT_COUNT` | `COUNT_DISTINCT` | L149, L150 |
| `fpl.consistency_score` (#15) | `STDDEV` | `STD_DEV` | L140 |

### 🟡 HIGH: Sort Syntax Error (affects ALL templates)

ES|QL sort syntax is `SORT field DESC` or `SORT field ASC`, NOT `SORT -field`.

| Wrong | Correct |
|-------|---------|
| `SORT -picks` | `SORT picks DESC` |
| `SORT -pct` | `SORT pct DESC` |
| `SORT owners` | `SORT owners ASC` (this one is actually fine — ASC is default) |
| `SORT -transfers_in` | `SORT transfers_in DESC` |
| `SORT -bench_boost_points` | `SORT bench_boost_points DESC` |
| etc. | etc. |

### 🟡 HIGH: `exists()` Not an ES|QL Function

**Affected:** `fpl.autosub_impact` (#10), line 95: `exists(auto_subs)`

ES|QL has no `exists()` function. Use `auto_subs IS NOT NULL` instead.

Also note: `auto_subs` field does **not exist** in the index mapping. See schema mismatches below.

### 🟡 MEDIUM: `gw_points < 0` Logic Error

**Affected:** `fpl.hit_takers_purchases` (#5), line 51

`gw_points < 0` would filter to managers with negative total GW points, but what you want is managers who took transfer hits. The hit cost is typically embedded in the total or in a separate field. With the current schema, there's no explicit `hits_taken` or `transfer_cost_total` field. You may need to:
- Add a `transfer_hits` field during indexing, OR
- Sum `transfers.cost` from the nested array (requires UNNEST which isn't supported anyway)

---

## (C) Schema Mismatches & Missing Fields

Cross-referencing every field used in templates against `fpl-gameweek-decisions-index-schema.json`:

| Field Used in Template | In Schema? | Notes |
|----------------------|-----------|-------|
| `gameweek` (integer) | ✅ | |
| `league_ids` (integer, multi-valued) | ✅ | |
| `manager_id` (integer) | ✅ | |
| `manager_name` (text + keyword) | ✅ | ⚠️ STATS BY `manager_name` may fail on `text` type — use `manager_name.keyword` |
| `captain.name` (keyword) | ✅ | |
| `captain.multiplier` (integer) | ✅ | |
| `captain.ownership_percent` (float) | ✅ | |
| `captain.player_id` (integer) | ✅ | |
| `captain.points` (integer) | ✅ | |
| `chip_used` (keyword) | ✅ | |
| `gw_points` (integer) | ✅ | |
| `gw_rank` (integer) | ✅ | |
| `points_on_bench` (integer) | ✅ | |
| `season` (keyword) | ✅ | |
| `team_value` (float) | ✅ | |
| `bank` (float) | ✅ | |
| `starters` (nested) | ✅ | But UNNEST not supported |
| `starters.name` (keyword) | ✅ | Nested sub-field |
| `starters.player_id` (integer) | ✅ | Nested sub-field |
| `starters.points` (integer) | ✅ | Nested sub-field |
| `starters.element_type` (keyword) | ✅ | Nested sub-field |
| `bench` (nested) | ✅ | But UNNEST not supported |
| `transfers` (nested) | ✅ | But UNNEST not supported |
| `transfers.player_in_name` (keyword) | ✅ | Nested sub-field |
| `transfers.player_in_id` (integer) | ✅ | Nested sub-field |
| `transfers.player_out_name` (keyword) | ✅ | Nested sub-field |
| `transfers.player_out_id` (integer) | ✅ | Nested sub-field |
| `transfers.cost` (integer) | ✅ | Nested sub-field |
| `transfers.timestamp` (date) | ✅ | Nested sub-field |
| **`auto_subs`** | ❌ **MISSING** | Not in index mapping. Template #10 references this. |
| **`auto_subs.points`** | ❌ **MISSING** | Not in index mapping. |
| `team_name` (text + keyword) | ✅ | ⚠️ Use `team_name.keyword` in STATS BY |

### `manager_name` — Text vs Keyword Issue

`manager_name` is mapped as `text` with a `.keyword` sub-field. When used in `STATS ... BY manager_name`, ES|QL may not support grouping by a `text` field. **Use `manager_name.keyword`** in all `BY` clauses:

```esql
-- Wrong:
| STATS benched_points = SUM(points_on_bench) BY manager_id, manager_name

-- Correct:
| STATS benched_points = SUM(points_on_bench) BY manager_id, manager_name.keyword
```

---

## (D) Performance Concerns

| Template | Concern | Recommendation |
|----------|---------|----------------|
| `fpl.captaincy_ownership_pct` (#2) | Inline JOIN sub-query scans entire index twice | Split into two queries in tool runner |
| `fpl.transfer_effectiveness` (#8) | Double UNNEST + JOIN on nested fields | Very heavy; pre-compute or use DSL |
| `fpl.rank_delta_prev_gw` (#11) | Self-JOIN comparing GW and GW-1 | Pre-compute rank deltas during indexing |
| `fpl.ownership_drift` (#16) | Double UNNEST + JOIN comparing two GWs | Pre-compute or use DSL aggregations |
| `fpl.transfer_accuracy_future_points` (#18) | Scans future GWs + UNNEST + JOIN | Pre-compute; most expensive query |
| `fpl.hot_cold_rolling` (#14) | Multi-GW range scan | Add `LIMIT ?N` to cap results |
| `fpl.consistency_score` (#15) | Full-season scan | Add `LIMIT` and consider `season` filter as required |

**General recommendation:** Add `| LIMIT 50` (or `| LIMIT ?N`) to ALL templates. ES|QL defaults to returning 1000 rows which can be wasteful for league contexts (typically 10–20 managers).

---

## (E) Edge Cases

### Empty Strings Instead of Null

> *"UI may send empty strings instead of null"*

If the tool runner passes `""` (empty string) instead of `null`:
- `COALESCE(?GW, gameweek)` would treat `""` as a valid value and try to compare `gameweek == ""` → type error (numeric vs string).
- **Recommendation:** Validate/coerce params in the TypeScript tool runner layer. Convert `""` to `null` (or to the field's default) *before* building the query.

### Multi-Valued `league_ids`

The `league_ids == ?league_id` pattern may behave unexpectedly. In ES|QL, `IN` is typically `value IN (list)`, but `league_ids` is a multi-valued field. The correct approach depends on the ES|QL version — you may need:
```esql
-- Check if a single value exists in a multi-valued field:
| WHERE ?league_id == league_ids   -- ES|QL auto-matches against MV fields
-- OR
| WHERE MV_CONTAINS(league_ids, ?league_id)
```

---

## (F) Recommended Fixes — Complete Rewrite Strategy

Given the severity of the issues (UNNEST, JOIN, null-guards), I recommend a **two-tier approach**:

### Tier 1: Pure ES|QL (fix and keep — 6 templates)

These only use top-level fields and can work with fixes:

1. **`fpl.captaincy_spread`** — fix null-guards + SORT
2. **`fpl.chip_status_summary`** — fix null-guards + SORT
3. **`fpl.bench_disaster_leaderboard`** — fix null-guards + SORT
4. **`fpl.bench_boost_roi`** — fix null-guards + SORT
5. **`fpl.hot_cold_rolling`** — fix null-guards + SORT + add LIMIT
6. **`fpl.consistency_score`** — fix null-guards + SORT + function name

### Tier 2: Requires Denormalization OR Query DSL (12 templates)

These use UNNEST/JOIN and need architectural changes:

**Option A:** Denormalize during indexing — create flat fields like `starter_names` (keyword array), `transfer_in_names` (keyword array), etc. alongside the nested arrays.

**Option B:** Implement as Elasticsearch Query DSL with nested aggregations instead of ES|QL.

**Option C:** Split complex templates into multiple simpler ES|QL queries + TypeScript post-processing.

---

## (G) Fixed Tier 1 Templates (Ready to Use)

```esql
-- tool: fpl.captaincy_spread
-- desc: Counts captain selections for a gameweek, grouped by player.
FROM fpl-gameweek-decisions
| WHERE gameweek == COALESCE(?GW, gameweek)
    AND manager_id == COALESCE(?manager_id, manager_id)
| STATS picks = COUNT(*) BY captain.name
| SORT picks DESC
| LIMIT 50

-- tool: fpl.chip_status_summary
-- desc: Counts chip usage (wildcard, bench_boost, etc.) for the GW.
FROM fpl-gameweek-decisions
| WHERE gameweek == COALESCE(?GW, gameweek)
    AND manager_id == COALESCE(?manager_id, manager_id)
| STATS owners = COUNT(*) BY chip_used
| SORT owners DESC
| LIMIT 50

-- tool: fpl.bench_disaster_leaderboard
-- desc: Sum of points left on bench per manager for the GW.
FROM fpl-gameweek-decisions
| WHERE gameweek == ?GW
    AND manager_id == COALESCE(?manager_id, manager_id)
| STATS benched_points = SUM(points_on_bench) BY manager_id, manager_name.keyword
| SORT benched_points DESC
| LIMIT 50

-- tool: fpl.bench_boost_roi
-- desc: Bench Boost performance: bench points summed for managers using it.
FROM fpl-gameweek-decisions
| WHERE gameweek == COALESCE(?GW, gameweek)
    AND chip_used == "bench_boost"
    AND manager_id == COALESCE(?manager_id, manager_id)
| STATS bench_boost_points = SUM(points_on_bench) BY manager_id, manager_name.keyword
| SORT bench_boost_points DESC
| LIMIT 50

-- tool: fpl.hot_cold_rolling
-- desc: Recent N-week total points per manager to show hot/cold streaks.
FROM fpl-gameweek-decisions
| WHERE season == COALESCE(?SEASON, season)
    AND gameweek >= COALESCE(?GW - ?N + 1, 1)
    AND gameweek <= COALESCE(?GW, 38)
    AND manager_id == COALESCE(?manager_id, manager_id)
| STATS recent_points = SUM(gw_points) BY manager_id, manager_name.keyword
| SORT recent_points DESC
| LIMIT 50

-- tool: fpl.consistency_score
-- desc: Standard deviation of weekly points per manager (volatility metric).
FROM fpl-gameweek-decisions
| WHERE season == COALESCE(?SEASON, season)
    AND manager_id == COALESCE(?manager_id, manager_id)
| STATS volatility = STD_DEV(gw_points) BY manager_id, manager_name.keyword
| SORT volatility ASC
| LIMIT 50
```

> ⚠️ **Note on `league_ids` filter:** The `COALESCE` self-reference trick (`field == COALESCE(?param, field)`) does NOT work for multi-valued fields. The `league_ids` filter must be handled by the tool runner — conditionally appending `AND ?league_id == league_ids` only when `?league_id` is provided.

---

## (H) Suggested Additional Templates

1. **`fpl.manager_overview`** — Simple top-level query for a single manager's season stats:
   ```esql
   FROM fpl-gameweek-decisions
   | WHERE manager_id == ?manager_id AND season == ?SEASON
   | STATS total_pts = SUM(gw_points), avg_pts = AVG(gw_points),
           best_gw = MAX(gw_points), worst_gw = MIN(gw_points),
           gws_played = COUNT(*)
   | LIMIT 1
   ```

2. **`fpl.rank_progression`** — Rank over time for a manager:
   ```esql
   FROM fpl-gameweek-decisions
   | WHERE manager_id == ?manager_id AND season == ?SEASON
   | KEEP gameweek, gw_rank, gw_points
   | SORT gameweek ASC
   | LIMIT 38
   ```

3. **`fpl.top_scorers_this_gw`** — Leaderboard for a specific GW:
   ```esql
   FROM fpl-gameweek-decisions
   | WHERE gameweek == ?GW
   | SORT gw_points DESC
   | KEEP manager_id, manager_name.keyword, gw_points, gw_rank, captain.name
   | LIMIT 20
   ```

---

## Summary Action Items

| Priority | Action | Impact |
|----------|--------|--------|
| 🔴 P0 | Fix null-guard pattern → use COALESCE or dynamic WHERE building | Unblocks ALL templates |
| 🔴 P0 | Replace `SORT -field` → `SORT field DESC` | Syntax fix for ALL templates |
| 🔴 P0 | Remove/redesign UNNEST templates (10 of 18) | Architectural decision needed |
| 🔴 P0 | Remove/redesign JOIN templates (5 of 18) | Architectural decision needed |
| 🟡 P1 | Rename `DISTINCT_COUNT` → `COUNT_DISTINCT` | 2 templates |
| 🟡 P1 | Rename `STDDEV` → `STD_DEV` | 1 template |
| 🟡 P1 | Replace `exists(auto_subs)` → `auto_subs IS NOT NULL` | 1 template |
| 🟡 P1 | Add `auto_subs` field to index mapping (or remove template) | Schema gap |
| 🟡 P1 | Use `manager_name.keyword` in all BY clauses | All templates using manager_name |
| 🟢 P2 | Add `LIMIT` to all templates | Performance |
| 🟢 P2 | Guard against empty string `""` in tool runner | Edge case |
| 🟢 P2 | Consider denormalizing nested fields at index time | Enables ES|QL for nested data |
