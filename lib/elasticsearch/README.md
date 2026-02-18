# Elasticsearch Integration

> ⚠️ Legacy implementation note.
> For current chat/search architecture, indexing flow, and Telegram/chart integration, use:
> - `docs/chat/README.md`
> - `docs/chat/architecture/elasticsearch-indexing.md`
> - `docs/chat/architecture/system-flow.md`

Experimental Elasticsearch integration for FPL Wrapped, enabling mini-league reports and conversational queries.

## Status: Phase 1 Complete ✅

**What's implemented:**
- ✅ Feature flag system (enable/disable ES without breaking existing features)
- ✅ ES client with connection management
- ✅ Index schema for gameweek decisions
- ✅ Data transformer (FPL API → ES documents)
- ✅ Indexing scripts (single manager or entire league)
- ✅ Health check and initialization scripts

**What's next (Phase 2):**
- ⏳ Mini-league gameweek report API
- ⏳ ES|QL queries for league analytics
- ⏳ Elasticsearch Agent Builder for chat features

## Files Created

### Core Library
- `lib/config/features.ts` - Feature flags configuration
- `lib/elasticsearch/client.ts` - ES connection and health checks
- `lib/elasticsearch/schema.ts` - Index mapping and management
- `lib/elasticsearch/transformer.ts` - Data transformation layer

### Scripts
- `scripts/es-init.ts` - Initialize ES indices
- `scripts/es-health.ts` - Check ES health and stats
- `scripts/index-manager-gameweek.ts` - Index manager/league data
- `scripts/es-query-test.ts` - Query and display documents

### Documentation
- `docs/elasticsearch-setup.md` - Setup guide
- `.env.example` - Environment variable template

## Quick Start

1. **Configure Elasticsearch:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your ES credentials
   ```

2. **Initialize:**
   ```bash
   pnpm es:init
   ```

3. **Index your data:**
   ```bash
   pnpm es:index -- --manager YOUR_TEAM_ID --gameweek 10
   ```

4. **Verify:**
   ```bash
   pnpm es:health
   pnpm es:query -- --manager YOUR_TEAM_ID --gameweek 10
   ```

## Architecture

### Data Model
Each ES document represents **one manager's decisions for one gameweek**:
- Manager identification
- Transfers made (with hit cost)
- Captain selection
- Team selection (starters + bench)
- Chip usage
- Gameweek results

### Document ID Format
```
{managerId}-gw{gameweekNumber}
```
Example: `123456-gw10`

### Index Structure
```
fpl-gameweek-decisions/
├── manager_id: 123456
├── gameweek: 10
├── transfers: [...]
├── captain: {...}
├── bench: [...]
├── starters: [...]
└── ...
```

## Feature Flags

All ES features are **opt-in** and can be toggled independently:

```env
# Master switch
ENABLE_ELASTICSEARCH=true

# Individual features (require ES enabled)
ENABLE_MINI_LEAGUE_REPORTS=false
ENABLE_CONVERSATIONAL_QUERIES=false
```

**Graceful degradation**: If ES is disabled or unavailable, existing features continue to work normally.

## Available Scripts

```bash
# Initialize Elasticsearch
pnpm es:init

# Check health and status
pnpm es:health

# Index single manager
pnpm es:index -- --manager 123456 --gameweek 10

# Index entire league
pnpm es:index -- --league 456789 --gameweek 10

# Query document
pnpm es:query -- --manager 123456 --gameweek 10
```

## Safety Features

1. **Feature flags**: Disable instantly without code changes
2. **Graceful fallback**: App works without ES
3. **No existing API changes**: All current features untouched
4. **Separate namespace**: New APIs under `/api/es/*`

## Development Notes

### When to Index
- **Completed gameweeks**: Index once, data is stable
- **Live gameweeks**: Don't pre-index, query on-demand
- **Future gameweeks**: Can index team selections after deadline

### Rate Limiting
Scripts include automatic delays to respect FPL API limits:
- 5 managers per batch
- 500ms delay between batches

### Error Handling
- All ES operations wrapped in try-catch
- Failures logged but don't crash app
- Circuit breaker pattern for repeated failures

## Next Steps

See [docs/elasticsearch-setup.md](../docs/elasticsearch-setup.md) for detailed setup instructions.
