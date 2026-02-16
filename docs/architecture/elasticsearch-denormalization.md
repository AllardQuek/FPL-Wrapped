# Elasticsearch Denormalization Architecture

## Problem Statement
The initial Elasticsearch schema stored player data (starters, bench, transfers) as nested objects within a gameweek document. While this preserved the data structure, it made player-level analysis difficult using ES|QL. Specifically, queries like "Which players on my bench scored the most points?" required complex nested aggregations or were impossible with standard ES|QL transformations.

## Solution: Denomalization (Flattening)
We adopted a **denormalization strategy** by adding "flattened" multi-valued fields to the top level of the document. This allows us to use `MV_EXPAND` in ES|QL to pivot the data for player-centric analysis.

### Schema Changes
We added the following fields to the `fpl-gameweek-decisions` index:

| Category | New Fields | Type | Description |
|---|---|---|---|
| **Starters** | `starter_names` | `keyword` | List of player names in starting XI |
| | `starter_points` | `integer` | Corresponding points for each starter |
| | `starter_element_ids` | `integer` | Corresponding FPL IDs |
| **Bench** | `bench_names` | `keyword` | List of player names on bench |
| | `bench_points` | `integer` | Corresponding points for each benched player |
| | `bench_element_ids` | `integer` | Corresponding FPL IDs |
| **Transfers** | `transfers_in_names` | `keyword` | List of players transferred in |
| | `transfers_out_names` | `keyword` | List of players transferred out |
| | `transfer_costs` | `integer` | Cost (hit) associated with each transfer |

These arrays are parallel, meaning `starter_names[0]` corresponds to `starter_points[0]`.

## Migration Strategy
To apply this change to existing data, we considered:
1.  **Re-indexing from Source**: Fetching all data from FPL API again. Rejected due to API rate limits and time.
2.  **In-Place Update (Chosen)**: Using a script to iterate over existing documents in Elasticsearch, compute the new fields from the nested data, and update the document.

### Technical Implementation
- **Script**: `scripts/migrate-denormalization.ts`
- **Method**: Uses `scrollSearch` to iterate through all documents and `client.update` to add the new fields.
- **Benefit**: Zero external API calls, fast execution (~200 docs in <10s), and safe (idempotent).

## Usage Examples

### 1. High Scoring Bench Players
Identify players who hauled points while sitting on your bench.

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND bench_names, bench_points
| WHERE bench_points >= 10
| STATS count = COUNT(*) BY bench_names
| SORT count DESC
```

### 2. Most Transferred In Players
See which players you've brought in the most throughout the season.

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND transfers_in_names
| STATS transfers = COUNT(*) BY transfers_in_names
| SORT transfers DESC
| LIMIT 5
```

### 3. Team Performance
Analyze your starting XI performance distribution.

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND starter_points
| STATS avg_starter_points = AVG(starter_points), max_starter_points = MAX(starter_points)
```
