# Persona Algorithm V3 - Criteria-Based Matching

## Sound Logic Principles

### 1. Total Transfers are MISLEADING
- **Problem**: Wildcards and Free Hits inflate transfer counts artificially
- **Solution**: Use `event_transfers` per gameweek to detect patterns
- **Good Indicators**:
  - Consecutive weeks with 2+ transfers (indecisiveness/tinkering)
  - Hits taken (chaos tolerance)
  - Transfers outside of chips (organic activity)

### 2. Bench Points Alone Mean Nothing
- **Problem**: Low bench points could mean bad squad OR good rotation
- **Solution**: Look at bench regret **relative to squad value**
- **Better Metrics**:
  - Bench points vs squad value
  - Number of times left 10+ points on bench (clear mistakes)
  - Automatic subs triggered (poor captain/starter predictions)

### 3. Criteria-Based Matching is Superior
- Each persona has 5-7 specific, measurable criteria
- Count how many criteria each manager meets
- Choose persona with most matches
- Tie-breaker: weighted scoring of matched criteria

## Available Data Points

From ManagerHistory:
- `current[]`: Each gameweek's performance
  - `event`: GW number
  - `points`: GW points
  - `total_points`: Season total
  - `rank`: GW rank
  - `overall_rank`: Overall rank
  - `bank`: Money in bank
  - `value`: Squad value
  - `event_transfers`: Transfers made this GW
  - `event_transfers_cost`: Hit cost
  - `points_on_bench`: Bench points

From Chips:
- `chips[]`: When each chip was used
  - `name`: wildcard/bencboost/3xc/freehit
  - `event`: GW used
  - `chip_plays`: Usage stats

From Transfers:
- Each individual transfer with timestamp
- Can detect: bunched transfers, late transfers, panic moves

From Analysis Results:
- Transfer efficiency (net points gained)
- Captaincy success rate
- Best/worst transfers
- Best/worst captains
- Chip effectiveness

## Persona Criteria Definitions

### Pep Guardiola - "The Bald Genius"
**Core Trait**: Rotation complexity, leaves points on bench regularly
**Criteria**:
1. ✅ 5+ gameweeks with 8+ points left on bench (rotation pain)
2. ✅ Squad value consistently high (>£103m avg) - has good players
3. ✅ Low hits taken (<3 total) - not chaotic, just rotates badly
4. ✅ Decent transfer efficiency (>0 net points) - makes good signings
5. ✅ Multiple automatic subs triggered (>5) - bad lineup predictions

**Logic**: Good squad, makes good transfers, but constantly picks wrong starters

---

### Erik ten Hag - "The Rebuilder"
**Core Trait**: Constantly tinkering, always one move away from perfection
**Criteria**:
1. ✅ 10+ gameweeks with 2+ non-chip transfers (constant changes)
2. ✅ 5+ hits taken (willing to take pain for perfection)
3. ✅ Negative or barely positive transfer efficiency (<50 net points)
4. ✅ High squad turnover (50+ unique players owned)
5. ✅ Never satisfied - multiple transfers in good gameweeks too

**Logic**: Can't stop tinkering, high activity, inefficient

---

### Harry Redknapp - "The Wheeler-Dealer"
**Core Trait**: Hit specialist, makes deals constantly
**Criteria**:
1. ✅ 8+ hits taken across season
2. ✅ Multiple consecutive hit weeks (3+ GWs in a row)
3. ✅ Actually POSITIVE transfer efficiency despite hits (>100 points)
4. ✅ High transfer count (40+ non-chip transfers)
5. ✅ "Dealmaker" pattern: buys low, sells high based on fixtures

**Logic**: Takes lots of hits but they pay off - wheeler-dealer magic

---

### Arsene Wenger - "The Professor"
**Core Trait**: Finds hidden gems, avoids template, minimal hits
**Criteria**:
1. ✅ Template overlap < 25% (true contrarian)
2. ✅ Hits taken ≤ 2 (disciplined, patient)
3. ✅ Positive transfer efficiency (>100 points) - gems pay off
4. ✅ Owned 3+ players with <5% ownership that scored 50+ points
5. ✅ Squad value stays efficient (< £102m) - finds value

**Logic**: Patient professor finding bargains, not following herd

---

### Jurgen Klopp - "Heavy Metal FPL"
**Core Trait**: High variance, chases differentials, emotional
**Criteria**:
1. ✅ Template overlap < 30% (differential hunter)
2. ✅ High rank volatility (10+ GWs with 2M+ rank swings)
3. ✅ Early aggressive chips (wildcard before GW15 or TC before GW25)
4. ✅ Multiple high-risk captains (3+ captains with <10% EO)
5. ✅ Boom-bust pattern: 5+ GWs with 70+ points AND 5+ GWs with <40 points

**Logic**: High variance, differential heavy, emotional picks

---

### David Moyes - "The Reliable"
**Core Trait**: Template follower, safe plays, consistency
**Criteria**:
1. ✅ Template overlap > 60% (follows the pack)
2. ✅ Hits taken ≤ 1 (extremely conservative)
3. ✅ Low rank volatility (most GWs within 1M rank of average)
4. ✅ Captains mostly template (Haaland/Salah 80%+ of time)
5. ✅ Chips used at "sensible" times (wildcard GW10-20, BB GW30+)

**Logic**: Boring but effective, follows proven strategies

---

### Ruben Amorim - "The Stubborn One"
**Core Trait**: Backs his picks long-term, high conviction
**Criteria**:
1. ✅ 3+ players owned for 10+ consecutive gameweeks
2. ✅ Very positive transfer efficiency (>150 points) - picks pay off
3. ✅ Low transfer volume (<35 transfers)
4. ✅ Rarely sells players before they blank (patient)
5. ✅ Template overlap 20-40% (some template, some unique)

**Logic**: Stubborn loyalty to picks, but they deliver

---

### Sir Alex Ferguson - "The GOAT"
**Core Trait**: Elite at everything, serial winner
**Criteria**:
1. ✅ Overall rank < 100k (top 1%)
2. ✅ Captaincy success rate > 45%
3. ✅ Transfer efficiency > 200 points
4. ✅ Bench grade B or better (<8 avg bench points)
5. ✅ At least 1 chip with "excellent" rating

**Logic**: Simply elite at every aspect

---

### Ange Postecoglou - "The All-Outer"
**Core Trait**: Aggressive, differential, all-out attack
**Criteria**:
1. ✅ Template overlap < 35% (loves differentials)
2. ✅ High activity (35+ transfers)
3. ✅ Early wildcard (before GW12) - aggressive restructure
4. ✅ Forwards/Mids heavy (60%+ of budget on attacking players)
5. ✅ Risk-taking: 3+ differential captains (<15% EO)

**Logic**: All-out attack, never backs down, differential king

---

### Unai Emery - "The Methodical"
**Core Trait**: Efficient, calculated, rarely panics
**Criteria**:
1. ✅ Transfer efficiency > 150 points
2. ✅ Hits taken ≤ 3 (disciplined)
3. ✅ Avg bench points < 8 (rotation planning works)
4. ✅ All chips used strategically (all gain 15+ points)
5. ✅ Consistent performance (std dev of GW points < 20)

**Logic**: Good ebening - methodical preparation works

---

## Implementation Strategy

### Step 1: Calculate All Criteria
```typescript
function calculatePersonaCriteria(data: ManagerData, analyses: AllAnalyses) {
  return {
    // Bench patterns
    gameweeksWithHighBench: countGWsWhere(data, gw => gw.points_on_bench >= 8),
    benchRegretCount: countGWsWhere(data, gw => gw.points_on_bench >= 10),
    avgSquadValue: calculateAvgSquadValue(data),
    
    // Transfer patterns  
    gameweeksWithMultipleTransfers: countGWsWhere(data, gw => gw.event_transfers >= 2 && !isChipWeek(gw)),
    totalHits: data.history.current.reduce((sum, gw) => sum + gw.event_transfers_cost / 4, 0),
    transferEfficiency: analyses.netTransferPoints,
    uniquePlayersOwned: countUniquePlayerIds(data),
    nonChipTransfers: countNonChipTransfers(data),
    
    // Template & differentials
    templateOverlap: analyses.templateOverlap,
    lowOwnershipHeroes: findLowOwnershipScorers(data), // <5% owned, 50+ pts
    
    // Captaincy patterns
    captaincySuccessRate: analyses.captaincySuccessRate,
    differentialCaptains: countDifferentialCaptains(data), // <15% EO
    
    // Volatility & consistency
    rankVolatility: calculateRankVolatility(data),
    pointsStdDev: calculatePointsStdDev(data),
    boomGWs: countGWsWhere(data, gw => gw.points >= 70),
    bustGWs: countGWsWhere(data, gw => gw.points < 40),
    
    // Loyalty & conviction
    longTermHolds: findLongTermHolds(data), // 10+ GWs
    
    // Chip timing
    chipTimings: getChipTimings(data),
    excellentChips: analyses.chipAnalyses.filter(c => c.isExcellent).length,
    
    // Performance
    overallRank: data.managerInfo.summary_overall_rank,
  };
}
```

### Step 2: Match Against Each Persona
```typescript
function matchPersonaCriteria(criteria: PersonaCriteria): PersonaMatches {
  const matches: Record<string, number> = {};
  
  // Pep Guardiola
  let pepMatches = 0;
  if (criteria.benchRegretCount >= 5) pepMatches++;
  if (criteria.avgSquadValue > 1030) pepMatches++;
  if (criteria.totalHits < 3) pepMatches++;
  if (criteria.transferEfficiency > 0) pepMatches++;
  if (criteria.automaticSubs > 5) pepMatches++;
  matches.PEP = pepMatches;
  
  // Ten Hag
  let tenHagMatches = 0;
  if (criteria.gameweeksWithMultipleTransfers >= 10) tenHagMatches++;
  if (criteria.totalHits >= 5) tenHagMatches++;
  if (criteria.transferEfficiency < 50) tenHagMatches++;
  if (criteria.uniquePlayersOwned >= 50) tenHagMatches++;
  matches.TENHAG = tenHagMatches;
  
  // ... repeat for all personas
  
  return matches;
}
```

### Step 3: Select Best Match
```typescript
function selectBestPersona(matches: PersonaMatches, criteria: PersonaCriteria): Persona {
  // Find personas with most criteria matches
  const sortedMatches = Object.entries(matches)
    .sort((a, b) => b[1] - a[1]);
  
  const topScore = sortedMatches[0][1];
  const topPersonas = sortedMatches.filter(([_, score]) => score === topScore);
  
  // If tie, use secondary scoring
  if (topPersonas.length > 1) {
    return breakTie(topPersonas, criteria);
  }
  
  return getPersonaById(topPersonas[0][0]);
}
```

## Benefits

1. **Transparent**: Each criteria is clear and measurable
2. **Debuggable**: Can see exactly which criteria matched
3. **Sound Logic**: No misleading metrics
4. **Flexible**: Easy to add/adjust criteria
5. **Fair**: Everyone judged by same standards
