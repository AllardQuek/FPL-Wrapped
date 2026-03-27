## 2025-05-15 - [O(N) lookup bottleneck in FPL data processing]
**Learning:** The FPL API returns large arrays (e.g., ~800 players in bootstrap data, all players in live data). Processing these arrays with `.find()` inside loops across 38 gameweeks creates a significant O(T * GW * P) bottleneck (Transfers * Gameweeks * Players).
**Action:** Always pre-index large FPL arrays into Maps or use memoized Map lookups via `WeakMap` when performing analysis that requires repeated access to the same dataset.
