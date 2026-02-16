Great question! Let me show you exactly what "unnesting" means and why ES|QL struggles with nested arrays.

## The Problem: Nested Arrays in Your Current Index

Your current document structure looks like this:

```json
{
  "manager_name": "John",
  "gameweek": 25,
  "bench": [
    {"name": "Salah", "points": 18},
    {"name": "Toney", "points": 12},
    {"name": "Watkins", "points": 2},
    {"name": "Steele", "points": 0}
  ]
}
```

## What You WANT to Ask (But Can't):

**"Show me all players who were benched with 15+ points"**

### ❌ What Doesn't Work (Current Structure):

```esql
FROM fpl-gameweek-decisions
| WHERE bench.points >= 15
| STATS bench_hauls = COUNT(*) BY bench.name
```

**Problem:** ES|QL sees `bench` as a **single nested object**, not individual rows. It can't "explode" or "unnest" the array to treat each bench player as a separate record.

**Result:** Query fails or returns nothing useful because you're trying to filter/group on nested fields.

---

## The Solution: Denormalized (Flattened) Arrays

After denormalization, the **same document** looks like this:

```json
{
  "manager_name": "John",
  "gameweek": 25,
  "bench": [
    {"name": "Salah", "points": 18},
    {"name": "Toney", "points": 12},
    {"name": "Watkins", "points": 2},
    {"name": "Steele", "points": 0}
  ],
  "bench_names": ["Salah", "Toney", "Watkins", "Steele"],
  "bench_points": [18, 12, 2, 0]
}
```

Notice we **kept the nested structure** (for reference) but **added flat multi-valued fields**.

### ✅ What DOES Work (With MV_EXPAND):

```esql
FROM fpl-gameweek-decisions
| MV_EXPAND bench_names, bench_points
| WHERE bench_points >= 15
| STATS bench_hauls = COUNT(*) BY bench_names
| SORT bench_hauls DESC
```

**What `MV_EXPAND` does:** It "unnests" the multi-valued fields by creating **one row per array element**.

---

## Visual Example: How MV_EXPAND Transforms Data

### Before MV_EXPAND (1 document):

| manager_name | gameweek | bench_names | bench_points |
|--------------|----------|-------------|--------------|
| John | 25 | ["Salah", "Toney", "Watkins", "Steele"] | [18, 12, 2, 0] |

### After MV_EXPAND (4 rows):

| manager_name | gameweek | bench_names | bench_points |
|--------------|----------|-------------|--------------|
| John | 25 | Salah | 18 |
| John | 25 | Toney | 12 |
| John | 25 | Watkins | 2 |
| John | 25 | Steele | 0 |

Now you can filter `WHERE bench_points >= 15` and it works on **individual players**, not the whole array!

---

## Real-World Comparison

### Scenario: "Who are the most benched players when they haul (15+ points)?"

#### ❌ WITHOUT Denormalization (Current Index):

**Query attempt:**
```esql
FROM fpl-gameweek-decisions
| WHERE bench.points >= 15
| STATS COUNT(*) BY bench.name
```

**Result:** ❌ Error or no results. ES|QL can't filter nested arrays this way.

---

#### ✅ WITH Denormalization (Flat Fields):

**Query:**
```esql
FROM fpl-gameweek-decisions
| MV_EXPAND bench_names, bench_points
| WHERE bench_points >= 15
| STATS bench_hauls = COUNT(*) BY bench_names
| SORT bench_hauls DESC
| LIMIT 10
```

**Result:** ✅ Works perfectly!

| bench_names | bench_hauls |
|-------------|-------------|
| Salah | 8 |
| Haaland | 6 |
| Saka | 5 |
| Palmer | 4 |

You get a clean list of players who were benched during their hauls! 😭

---

## Another Example: Transfer Analysis

### ❌ WITHOUT Denormalization:

**Query attempt:**
```esql
FROM fpl-gameweek-decisions
| STATS transfer_count = COUNT(*) BY transfers.element_in.name
```

**Result:** ❌ Doesn't work. Can't aggregate on nested transfer objects.

---

### ✅ WITH Denormalization:

**Query:**
```esql
FROM fpl-gameweek-decisions
| MV_EXPAND transfers_in_names
| STATS transfer_count = COUNT(*) BY transfers_in_names
| SORT transfer_count DESC
| LIMIT 10
```

**Result:** ✅ Perfect!

| transfers_in_names | transfer_count |
|--------------------|----------------|
| Palmer | 45 |
| Haaland | 38 |
| Salah | 32 |

---

## Key Takeaway

**Without denormalization:**
- You can only query **manager-level** data (captain, total points, team value)
- You **cannot** analyze individual players across managers (who's benched, who's transferred, who's started)

**With denormalization:**
- You unlock **player-level** analysis across all managers
- `MV_EXPAND` lets you "unnest" flat arrays to treat each element as a row
- You can answer questions like "most benched hauls", "transfer trends", "most started players"

The trade-off is you're storing data twice (nested + flat), but the query flexibility is worth it! 🎯

Does this clarify the unnesting concept?