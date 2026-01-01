# Behavioral Signals for Persona Classification

**Date**: December 31, 2025  
**Purpose**: Detect specific behavioral patterns that strongly indicate certain manager personas

---

## Overview

Beyond aggregate metrics (e.g., total hits, average bench points), we now detect **specific behavioral patterns** that are dead giveaways for certain personas. These signals provide much stronger classification confidence than pure statistical analysis.

---

## Behavioral Signals Detected

### 1. **Stubborn Loyalty** 🦁
**Pattern**: Owned a player for 10+ consecutive gameweeks despite ownership dropping

**Indicates**: **Ruben Amorim - The Stubborn One**
- **Boost**: 80% score multiplier
- **Why**: Shows unwavering vision and conviction in a player when others doubted
- **Example**: Keeping Isak through a dry spell when his ownership dropped from 30% to 12%

---

### 2. **Hit Addict** 💸
**Pattern**: 3+ consecutive gameweeks with point hits taken

**Indicates**: 
- **Harry Redknapp - The Wheeler-Dealer** (70% boost)
- **Erik ten Hag - The Rebuilder** (50% boost)
- **Why**: Shows compulsive transfer behavior, always chasing the next deal
- **Example**: Taking -4, -8, -12 across GW15-17 trying to fix the squad

---

### 3. **Early Wildcard** 🦘
**Pattern**: Used wildcard before Gameweek 10

**Indicates**: **Ange Postecoglou - The All-Outer**
- **Boost**: 60% score multiplier
- **Why**: All-out attack mentality from the start, no holding back
- **Example**: Wildcarding GW3 to go full differential

---

### 4. **Chip Hoarder** 📋⚔️
**Pattern**: All chips used after Gameweek 25

**Indicates**: 
- **Unai Emery - The Methodical** (50% boost)
- **Jose Mourinho - The Special One** (40% boost)
- **Why**: Patient, strategic planning - waiting for the perfect moment
- **Example**: Saving Bench Boost for DGW35, Triple Captain for GW38

---

### 5. **Extreme Bench Regret** 🧠
**Pattern**: Average bench points > 11.25/week (overthink > 0.75)

**Indicates**: **Pep Guardiola - The Bald Genius**
- **Boost**: 90% score multiplier
- **Why**: Classic Pep roulette - overthinking team selection every week
- **Example**: Leaving Watkins' 18-pointer on the bench 3 times in a season

---

### 6. **Extreme Hit-Taking** 💸
**Pattern**: Average hits > 18 for the season (chaos > 0.6)

**Indicates**: **Harry Redknapp - The Wheeler-Dealer**
- **Boost**: 60% score multiplier
- **Why**: Not just many transfers, but aggressive hit-taking
- **Example**: 25+ hits in a season, -12 in a single gameweek

---

### 7. **Pure Contrarian** 🧐🎸
**Pattern**: Template overlap < 25%

**Indicates**:
- **Arsene Wenger - The Professor** (70% boost)
- **Jurgen Klopp - Heavy Metal FPL** (50% boost)
- **Why**: Actively avoids the template, hunts for differentials
- **Example**: Squad has 0 players from Top 10K template

---

### 8. **Elite Captaincy** 👑
**Pattern**: Captaincy accuracy > 85%

**Indicates**: **Sir Alex Ferguson - The GOAT**
- **Boost**: 80% score multiplier
- **Why**: Legendary decision-making, always picks the right captain
- **Example**: 32+ optimal captain picks out of 38 gameweeks

---

### 9. **Pure Template + No Hits** 🛡️🏗️
**Pattern**: Template overlap > 80% AND hits < 2.4 for season

**Indicates**:
- **David Moyes - The Reliable** (70% boost)
- **Mikel Arteta - The Process Manager** (50% boost)
- **Why**: Ultimate consistency, follows the meta perfectly with discipline
- **Example**: 85% template overlap, only 2 hits all season

---

## How Behavioral Signals Work

### Signal Detection (Step 1)
```typescript
const behavioralSignals = detectBehavioralSignals(data, transfers);
// Returns: { stubbornLoyalty: true, hitAddict: false, ... }
```

### Score Boosting (Step 2)
```typescript
if (behavioralSignals.stubbornLoyalty) {
    scores['AMORIM'] *= 1.8;  // 80% boost
}
```

### Combined with Metrics (Step 3)
- Base score calculated from weighted metrics
- Behavioral signals apply multiplicative boosts
- Result: Clear patterns override marginal statistical differences

---

## Examples of Signal Impact

### Example 1: The Stubborn Differential Player
**Metrics**:
- Efficiency: 0.70 (good)
- Template: 0.45 (differential)
- Activity: 0.40 (moderate)

**Without Signal**: Might be Klopp (anti-template) or Slot (efficient)
**With Stubborn Loyalty Signal**: **Ruben Amorim** gets 80% boost → clear winner
**Why**: The loyalty pattern is the defining characteristic

---

### Example 2: The Extreme Tinkerer
**Metrics**:
- Activity: 0.85 (very high)
- Chaos: 0.65 (extreme hits)
- Efficiency: 0.25 (poor)

**Without Signal**: Could be Ten Hag or Redknapp
**With Hit Addict Signal**: **Harry Redknapp** gets 70% boost → clear winner
**Why**: 3+ consecutive hits is classic wheeler-dealer behavior

---

### Example 3: The Bench Rotation Victim
**Metrics**:
- Overthink: 0.78 (extreme)
- Activity: 0.60 (active)
- Template: 0.65 (mostly template)

**Without Signal**: Might be Pep or Maresca
**With Extreme Bench Regret Signal**: **Pep Guardiola** gets 90% boost → clear winner
**Why**: 11+ points/week on bench is pure Pep roulette

---

## Benefits of This Approach

1. **More Accurate**: Behavioral patterns > aggregate stats
2. **More Explainable**: "You're Amorim because you kept Haaland for 15 weeks while everyone sold"
3. **More Distinctive**: Clear signals prevent everyone clustering to middle personas
4. **Still Deterministic**: Same behavior = same result
5. **Human-Recognizable**: People relate to these patterns ("Oh yeah, I do take hits in bunches!")

---

## Future Signal Ideas

### Potential additions:
- **Knee-Jerk Reactor**: Transfers in players who just scored
- **Form Chaser**: Only targets players on hot streaks
- **Fixture Expert**: Makes moves based on upcoming fixtures
- **Injury Bargain Hunter**: Grabs injured players before price rises
- **Triple Captain Punter**: Uses TC on a risky differential
- **Set-and-Forget Master**: < 20 transfers all season

---

## Testing Recommendations

To verify signal detection works:

1. **Stubborn Loyalty**: User who owns Salah all 38 GWs → Should boost Amorim
2. **Hit Addict**: User with -4, -8, -4 in GW10-12 → Should boost Redknapp
3. **Extreme Bench**: User averaging 12 pts/week on bench → Should boost Pep
4. **Elite Captain**: User with 90% optimal picks → Should boost Ferguson
5. **Pure Template**: User with 85% template + 1 hit → Should boost Moyes/Arteta

---

## Notes

- Signals apply **multiplicative boosts** after base scoring
- Multiple signals can stack (e.g., hit addict + extreme chaos)
- Signals help break ties when metrics are close
- All signal thresholds are tuned to capture ~10-20% of managers
