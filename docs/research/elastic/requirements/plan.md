# Plan: Mini-League Reports & Scheduled Delivery

**What this plan covers:**
- ✅ **Phase 1**: Elasticsearch indexing infrastructure (data foundation)
- ✅ **Phase 2**: 34 pre-built query functions for mini-league insights (strategic intelligence, performance analysis)
- ✅ **Phase 3**: Multi-platform delivery system (Telegram, Discord, Email, WhatsApp)
- 📅 Scheduled reports (pre-GW previews, daily digests, final comprehensive reports)

**What this plan does NOT cover:**
- ❌ Conversational chat interface → See [plan-chat.md](./plan-chat.md) for that feature

**Use case:** Automated scheduled reports pushed to mini-league groups showing captaincy spreads, transfer activity, bench regrets, rank movements, etc.

---

## Phase 1: Elasticsearch Data Indexing

**TL;DR**: Set up Elasticsearch infrastructure, define gameweek-based index schema, create indexing script to populate ES with manager gameweek decisions. Start with feature flags to keep everything optional. Test with one manager/gameweek, then scale to leagues.

**Approach**: Bottom-up - infrastructure first, then data model, then indexing logic, then test with real data. Keep existing code untouched throughout.

---

## **Steps**

### **1. Environment Setup & Feature Flags**

**1.1 Install Elasticsearch Client**
```bash
pnpm add @elastic/elasticsearch
```

**1.2 Create Feature Flag Configuration**
- Create lib/config/features.ts
- Export feature flags that check environment variables
- Include `ELASTICSEARCH_ENABLED`, `MINI_LEAGUE_REPORTS`, `CONVERSATIONAL_QUERIES`
- Add helper function `isFeatureEnabled(feature: string): boolean`

**1.3 Add Environment Variables**
- Create/update .env.local with:
  - `ENABLE_ELASTICSEARCH=true` (set to true to start testing)
  - `ELASTICSEARCH_URL=` (your Elastic Cloud URL)
  - `ELASTICSEARCH_API_KEY=` (your API key)
  - `ELASTICSEARCH_INDEX_NAME=fpl-gameweek-decisions` (index name)
- Add .env.example template with comments

**1.4 Create ES Client Module**
- Create lib/elasticsearch/client.ts
- Initialize Elasticsearch client using environment variables
- Export `getESClient()` function that returns client or null if disabled
- Export `isESAvailable()` boolean check
- Add connection health check function
- Include error handling for connection failures (graceful degradation)

---

### **2. Define Index Schema for Gameweek Decisions**

**2.1 Create Index Mapping**
- Create lib/elasticsearch/schema.ts
- Define mapping for `fpl-gameweek-decisions` index with fields:
  ```typescript
  {
    manager_id: integer,
    manager_name: keyword,
    team_name: keyword,
    league_ids: integer[], // Array for multi-league support
    gameweek: integer,
    season: keyword,
    
    // Transfer data for this GW
    transfers: nested [{
      player_in_id: integer,
      player_in_name: keyword,
      player_out_id: integer,
      player_out_name: keyword,
      cost: integer, // Hit points (-4, -8, 0)
      timestamp: date
    }],
    
    // Captain selection
    captain: {
      player_id: integer,
      name: keyword,
      points: integer,
      ownership_percent: float,
      multiplier: integer // 2 or 3 (TC)
    },
    
    vice_captain: {
      player_id: integer,
      name: keyword
    },
    
    // Bench players
    bench: nested [{
      player_id: integer,
      name: keyword,
      position_index: integer, // 12-15
      points: integer,
      element_type: keyword // GKP/DEF/MID/FWD
    }],
    
    // Starting XI
    starters: nested [{
      player_id: integer,
      name: keyword,
      position_index: integer, // 1-11
      points: integer,
      element_type: keyword
    }],
    
    // Chip usage
    chip_used: keyword, // null, "wildcard", "bboost", etc
    
    // GW results
    gw_points: integer,
    gw_rank: integer,
    points_on_bench: integer,
    bank: float,
    team_value: float,
    
    @timestamp: date
  }
  ```
- Export function `getGameweekDecisionsMapping()` that returns mapping object

**2.2 Create Index Initialization Function**
- In lib/elasticsearch/schema.ts
- Add `createIndexIfNotExists(indexName: string)` function
- Check if index exists, create with mapping if not
- Set index settings: 1 shard, 1 replica, refresh interval
- Return success/failure status

---

### **3. Create Data Transformation Layer**

**3.1 Build Gameweek Decision Transformer**
- Create lib/elasticsearch/transformer.ts
- Function `transformToGameweekDecision(managerId, gameweek, data)`:
  - Takes manager data from existing `fetchAllManagerData`
  - Extracts data for specific gameweek
  - Transforms to match ES schema
  - Returns document ready for indexing
- Handle edge cases: missing data, wildcards affecting transfers, chips

**3.2 Add Helper Functions**
- `extractGWTransfers(transfers[], gameweek)`: Filter transfers for specific GW
- `extractGWPicks(picksByGameweek, gameweek)`: Get team selection
- `calculateBenchPoints(picks, liveGW)`: Sum bench player points
- `enrichWithPlayerData(picks, bootstrap)`: Add player names from bootstrap data

---

### **4. Build Indexing Script**

**4.1 Create Single Manager Indexing Function**
- Create scripts/index-manager-gameweek.ts
- Function `indexManagerGameweek(managerId: number, gameweek: number)`:
  - Check if ES is enabled
  - Fetch manager data using existing `fetchAllManagerData`
  - Transform using `transformToGameweekDecision`
  - Index to ES with document ID: `${managerId}-gw${gameweek}`
  - Use upsert operation (won't duplicate if run twice)
  - Log success/failure
  - Return indexed document

**4.2 Create League Indexing Function**
- In same file, add `indexLeagueGameweek(leagueId: number, gameweek: number)`:
  - Fetch league standings using existing `getLeagueStandings`
  - Extract all manager IDs
  - For each manager, call `indexManagerGameweek`
  - Use batching: index 5 managers at a time with 500ms delay (respect FPL rate limits)
  - Show progress bar/log
  - Use ES bulk API for efficiency
  - Handle errors gracefully (log and continue)

**4.3 Add CLI Interface**
- Make script runnable from command line:
  ```bash
  pnpm tsx scripts/index-manager-gameweek.ts --manager 123456 --gameweek 10
  pnpm tsx scripts/index-manager-gameweek.ts --league 456789 --gameweek 10
  ```
- Parse command line arguments
- Validate inputs
- Show helpful error messages

---

### **5. Create Initialization Script**

**5.1 Build ES Setup Script**
- Create scripts/es-init.ts
- Check ES connection health
- Create `fpl-gameweek-decisions` index with mapping
- Verify index created successfully
- Print summary of setup
- Make runnable via: `pnpm tsx scripts/es-init.ts`

**5.2 Add Health Check Script**
- Create scripts/es-health.ts
- Check ES cluster health
- Check if index exists
- Count documents in index
- Show ES version and node info
- Make runnable via: `pnpm tsx scripts/es-health.ts`

---

### **6. Test Indexing with Real Data**

**6.1 Test with Single Manager**
- Run initialization: `pnpm tsx scripts/es-init.ts`
- Index one manager/gameweek: `pnpm tsx scripts/index-manager-gameweek.ts --manager YOUR_TEAM_ID --gameweek 10`
- Check health: `pnpm tsx scripts/es-health.ts`
- Verify document in Kibana Dev Console or via API

**6.2 Verify Document Structure**
- Query ES directly to inspect indexed document
- Create scripts/es-query-test.ts to fetch and display document
- Verify all fields populated correctly
- Check data types match schema

**6.3 Test with Small League**
- Find a small mini-league (10-20 managers)
- Index entire league for one gameweek: `pnpm tsx scripts/index-manager-gameweek.ts --league LEAGUE_ID --gameweek 10`
- Verify all managers indexed
- Check for any errors/missing data

---

### **7. Add Package Scripts**

**7.1 Update package.json**
- Add scripts section:
  ```json
  {
    "scripts": {
      "es:init": "tsx scripts/es-init.ts",
      "es:health": "tsx scripts/es-health.ts",
      "es:index-manager": "tsx scripts/index-manager-gameweek.ts",
      "es:query": "tsx scripts/es-query-test.ts"
    }
  }
  ```

---

### **8. Error Handling & Logging**

**8.1 Add Logging Utility**
- Create lib/utils/logger.ts (if doesn't exist)
- Export logging functions with context
- Include ES operation logging
- Color-code success/warning/error messages

**8.2 Add Graceful Degradation**
- Wrap all ES operations in try-catch
- Log errors but don't throw
- Return null/empty results on failure
- Add circuit breaker: if ES fails 3 times, disable for 5 minutes

---

### **9. Create Documentation**

**9.1 Create ES Setup Guide**
- Create docs/elasticsearch-setup.md
- Document Elastic Cloud trial setup steps
- Include screenshots/links for getting API key
- Document environment variable configuration
- Include troubleshooting section

**9.2 Document Indexing Process**
- Create docs/elasticsearch-indexing.md
- Explain data model (gameweek-based)
- Document indexing scripts usage
- Include examples for various scenarios
- Document when to re-index (after gameweek completes)

---

### **10. Create Simple Query Test**

**10.1 Build Basic Query API**
- Create app/api/es/test/route.ts
- Simple endpoint that queries ES for a manager's gameweek data
- Returns raw ES document
- Used for testing/debugging
- Feature-flagged (only works if ES enabled)

**10.2 Test Query Performance**
- Compare query time: ES lookup vs fresh FPL API fetch
- Document performance differences
- Verify cache benefit

---

## **Verification**

**Phase 1: Infrastructure (Before indexing)**
- Run `pnpm es:init`
- Verify index created in Kibana or via health check
- Check index mapping matches schema

**Phase 2: Single Document (Test indexing)**
- Index your own manager for completed gameweek
- Query ES to verify document structure
- Check all fields populated correctly
- Verify composite ID format (`managerId-gwN`)

**Phase 3: Batch Indexing (Scale test)**
- Index small league (10-20 managers) for one gameweek
- Monitor FPL API rate limits (should have delays)
- Check ES bulk indexing performance
- Verify all managers indexed successfully
- Count documents: should equal number of managers

**Phase 4: Query Testing**
- Query for specific manager/gameweek
- Test aggregation: count managers by captain choice
- Verify query performance (<100ms for single doc lookup)

**Success Criteria:**
- ✅ ES client connects successfully
- ✅ Index created with correct mapping
- ✅ Can index manager gameweek data
- ✅ Can query indexed data
- ✅ Feature flags work (can disable ES without breaking)
- ✅ Scripts have clear error messages

---

## **Phase 2: Mini-League Report Query Library**

**TL;DR**: Build query functions for 34 mini-league report features split between pre-gameweek (planning) and post-gameweek (review) reports. Create aggregation and enrichment layers to combine ES data with FPL API data.

**Approach**: Start with base query utilities, then implement pre-GW queries, followed by post-GW queries. Build report aggregators that combine all insights into structured reports for each phase.

---

## **Steps**

### **1. Query Foundation**

**1.1 Create Base Query Module**
- Create `lib/elasticsearch/queries.ts`
- Implement base query builder: `buildLeagueGameweekQuery(leagueId, gameweek)`
- Add pagination helpers for large leagues
- Include error handling and fallbacks
- Export query type definitions

**1.2 Common Aggregation Helpers**
- `aggregateCaptains(leagueId, gameweek)` - Group by captain choice
- `aggregatePlayerOwnership(leagueId, gameweek)` - Count player ownership across league
- `aggregateChips(leagueId, gameweek)` - Chip usage breakdown
- `aggregateFormations(leagueId, gameweek)` - Formation patterns
- Add caching layer for repeated queries

**1.3 Test Base Queries**
- Create `scripts/test-queries.ts`
- Test against indexed league data
- Verify aggregation results
- Check query performance (<200ms for small leagues)

---

### **2. Pre-Gameweek Query Functions (Planning Phase)**

Implement queries for features 1-14 to help managers strategize before deadline.

**2.1 Strategic Intelligence Queries**

Create `lib/elasticsearch/queries/pre-gameweek.ts`:

- `getCaptaincySpread(leagueId, gameweek)`
  - Returns captain distribution with manager names
  - Identify consensus (>50% ownership) vs differentials (<20%)
  - Include captain player details

- `getDifferentials(leagueId, gameweek, maxOwnership = 3)`
  - Find players owned by ≤N managers
  - Return player details, positions, owners
  - Flag high-ceiling differentials

- `getTemplateOverlap(leagueId, gameweek)`
  - Calculate pairwise squad overlap % between all managers
  - Identify "template followers" vs "mavericks"
  - Return similarity matrix

- `getTransferTargets(leagueId, gameweek)`
  - Most transferred IN players this week
  - Include transfer counts, manager names
  - Show what they transferred OUT

- `getHitAnalysis(leagueId, gameweek)`
  - List managers who took hits (-4, -8, -12+)
  - Show what they bought with hits
  - Calculate hit ROI potential

- `getChipStatus(leagueId, gameweek)`
  - Active chips this week (WC, FH, TC, BB)
  - Remaining chips for each manager
  - Chip timing analysis

- `getFormationTrends(leagueId, gameweek)`
  - Formation breakdown (3-4-3, 3-5-2, etc.)
  - Identify structural differentials

- `getFixtureLoading(leagueId, gameweek)`
  - Team stacking (doubled/tripled up on teams)
  - Fixture context for popular picks

- `getTeamValueComparison(leagueId, gameweek)`
  - Squad values ranked
  - Budget remaining
  - Value growth comparison

**2.2 Competitive Context Queries**

- `getCompetitiveContext(leagueId, gameweek)`
  - Current standings with points gaps
  - Calculate catch-up potential
  - Identify risk-takers vs template players

---

### **3. Post-Gameweek Query Functions (Review Phase)**

Implement queries for features 15-34 to analyze results after gameweek completes.

**3.1 Performance Analysis Queries**

Create `lib/elasticsearch/queries/post-gameweek.ts`:

- `getCaptaincyPerformance(leagueId, gameweek)`
  - Captain points returned
  - Winners (top scoring captain) vs losers (blanks)
  - Captain success rate by manager

- `getBenchRegrets(leagueId, gameweek)`
  - Total bench points by manager
  - Biggest individual bench regret
  - Autosub impact analysis

- `getTransferEffectiveness(leagueId, gameweek)`
  - Points scored by new signings
  - Hit ROI calculation (points - hit cost)
  - Transfer success rate

- `getChipPerformance(leagueId, gameweek)`
  - Bench boost returns
  - Triple captain outcomes
  - Wildcard/Free hit effectiveness

- `getDifferentialOutcomes(leagueId, gameweek)`
  - Success rate of low-ownership picks
  - Differential hauls vs template fails

- `getAutosubImpact(leagueId, gameweek)`
  - Who benefited from auto-subs
  - Points gained via substitutions

**3.2 Luck vs Skill Queries**

- `getLuckFactors(leagueId, gameweek)`
  - Captains who blanked (bad luck)
  - Benched haulers (bad decision)
  - Bonus point luck

- `getCleanSheetLottery(leagueId, gameweek)`
  - Defensive return predictions vs actual
  - Who guessed correctly

**3.3 League Dynamics Queries**

- `getRankMovements(leagueId, gameweek, previousGW)`
  - Position changes (jumpers/fallers)
  - Green/red arrows vs league average
  - Head-to-head swings

- `getLeaguePerformance(leagueId, gameweek)`
  - Highest/lowest scores
  - League average
  - Performance distribution

**3.4 Pattern Recognition Queries**

- `getPopularFails(leagueId, gameweek, minOwnership = 5)`
  - High-ownership players who blanked
  - Template punishment analysis

- `getMaverickRewards(leagueId, gameweek)`
  - When unique picks paid off
  - Anti-template success stories

**3.5 Highlights Queries**

- `getBestDecisions(leagueId, gameweek)`
  - Top transfer/captain/bench choices
  - Calculate decision impact on rank

- `getWorstDecisions(leagueId, gameweek)`
  - Costly mistakes
  - Rank impact quantified

- `getWhatIfAnalysis(leagueId, gameweek)`
  - Alternative captain scenarios
  - Alternative bench scenarios
  - Points left on table

---

### **4. Data Enrichment Layer**

Some features require combining ES data with FPL API data.

**4.1 Create Enrichment Module**

Create `lib/elasticsearch/enrichment.ts`:

- `enrichWithBootstrapData(queryResults, bootstrap)`
  - Add player fixtures, global ownership, form
  - Add team fixture difficulty

- `enrichWithHistoricalContext(queryResults, leagueId, pastGameweeks)`
  - Compare current GW to historical patterns
  - Season-long trends (hit frequency, captain success rate)

- `cacheBootstrapData(ttl = 3600)`
  - Cache bootstrap data for 1 hour
  - Reduce API calls during report generation

**4.2 Calculation Utilities**

Create `lib/elasticsearch/calculations.ts`:

- `calculateTeamOverlap(team1, team2)` - Squad similarity %
- `calculateLuckFactor(expected, actual)` - Variance analysis
- `calculateHitROI(hitCost, pointsScored)` - Transfer effectiveness
- `calculateRankChange(currentGW, previousGW)` - Position delta

---

### **5. Report Aggregators**

Combine all query results into structured reports.

**5.1 Pre-Gameweek Report Builder**

Create `lib/elasticsearch/reports.ts`:

```typescript
async function generatePreGameweekReport(
  leagueId: number, 
  gameweek: number
): Promise<PreGameweekReport> {
  // Fetch all strategic intelligence
  // Fetch competitive context
  // Package into report structure
}
```

Report structure:
```typescript
interface PreGameweekReport {
  metadata: { leagueId, gameweek, generatedAt, type: 'pre-gw' }
  strategicIntelligence: {
    captaincy: CaptaincySpread
    differentials: Differential[]
    templateOverlap: OverlapMatrix
    transfers: TransferTargets
    hits: HitAnalysis
    chips: ChipStatus
    formations: FormationTrends
    fixtureLoading: FixtureLoading
    teamValues: TeamValueComparison
  }
  competitiveContext: {
    standings: Standings
    catchUpPotential: CatchUpAnalysis
    riskAssessment: RiskProfile[]
  }
}
```

**5.2 Post-Gameweek Report Builder**

```typescript
async function generatePostGameweekReport(
  leagueId: number, 
  gameweek: number
): Promise<PostGameweekReport> {
  // Fetch all performance queries
  // Fetch luck vs skill analysis
  // Fetch league dynamics
  // Package into report structure
}
```

Report structure:
```typescript
interface PostGameweekReport {
  metadata: { leagueId, gameweek, generatedAt, type: 'post-gw' }
  performance: {
    captaincy: CaptaincyPerformance
    benchRegrets: BenchAnalysis
    transfers: TransferEffectiveness
    chips: ChipPerformance
    differentials: DifferentialOutcomes
    autosubs: AutosubImpact
  }
  luckVsSkill: {
    luckFactors: LuckAnalysis
    cleanSheets: CleanSheetAnalysis
  }
  leagueDynamics: {
    rankMovements: RankChanges
    performance: LeaguePerformance
  }
  patterns: {
    popularFails: PopularFailAnalysis
    maverickRewards: MaverickAnalysis
  }
  highlights: {
    bestDecisions: Decision[]
    worstDecisions: Decision[]
    whatIf: WhatIfAnalysis
  }
}
```

**5.3 Report Caching**

- Cache generated reports for 5 minutes
- Invalidate on new data index
- Add cache busting parameter

---

### **6. Testing & Validation**

**6.1 Query Testing**

- Create test suite: `scripts/test-league-queries.ts`
- Test with real league data (your indexed league)
- Verify all 34 features return correct data
- Check edge cases (empty results, single manager, etc.)

**6.2 Performance Testing**

- Measure query execution times
- Target: <500ms for full pre-GW report
- Target: <1s for full post-GW report
- Optimize slow queries with ES explain API

**6.3 Data Validation**

- Verify calculations match manual checks
- Test hit ROI calculations
- Verify rank change logic
- Validate overlap % calculations

---

### **7. Documentation**

**7.1 Query Library Documentation**

Create `docs/mini-league-queries.md`:
- Document each query function
- Include example usage
- Show sample return data
- Document performance characteristics

**7.2 Report Structure Documentation**

Create `docs/mini-league-reports.md`:
- Document report types (pre/post)
- Show full report JSON structure
- Include interpretation guide
- Document caching behavior

---

## **Verification**

**Phase 2A: Individual Queries**
- Test each query function with indexed league
- Verify results match expected outcomes
- Check performance (<200ms per query)
- Validate data completeness

**Phase 2B: Report Generation**
- Generate pre-GW report for test league
- Generate post-GW report for completed gameweek
- Verify all sections populated
- Check report generation time (<2s total)

**Phase 2C: Edge Cases**
- Test with league of 2 managers
- Test with league of 100+ managers
- Test incomplete gameweek data
- Verify graceful failures

**Success Criteria:**
- ✅ All 34 features have working query functions
- ✅ Pre-GW report generates successfully
- ✅ Post-GW report generates successfully
- ✅ Query performance targets met
- ✅ Data validation passes
- ✅ Documentation complete

---

## **Phase 3: Delivery Adapters & Multi-Platform Support**

**TL;DR**: Build platform-agnostic delivery system where reports (from Phase 2) are formatted and sent via different platforms (Telegram, Discord, Email, WhatsApp). Start with Telegram adapter, architecture makes adding others easy.

**Approach**: 
1. Keep Phase 2 reports platform-agnostic (pure data objects)
2. Build adapter pattern: each platform has formatter + client
3. Unified subscription model tracks user preferences
4. Single send script routes to correct platform

**Architecture:**
```
Phase 2 Reports (platform-agnostic)
         ↓
  lib/delivery/
         ├─ telegram/  (formatter + client + bot)
         ├─ discord/   (formatter + client + bot) [future]
         ├─ email/     (formatter + client) [future]
         └─ whatsapp/  (formatter + client + bot) [future]
         ↓
  Unified Subscriptions (data/subscriptions.json)
```

---

## **Steps**

### **1. Unified Subscription System**

**1.1 Platform-Agnostic Subscription Model**

Create `data/subscriptions.json`:
```json
{
  "subscriptions": [
    {
      "id": "sub_telegram_1",
      "platform": "telegram",
      "destination": "-1001234567890",
      "destination_name": "Our FPL Group",
      "league_id": 1305804,
      "preferences": {
        "pre_gw": true,
        "post_gw_digests": true,
        "post_gw_final": true
      },
      "subscribed_at": "2026-02-15T10:00:00Z"
    },
    {
      "id": "sub_email_1",
      "platform": "email",
      "destination": "user@example.com",
      "destination_name": "John Doe",
      "league_id": 1305804,
      "preferences": {
        "pre_gw": true,
        "post_gw_digests": false,
        "post_gw_final": true
      },
      "subscribed_at": "2026-02-14T08:00:00Z"
    }
  ]
}
```

**1.2 Subscription Management Module**

Create `lib/delivery/subscriptions.ts`:
```typescript
interface Subscription {
  id: string
  platform: 'telegram' | 'discord' | 'email' | 'whatsapp'
  destination: string  // Platform-specific (chat_id, channel_id, email, etc.)
  destination_name: string
  league_id: number
  preferences: {
    pre_gw: boolean
    post_gw_digests: boolean
    post_gw_final: boolean
  }
  subscribed_at: string
}

export function getSubscriptions(): Subscription[]
export function getSubscriptionsByLeague(leagueId: number): Subscription[]
export function getSubscriptionsByPlatform(platform: string): Subscription[]
export function addSubscription(subscription: Subscription): void
export function removeSubscription(id: string): void
```

---

### **2. Telegram Adapter (Reference Implementation)**

**2.1 Create Telegram Bot**
- Use Telegram's BotFather to create bot
- Get bot token, add to `.env.local` as `TELEGRAM_BOT_TOKEN`
- Disable privacy mode (allows bot to see group commands): `/setprivacy` → `Disable`
- Install: `pnpm add grammy` (modern Telegram bot framework)

**User Flow:**
1. Admin adds bot to their mini-league Telegram group
2. Someone in group types: `/subscribe 1305804`
3. Bot confirms subscription
4. Bot automatically sends reports to that group

**2.2 Telegram Client Module**

Create `lib/delivery/telegram/client.ts`:
```typescript
import { Bot } from 'grammy'

export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)

export async function sendMessage(chatId: string, message: string) {
  await bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' })
}
```

**2.3 Telegram Formatter**

Create `lib/delivery/telegram/formatter.ts`:

Format platform-agnostic report objects into Telegram markdown.

```typescript
import type { PreGameweekReport, PostGameweekReport } from '@/lib/types'
export function formatPreGWMessage(report: PreGameweekReport): string {
  return `
🏆 *League ${report.metadata.leagueId} - GW${report.metadata.gameweek} Preview*
_Deadline in ${getHoursUntilDeadline(report)}h_

⚡️ *Captaincy Spread*
${report.captaincy.top3.map(c => `• ${c.player}: ${c.count} managers`).join('\n')}
${report.captaincy.differentials.length > 0 ? `\n💎 Differential: ${report.captaincy.differentials[0].player}` : ''}

🔄 *Transfer Activity*
• ${report.transfers.mostIn.length} players transferred in
• ${report.hits.count} managers took hits
${report.hits.count > 0 ? `• Biggest hit: ${report.hits.biggest} points` : ''}

📊 *Template Overlap*
• Most similar teams: ${report.overlap.highest}%
• Most unique: ${report.overlap.lowest}%

💰 *Team Values*
• Highest: £${report.teamValues.highest}m
• Average: £${report.teamValues.average}m
`
}
```

**2.2 Post-Gameweek Message**

```typescript
export function formatPostGWMessage(
  report: PostGameweekReport, 
  isPartial: boolean = false
): string {
  const status = isPartial 
    ? `⏳ *In Progress* (${report.metadata.fixturesPlayed}/${report.metadata.fixturesTotal} fixtures)\n` 
    : `✅ *Complete*\n`
    
  return `
🏆 *League ${report.metadata.leagueId} - GW${report.metadata.gameweek} Results*
${status}

🎯 *Captain Performance*
🥇 Best: ${report.captaincy.best.player} (${report.captaincy.best.points}pts) - ${report.captaincy.best.count} managers
😔 Worst: ${report.captaincy.worst.player} (${report.captaincy.worst.points}pts)

😭 *Bench Disasters*
${report.benchRegrets.top3.map(b => `• ${b.manager}: ${b.points}pts benched`).join('\n')}

📊 *Rank Changes*
${report.rankMovements.risers.map(r => `↗️ ${r.manager}: +${r.positions} (${r.points}pts)`).join('\n')}
${report.rankMovements.fallers.map(f => `↘️ ${f.manager}: ${f.positions} (${f.points}pts)`).join('\n')}

🔥 *Highlights*
• Best decision: ${report.highlights.best.description}
• Ouch: ${report.highlights.worst.description}

${isPartial ? '\n_More fixtures to come. Next update: Tomorrow 7am SGT_' : ''}
`
}
```

---

### **3. Report Sending Script**

**3.1 Create Send Report Script**

Create `scripts/send-league-report.ts`:

```typescript
#!/usr/bin/env tsx

import { generatePreGameweekReport, generatePostGameweekReport } from '../lib/elasticsearch/reports'
import { formatPreGWMessage, formatPostGWMessage } from '../lib/delivery/telegram/formatter'
import { sendMessage } from '../lib/delivery/telegram/client'
import { getSubscribedDestinations } from '../lib/delivery/subscriptions'

async function main() {
  const args = process.argv.slice(2)
  
  const leagueId = parseInt(args[args.indexOf('--league') + 1])
  const gameweek = parseInt(args[args.indexOf('--gameweek') + 1])
  const type = args[args.indexOf('--type') + 1] // 'pre' or 'post'
  
  console.log(`📊 Sending ${type}-GW report for League ${leagueId}, GW${gameweek}`)
  
  // Generate report
  let message: string
  if (type === 'pre') {
    const report = await generatePreGameweekReport(leagueId, gameweek)
    message = formatPreGWMessage(report)
  } else {
    const report = await generatePostGameweekReport(leagueId, gameweek)
    const isPartial = report.metadata.dataCompleteness === 'partial'
    message = formatPostGWMessage(report, isPartial)
  }
  
  // Get Telegram groups subscribed to this league
  const telegramGroups = getSubscribedDestinations(leagueId, 'telegram')
  console.log(`   Found ${telegramGroups.length} Telegram groups`)
  
  // Send to each group
  for (const subscription of telegramGroups) {
    try {
      await sendMessage(subscription.destination, message)
      console.log(`   ✅ Sent to: ${subscription.destination}`)
    } catch (error) {
      console.error(`   ❌ Failed to send:`, error)
    }
  }
  
  console.log('\n✨ Done!')
}

main().catch(console.error)
```

**3.2 Add to package.json**

```json
{
  "scripts": {
    "send:pre-gw": "npx tsx scripts/send-league-report.ts",
    "send:post-gw": "npx tsx scripts/send-league-report.ts"
  }
}
```

---

### **4. Bot Commands (Optional - for user interaction)**

**4.1 Bot Command Handler**

Create `scripts/telegram-bot.ts` (run continuously to handle commands):

```typescript
#!/usr/bin/env tsx

import { bot } from '../lib/delivery/telegram/client'
import { subscribe, unsubscribe, getSubscribedDestinations } from '../lib/delivery/subscriptions'
import { generatePreGameweekReport } from '../lib/elasticsearch/reports'
import { formatPreGWMessage } from '../lib/delivery/telegram/formatter'
import { getBootstrapData } from '../lib/fpl-api'

bot.command('start', (ctx) => {
  // Only respond in groups
  if (ctx.chat.type === 'private') {
    return ctx.reply('Please add me to your mini-league group chat!')
  }
  
  ctx.reply(`
👋 FPL Mini-League Reports Bot

Add me to your league group and use:
/subscribe [league_id] - Get reports for your league
/unsubscribe - Stop reports
/status - Check subscription
/preview - Generate pre-GW report now
/results [gw] - Generate post-GW report now

Find your league ID in the FPL URL: fantasy.premierleague.com/leagues/1305804/standings
`)
})

bot.command('subscribe', async (ctx) => {
  // Must be in a group
  if (ctx.chat.type === 'private') {
    return ctx.reply('This command only works in group chats!')
  }
  
  const leagueId = parseInt(ctx.match)
  if (!leagueId) {
    return ctx.reply('Usage: /subscribe 1305804')
  }
  
  const groupName = ctx.chat.title || 'Unknown Group'
  const chatId = ctx.chat.id.toString()
  
  subscribe({
    platform: 'telegram',
    destination: chatId,
    league_id: leagueId,
    preferences: { group_name: groupName }
  })
  
  ctx.reply(`✅ Subscribed to League ${leagueId}!

You'll receive:
• Pre-GW reports 24h before deadline
• Daily digests during gameweeks
• Final comprehensive reports

Use /preview to test now!`)
})

bot.command('unsubscribe', async (ctx) => {
  if (ctx.chat.type === 'private') {
    return ctx.reply('This command only works in group chats!')
  }
  
  unsubscribe('telegram', ctx.chat.id.toString())
  ctx.reply('❌ Unsubscribed from reports.')
})

bot.command('status', async (ctx) => {
  const chatId = ctx.chat.id.toString()
  const subscriptions = getSubscribedDestinations(null, 'telegram')
  const thisSub = subscriptions.find(s => s.destination === chatId)
  
  if (!thisSub) {
    return ctx.reply('Not subscribed. Use /subscribe [league_id]')
  }
  
  ctx.reply(`
📊 Subscription Status
League ID: ${thisSub.league_id}
Subscribed: ${new Date(thisSub.subscribed_at).toLocaleDateString()}
`)
})

bot.command('preview', async (ctx) => {
  const chatId = ctx.chat.id.toString()
  const subscriptions = getSubscribedDestinations(null, 'telegram')
  const thisSub = subscriptions.find(s => s.destination === chatId)
  
  if (!thisSub) {
    return ctx.reply('Not subscribed. Use /subscribe [league_id] first!')
  }
  
  ctx.reply('⏳ Generating preview...')
  
  // Get next gameweek
  const bootstrap = await getBootstrapData()
  const nextGW = bootstrap.events.find(e => new Date(e.deadline_time) > new Date())
  
  if (!nextGW) {
    return ctx.reply('No upcoming gameweek found.')
  }
  
  const report = await generatePreGameweekReport(thisSub.league_id, nextGW.id)
  const message = formatPreGWMessage(report)
  ctx.reply(message, { parse_mode: 'Markdown' })
})

console.log('🤖 Bot started and listening for commands...')
bot.start()
```

Run with: `pnpm tsx scripts/telegram-bot.ts` (keep running for interactive commands)

---

### **5. Scheduling (Optional - Choose One)**

**Option A: Manual (Testing)**
```bash
# Send pre-GW report manually to all groups subscribed to league 1305804
pnpm send:pre-gw -- --league 1305804 --gameweek 26 --type pre

# Send post-GW report manually
pnpm send:post-gw -- --league 1305804 --gameweek 25 --type post
```

**To test first:**
1. Create a test Telegram group (or use existing one)
2. Add your bot to the group
3. In group: `/subscribe 1305804`
4. Run manual send command above
5. Bot posts report in group

**Option B: GitHub Actions (Free, Automated)**

Create `.github/workflows/league-reports.yml`:
```yaml
name: Send League Reports

on:
  schedule:
    # Run daily at 11pm UTC (7am SGT next day)
    - cron: '0 23 * * *'
  workflow_dispatch: # Manual trigger

jobs:
  send-reports:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Check for reports to send
        run: pnpm tsx scripts/check-and-send-reports.ts
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          ELASTICSEARCH_URL: ${{ secrets.ELASTICSEARCH_URL }}
          ELASTICSEARCH_API_KEY: ${{ secrets.ELASTICSEARCH_API_KEY }}
```

**Option C: Local Cron (If you have a server)**
```bash
# Add to crontab
0 23 * * * cd /path/to/fpl-wrapped && pnpm tsx scripts/check-and-send-reports.ts
```

---

### **6. Smart Scheduler Script**

**6.1 Check and Send Reports**

Create `scripts/check-and-send-reports.ts`:

```typescript
#!/usr/bin/env tsx

import { getBootstrapData } from '../lib/fpl-api'
import { getAllSubscriptions } from '../lib/delivery/subscriptions'

async function main() {
  console.log('🔍 Checking for reports to send...\n')
  
  const bootstrap = await getBootstrapData()
  const currentGW = bootstrap.events.find(e => e.is_current)
  const nextGW = bootstrap.events.find(e => new Date(e.deadline_time) > new Date())
  
  // Check pre-GW reports (24h before deadline)
  if (nextGW) {
    const hoursUntilDeadline = (new Date(nextGW.deadline_time).getTime() - Date.now()) / 3600000
    if (hoursUntilDeadline > 23 && hoursUntilDeadline < 25) {
      console.log(`⏰ Sending pre-GW${nextGW.id} reports (${Math.round(hoursUntilDeadline)}h until deadline)`)
      
      const subscriptions = getAllSubscriptions()
      const uniqueLeagues = [...new Set(subscriptions.map(s => s.league_id))]
      
      for (const leagueId of uniqueLeagues) {
        console.log(`   Sending to League ${leagueId}...`)
        // Execute: pnpm send:pre-gw --league ${leagueId} --gameweek ${nextGW.id} --type pre
      }
    }
  }
  
  // Check post-GW reports (daily digests + final report)
  if (currentGW && !currentGW.finished) {
    const lastCheckFile = 'data/last-digest-check.json'
    // Check if new fixtures completed since last check
    // If yes, send daily digest
    console.log(`📊 Sending daily digest for GW${currentGW.id}`)
  }
  
  // Check for finished gameweeks (final report)
  const justFinished = bootstrap.events.find(e => {
    // Check if GW finished in last 24h
    return e.finished && !e.is_current
  })
  
  if (justFinished) {
    console.log(`✅ Sending final report for GW${justFinished.id}`)
    // Send final comprehensive reports
  }
  
  console.log('\n✨ Done!')
}

main().catch(console.error)
```

---

## **Verification**

**Phase 3: Message Delivery**
- ✅ Telegram bot token works
- ✅ Bot privacy mode disabled (can read group commands)
- ✅ Can send test message to group
- ✅ Pre-GW message formats correctly (under 4096 chars)
- ✅ Post-GW message formats correctly
- ✅ Partial data indicator shows correctly
- ✅ Group subscriptions persist in JSON file
- ✅ Manual report sending works
- ✅ Bot commands respond correctly in groups
- ✅ Bot rejects commands in private chats (except /start)

**Scheduling (Optional)**
- ✅ GitHub Actions workflow triggers
- ✅ Smart scheduler detects deadlines
- ✅ Daily digests sent correctly
- ✅ Final reports sent after GW finishes

---

## **Adding New Platforms**

The platform-agnostic architecture makes adding new delivery channels straightforward. Each platform requires ~350 lines of code:

### **Discord Example**

**1. Create `lib/delivery/discord/client.ts`** (~100 lines)
```typescript
import { Client, GatewayIntentBits } from 'discord.js'

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
})

export async function sendMessage(channelId: string, message: string) {
  const channel = await client.channels.fetch(channelId)
  if (channel?.isTextBased()) {
    await channel.send(message)
  }
}

export { client }
```

**2. Create `lib/delivery/discord/formatter.ts`** (~150 lines)
```typescript
import type { PreGameweekReport, PostGameweekReport } from '@/lib/types'

export function formatPreGWMessage(report: PreGameweekReport): string {
  // Convert Telegram markdown to Discord markdown
  // Discord uses **bold**, *italic*, __underline__
  return `
**🏆 League ${report.metadata.leagueId} - GW${report.metadata.gameweek} Preview**
...
`
}

export function formatPostGWMessage(report: PostGameweekReport, isPartial = false): string {
  // Similar formatting for Discord
}
```

**3. Create `lib/delivery/discord/bot.ts`** (~100 lines)
```typescript
import { client } from './client'
import { subscribe, unsubscribe } from '../subscriptions'

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return
  
  if (interaction.commandName === 'subscribe') {
    const leagueId = interaction.options.getInteger('league_id')
    subscribe({
      platform: 'discord',
      destination: interaction.channelId,
      league_id: leagueId,
      preferences: { guild_name: interaction.guild?.name }
    })
    await interaction.reply(`✅ Subscribed to League ${leagueId}`)
  }
})

client.login(process.env.DISCORD_BOT_TOKEN)
```

**That's it!** The query library (Phase 2) and report generation logic is completely reused.

### **Email Example**

**1. Create `lib/delivery/email/client.ts`** (~80 lines)
```typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({ from: 'FPL Reports', to, subject, html })
}
```

**2. Create `lib/delivery/email/formatter.ts`** (~200 lines)
```typescript
export function formatPreGWMessage(report: PreGameweekReport): string {
  // Convert to HTML email format
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
  <h2>🏆 League ${report.metadata.leagueId} - GW${report.metadata.gameweek} Preview</h2>
  ...
</body>
</html>
`
}
```

**Subscription:**
```typescript
subscribe({
  platform: 'email',
  destination: 'user@example.com',
  league_id: 1305804,
  preferences: { frequency: 'weekly' }
})
```

### **WhatsApp Example (via Twilio)**

Similar structure with Twilio API client, WhatsApp-optimized text formatting.

### **Key Benefits**

1. **No duplication**: All 34 query functions shared across platforms
2. **Small adapters**: ~350 lines per platform (client, formatter, bot commands)
3. **Easy subscriptions**: Unified `data/subscriptions.json` with `platform` field
4. **Consistent reports**: Same data, different formatting
5. **Independent releases**: Add Discord without touching Telegram code

---

## **Next Steps After Phase 3**

This plan focuses on **scheduled, structured reports**. For additional features:

**Conversational Chat (Separate Feature):**
- See [plan-chat.md](./plan-chat.md) for conversational interface
- Web UI at `/chat` + Telegram `/ask` command
- Answer ANY question on-demand (not scheduled)
- Uses LLM to convert natural language → ES queries

**Additional Delivery Platforms:**
- Discord adapter (~350 lines - same pattern as Telegram)
- Email adapter (~300 lines - HTML formatting)
- WhatsApp adapter (~350 lines - Twilio integration)

All platforms reuse Phase 2 query library - no duplication!
