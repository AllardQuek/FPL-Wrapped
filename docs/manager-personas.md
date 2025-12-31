# FPL Manager Personas - Complete Reference

> **Master Source**: `/lib/analysis/persona.ts`  
> **Last Updated**: December 31, 2025  
> **Total Active Personas**: 16

---

## Overview

Manager personas transform dry FPL data into a narrative. By mapping specific behaviors (hits, benching, captaincy) to real-world managers, the "Wrapped" experience feels more personalized and shareable.

Each user is assigned a primary "Manager Persona" based on their season-long statistics, with a DNA breakdown showing their mix of different managerial styles.

---

## Quick Reference Table

| Persona | The Real Manager | Trigger Logic (Primary Indicators) | Description |
| :--- | :--- | :--- | :--- |
| **The Bald Genius** | **Pep Guardiola** | High bench regret + High activity + Good efficiency despite chaos | You constantly rotate and leave hauls on the bench. But somehow, your tactical genius makes it work. |
| **The Reliable** | **David Moyes** | Low hits + High template + Low activity | You trust the process and stick to the "meta." Solid and consistent. |
| **The Wheeler-Dealer** | **Harry Redknapp** | Very high hits + High activity + Deals somehow work out | You love a transfer and aren't afraid of a -4. Somehow, your moves often work out. |
| **The Special One** | **Jose Mourinho** | Very low hits + Good efficiency + Thrifty + Moderate template | You build from the back with budget defenders. You'd rather win 1-0 than 4-3. Pragmatic warrior. |
| **Heavy Metal FPL** | **Jurgen Klopp** | Low template + High leadership + Moderate chaos | You ignore the template and chase the upside. High variance, emotional picks. |
| **The Stubborn One** | **Ruben Amorim** | High efficiency + Anti-template edge + Good captaincy | You stick to your vision when others doubt. Every move seems to turn to gold. |
| **The GOAT** | **Sir Alex Ferguson** | Elite captaincy + High efficiency + Decisive | You simply know how to win gameweeks. Your captaincy picks are legendary. |
| **The All-Outer** | **Ange Postecoglou** | High chaos + Pure anti-template + High activity + No second-guessing | Attack is your only setting. You never back down from big differential risks. Mate... |
| **The Methodical** | **Unai Emery** | High efficiency + Deep analysis + Low hits + Moderate template | Good ebening. Your preparation is unmatched. You think deeply and rarely panic. |
| **The Professor** | **Arsene Wenger** | Strong anti-template + High efficiency + Very low hits | You hunt for the perfect differential. Beautiful FPL over template following. |
| **The Calm Conductor** | **Carlo Ancelotti** | Moderate template + Low chaos + High leadership + Decisive | You stay composed under pressure. Experience is your edge. |
| **The System Builder** | **Enzo Maresca** | Moderate-high activity + Smart rotation + Anti-template youth picks | You trust young talent and rotate intelligently. Tactical flexibility is key. |
| **The Process Manager** | **Mikel Arteta** | High efficiency + High template + Very low hits | You follow the plan religiously. Elite assets only. Trust the process. |
| **The Warrior** | **Diego Simeone** | Moderate template + Very low hits + Thrifty budget master | You grind out results with grit. Defense is sacred. Budget defenders work for you. |
| **The Optimizer** | **Arne Slot** | High efficiency + High leadership + Data-driven + Smart differentials | You're meticulous and analytical. Every decision backed by stats. You find value. |
| **The Rebuilder** | **Erik ten Hag** | Very high activity + Poor efficiency + Constant tinkering | You're always one gameweek away from a masterpiece. Constant rebuilding. |

---

## UX Integration

### The Reveal
The final "Wrapped" card doesn't just show a rank; it shows the manager's portrait and their "DNA" (e.g., "70% Pep, 30% Redknapp").

### Persona Context Throughout Journey
The copy adapts to the persona throughout the experience:
- *Bench Slide*: "Leaving Mateta's 17 points on the bench? Classic Pep Roulette."
- *Transfer Slide*: "34 transfers? You're giving Harry Redknapp a run for his money."

### Supporting Data Points
To ground these personas, we use:
1. **Template Overlap**: % of your team that matches the Top 10K or overall ownership
2. **PGLT (Points Gained Lifetime of Transfer)**: Did your transfers actually work?
3. **Captaincy Efficiency**: % of points earned vs. the optimal captain in your squad
4. **Chip Gain**: Net points earned specifically due to chip activation (vs. a non-chip baseline)

---

## Eligibility Criteria (Hard Gates)

To ensure accurate persona assignments, each persona has minimum eligibility requirements. These "hard gates" prevent nonsensical assignments (e.g., getting "The GOAT" with poor captaincy).

| Persona | Minimum Requirements |
|---------|---------------------|
| **The GOAT** | Efficiency > 60% AND Leadership > 70% |
| **The Wheeler-Dealer** | Chaos > 30% AND Activity > 60% |
| **The Reliable** | Chaos < 15% AND Activity < 50% |
| **Heavy Metal FPL** | Template < 60% |
| **The All-Outer** | Template < 50% AND Activity > 50% |
| **The Bald Genius** | Overthink > 50% |
| **The Professor** | Template < 50% AND Chaos < 20% |
| **The Process Manager** | Template > 60% |
| **The Special One** | Chaos < 20% AND Thrift > 30% |
| **The Warrior** | Chaos < 15% AND Thrift > 40% |
| **The Stubborn One** | Efficiency > 60% |
| **The Optimizer** | Efficiency > 60% AND Leadership > 60% |
| **The Methodical** | Efficiency > 60% AND Chaos < 30% |
| **The Rebuilder** | Activity > 70% |
| **The Calm Conductor** | No hard gates (flexible persona) |
| **The System Builder** | No hard gates (flexible persona) |

**Note**: If no personas meet their eligibility criteria (rare edge case), the system falls back to scoring all personas to ensure every user gets assigned one.

---

## Detailed Persona Specifications

### 1. Pep Guardiola - "The Bald Genius" 🧠
**Color**: `#6CABDD` | **Traits**: Rotation Roulette, Bald Fraud Energy, Makes It Work Anyway  
**Weights**: overthink: 1.0, activity: 0.8, efficiency: 0.6  
**Image**: `pep-guardiola-bald-genius.jpg`

### 2. David Moyes - "The Reliable" 🛡️
**Color**: `#800000` | **Traits**: Template King, Hit-Averse, Solid Foundation  
**Weights**: template: 1.0, chaos: -1.0, activity: -0.5  
**Image**: `david-moyes-reliable.jpg`

### 3. Harry Redknapp - "The Wheeler-Dealer" 💸
**Color**: `#0000FF` | **Traits**: Hit Specialist, High Turnover, Deal Maker  
**Weights**: chaos: 1.0, activity: 1.0, efficiency: 0.3  
**Image**: `harry-redknapp-wheeler-dealer.jpg`

### 4. Jose Mourinho - "The Special One" 🚌
**Color**: `#132257` | **Traits**: Defense First, Pragmatic Wins, Budget Warrior  
**Weights**: chaos: -0.9, efficiency: 0.6, thrift: 0.6, template: 0.4  
**Image**: `jose-mourinho-special-one.jpg`

### 5. Jurgen Klopp - "Heavy Metal FPL" 🎸
**Color**: `#C8102E` | **Traits**: Differential Hunter, High Variance, Emotional Picks  
**Weights**: template: -0.8, leadership: 0.6, chaos: 0.4  
**Image**: `jurgen-klopp-heavy-metal.jpg`

### 6. Ruben Amorim - "The Stubborn One" 🦁
**Color**: `#005CAB` | **Traits**: Unwavering Vision, High ROI, Anti-Template Edge  
**Weights**: efficiency: 1.0, activity: 0.4, leadership: 0.4, template: -0.3  
**Image**: `ruben-amorim-stubborn-one.jpg`

### 7. Sir Alex Ferguson - "The GOAT" 👑
**Color**: `#DA291C` | **Traits**: Elite Captaincy, Serial Winner, Mental Toughness  
**Weights**: leadership: 1.0, efficiency: 0.8, overthink: -0.5  
**Image**: `alex-ferguson-goat.jpg`

### 8. Ange Postecoglou - "The All-Outer" 🦘
**Color**: `#0B0E1E` | **Traits**: All-Out Attack, Never Backs Down, Differential King  
**Weights**: chaos: 0.8, template: -1.0, activity: 0.9, overthink: -0.8  
**Image**: `ange-postecoglou-all-outer.jpg`

### 9. Unai Emery - "The Methodical" 📋
**Color**: `#7B003A` | **Traits**: Deep Analysis, Efficiency Master, Calculated Moves  
**Weights**: efficiency: 1.0, overthink: 0.8, template: 0.3, chaos: -0.6  
**Image**: `unai-emery-methodical.jpg`

### 10. Arsene Wenger - "The Professor" 🧐
**Color**: `#EF0107` | **Traits**: Differential Scout, Beautiful FPL, Low Hits  
**Weights**: template: -1.0, efficiency: 0.7, chaos: -0.8  
**Image**: `arsene-wenger-professor.jpg`

### 11. Carlo Ancelotti - "The Calm Conductor" 🤨
**Color**: `#FFFFFF` | **Traits**: Cool Under Pressure, Balanced Approach, Veteran Wisdom  
**Weights**: template: 0.6, chaos: -0.7, leadership: 0.8, overthink: -0.5  
**Image**: `carlo-ancelotti-calm-conductor.jpg`

### 12. Enzo Maresca - "The System Builder" 🎯
**Color**: `#034694` | **Traits**: Youth Over Experience, Tactical Flexibility, Smart Rotation  
**Weights**: activity: 0.7, overthink: 0.5, efficiency: 0.6, template: -0.3  
**Image**: `enzo-maresca-system-builder.jpg`

### 13. Mikel Arteta - "The Process Manager" 🏗️
**Color**: `#EF0107` | **Traits**: Trust the Process, Efficiency First, Elite Template  
**Weights**: efficiency: 0.8, template: 1.0, chaos: -0.8  
**Image**: `mikel-arteta-process-manager.jpg`

### 14. Diego Simeone - "The Warrior" ⚔️
**Color**: `#CB3524` | **Traits**: Never Surrender, Defensive Fortress, Budget Master  
**Weights**: template: 0.7, chaos: -0.9, leadership: 0.6, thrift: 0.8  
**Image**: `diego-simeone-warrior.jpg`

### 15. Arne Slot - "The Optimizer" 📊
**Color**: `#D00027` | **Traits**: Data-Driven, Smart Differentials, High Efficiency  
**Weights**: efficiency: 1.0, leadership: 0.7, overthink: 0.4, chaos: -0.6, template: 0.3  
**Image**: `arne-slot-optimizer.jpg`

### 16. Erik ten Hag - "The Rebuilder" 📉
**Color**: `#DA291C` | **Traits**: Constant Rebuild, High Potential, Inconsistent  
**Weights**: activity: 1.0, efficiency: -0.5, overthink: 0.5  
**Image**: `erik-ten-hag-rebuilder.jpg`

---

## Scoring System

### Normalized Metrics (0-1 scale)
- **activity**: Total transfers / 50
- **chaos**: Total hits / 20
- **overthink**: Average bench points / 12
- **template**: Template overlap / 100
- **efficiency**: Transfer efficiency / 15
- **leadership**: Captaincy efficiency / 100
- **thrift**: (1040 - squad value) / 60

### Persona Score Calculation
```typescript
baseScore = 20
for each weight in persona.weights:
    score += (metrics[weight.key] * weight.value * 50)
finalScore = max(0, score)
```

The persona with the highest final score is assigned as the primary persona.

---

## Image Naming Convention

All persona images follow the format:
```
{manager-name}-{persona-title}.jpg
```

Example: `pep-guardiola-bald-genius.jpg`

Images are stored in: `/public/images/personas/`

---

## Metrics System Explained

All persona scoring is based on 7 normalized metrics (0-1 scale). Understanding these helps explain your persona assignment.

### 1. Transfer Activity (activity)
**What it measures**: How frequently you make transfers throughout the season  
**Calculation**: `Total transfers ÷ 50`  
**Interpretation**:
- **Low (< 0.3)**: Passive, patient approach (15 transfers = 0.3)
- **Medium (0.3-0.7)**: Balanced strategy (30 transfers = 0.6)
- **High (> 0.7)**: Very active (45 transfers = 0.9)

### 2. Hit Taker (chaos)
**What it measures**: How often you take point hits for extra transfers  
**Calculation**: `Total hits taken ÷ 20`  
**Interpretation**:
- **Low (< 0.2)**: Rarely takes hits, patient (2 hits = 0.1)
- **Medium (0.2-0.5)**: Occasional tactical hits (6 hits = 0.3)
- **High (> 0.5)**: Frequent hits, aggressive (15 hits = 0.75)

### 3. Bench Regret (overthink)
**What it measures**: Average points left on the bench each week (rotation struggles)  
**Calculation**: `Average bench points per week ÷ 12`  
**Interpretation**:
- **Low (< 0.3)**: Good team selection (3 pts/week = 0.25)
- **Medium (0.3-0.6)**: Occasional regret (6 pts/week = 0.5)
- **High (> 0.6)**: Frequent rotation errors (10 pts/week = 0.83)

### 4. Template Follower (template)
**What it measures**: How closely your team matches popular ownership  
**Calculation**: `Template overlap percentage ÷ 100`  
**Interpretation**:
- **Low (< 0.4)**: Anti-template, differential heavy (30% = 0.3)
- **Medium (0.4-0.7)**: Mix of both (55% = 0.55)
- **High (> 0.7)**: Strong template follower (85% = 0.85)

### 5. Net Transfer Impact (efficiency)
**What it measures**: Points gained from transfers over their lifetime (PGLT methodology)  
**Calculation**: `Transfer efficiency score ÷ 15`  
**Interpretation**:
- **Low (< 0.3)**: Negative transfer ROI (2.0 PGLT = 0.13)
- **Medium (0.3-0.7)**: Neutral to positive (8.0 PGLT = 0.53)
- **High (> 0.7)**: Excellent transfers (12.0 PGLT = 0.80)

### 6. Captain Accuracy (leadership)
**What it measures**: Percentage of optimal captain points achieved  
**Calculation**: `Captaincy efficiency ÷ 100`  
**Interpretation**:
- **Low (< 0.5)**: Poor captain choices (45% = 0.45)
- **Medium (0.5-0.7)**: Decent picks (65% = 0.65)
- **High (> 0.7)**: Elite captaincy (85% = 0.85)

### 7. Budget Optimizer (thrift)
**What it measures**: How well you maximize value from budget assets  
**Calculation**: `(1040 - squad value) ÷ 60`  
**Interpretation**:
- **Low (< 0.3)**: Premium focused (1025 value = 0.25)
- **Medium (0.3-0.6)**: Balanced budget (1005 value = 0.58)
- **High (> 0.6)**: Budget master (985 value = 0.92)

**Note**: These metrics are defined in `/lib/analysis/metrics.ts` for developer reference.

---

## DNA Spectrum

Each user receives a "Manager DNA" breakdown showing their top 4 playstyle traits with percentage bars, justifying why they received their persona.

Example traits:
- Hit Taker (chaos score)
- Bench Regret (overthink score)
- Template Follower (template score)
- Net Transfer Impact (efficiency score)
- Captain Accuracy (leadership score)
- Budget Optimizer (thrift score)

---

## Memorable Moments

The persona card displays up to 3 memorable moments from the season:

1. **Best Transfer**: When PGLT > 10 points
2. **Worst Bench**: When missed points > 15
3. **Best Captain**: When captain points > 20
4. **Worst Captain**: When points left on table > 15
5. **Best Chip**: When chip points gained > 15

These are displayed as one-liner highlights to give specific context to the manager's season.

---

## Removed Personas

The following personas were removed and are no longer in the codebase:

- ❌ **Sam Allardyce** - "The Fireman" (removed: less relevant to modern FPL)
- ❌ **Marcelo Bielsa** - "The Extremist" (removed: no longer in Premier League)
- ❌ **Antonio Conte** - "The Driller" (removed: no longer in Premier League)
- ❌ **Sean Dyche** - "The Survivalist" (removed: December 2025)

---

## Implementation Files

- **Persona Logic**: `/lib/analysis/persona.ts`
- **Image Mapping**: `/lib/constants/persona-images.ts`
- **Type Definitions**: `/lib/types.ts` (ManagerPersona interface)
- **UI Component**: `/components/cards/PersonaCard.tsx`
- **Image Assets**: `/public/images/personas/`
