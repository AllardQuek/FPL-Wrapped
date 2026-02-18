# Manager Persona Algorithm Improvements

**Date**: December 31, 2025  
**Issue**: Everyone was being classified as Pep Guardiola  
**Root Cause**: Weak scoring differentiation and lenient eligibility gates

---

## Problems Identified

### 1. **Normalization Ranges Too Narrow**
- **Old**: `activity: totalTransfers / 50` → 25 transfers = 0.5 (most managers clustered near 1.0)
- **Old**: `chaos: totalHits / 20` → 10 hits = 0.5 (easy to max out)
- **Old**: `overthink: avgBench / 12` → 6 pts/week = 0.5 (most hit ceiling)

### 2. **Base Score Problem**
- Every persona started with **20 points**
- Weight contributions: `metricValue * weight * 50`
- Result: All personas scored 20-70, differences too small

### 3. **Weak Eligibility Gates**
- Pep only required `overthink > 0.5` (too easy to qualify)
- Most managers had some bench regret, so qualified for Pep
- No strong disqualifiers for opposite behaviors

### 4. **No Deal-Breaker Logic**
- Someone with 90% template overlap could still get "The Professor" (anti-template)
- Someone who never takes hits could get "The Wheeler-Dealer"

---

## Solutions Implemented

### ✅ 1. Wider Normalization Ranges
```typescript
// BEFORE → AFTER
activity: totalTransfers / 50  →  totalTransfers / 80    // 40 transfers = 0.5
chaos: totalHits / 20          →  totalHits / 30         // 15 hits = 0.5
overthink: avgBench / 12       →  avgBench / 15          // 7.5 pts/week = 0.5
```

**Impact**: Better distribution across 0-1 scale, more granular differentiation

### ✅ 2. Amplified Weight Impact
```typescript
// BEFORE
let score = 20;  // Base score
score += (metricValue * weight * 50);

// AFTER
let score = 0;   // No base score
score += (metricValue * weight * 100);  // Doubled multiplier
```

**Impact**: Weights now create much larger score differences between personas

### ✅ 3. Stronger Persona Weights

**Example - Pep Guardiola:**
```typescript
// BEFORE: { overthink: 1.0, activity: 0.8, efficiency: 0.6 }
// AFTER:  { overthink: 1.5, activity: 0.9, efficiency: 0.4, template: 0.3, chaos: -0.5 }
```
- Increased overthink requirement
- Added negative chaos weight (Pep doesn't take many hits)
- Added template weight (Pep uses popular players, just rotates them)

**Example - Redknapp (Wheeler-Dealer):**
```typescript
// BEFORE: { chaos: 1.0, activity: 1.0, efficiency: 0.3 }
// AFTER:  { chaos: 1.5, activity: 1.2, efficiency: -0.3, overthink: 0.3, template: -0.4 }
```
- Amplified hit-taking requirement
- Negative efficiency (deals don't always work)
- Negative template (goes off-script)

### ✅ 4. Stricter Eligibility Gates

| Persona | Old Gate | New Gate | Reason |
|---------|----------|----------|--------|
| **Pep** | overthink > 0.5 | overthink > 0.55 | Must have significant bench regret |
| **Ferguson** | efficiency > 0.6 AND leadership > 0.7 | efficiency > 0.65 AND leadership > 0.75 | True excellence required |
| **Redknapp** | chaos > 0.3 AND activity > 0.6 | chaos > 0.35 AND activity > 0.5 | Must actually take hits |
| **Moyes** | chaos < 0.15 AND activity < 0.5 | chaos < 0.12 AND activity < 0.45 AND template > 0.5 | True stability + template |
| **Arteta** | template > 0.6 | template > 0.65 AND efficiency > 0.5 | Process requires discipline |

### ✅ 5. Deal-Breaker Logic

**Hard incompatibilities that override everything else:**

```typescript
// High template (>0.7) → CANNOT be differential hunters
if (template > 0.7) → Block: Wenger, Klopp, Postecoglou

// Very low chaos (<0.1) → CANNOT be hit specialists  
if (chaos < 0.1) → Block: Redknapp, Ten Hag

// Very low overthink (<0.3) → CANNOT be Pep
if (overthink < 0.3) → Block: Pep

// Very low activity (<0.25) → CANNOT be active managers
if (activity < 0.25) → Block: Redknapp, Ten Hag, Postecoglou, Maresca

// Anti-template (<0.4) → CANNOT be template followers
if (template < 0.4) → Block: Moyes, Arteta, Simeone
```

---

## Phase 3: Centroid-Based Scoring & Timing Integration

### ✅ 6. Centroid-Based Scoring
**Issue**: Heavy clustering on "Unai Emery" (5/8 test managers) due to score saturation and overlapping weights.
**Solution**: Transitioned to a hybrid model combining deterministic weights with **Euclidean Distance** in a 4D personality space.

**4D Personality Space**:
1. **Differential vs. Template**: How much the manager deviates from the crowd.
2. **Analyzer vs. Intuitive**: Data-driven planning vs. gut-feel/reactive moves.
3. **Patient vs. Reactive**: Willingness to wait vs. urgency to act.
4. **Cautious vs. Aggressive**: Risk aversion vs. hit-taking/bold moves.

**Vector Gravity**:
Behavioral signals now act as "gravity," pulling the manager's 4D vector toward specific poles:
- `earlyPlanner` → Pulls toward **Analyzer** and **Patient**.
- `kneeJerker` → Pulls toward **Reactive**.
- `hitAddict` → Pulls toward **Aggressive**.

**Distance Multiplier**:
Final scores are adjusted by a distance-based multiplier: $1 / (1 + distance^2)$. This ensures that even if two personas have similar weights, the one whose "personality centroid" is closer to the manager's actual behavior wins.

### ✅ 7. Transfer Timing Integration
**Issue**: Managers were being classified as "methodical" (Emery) just for having high efficiency, regardless of *when* they made moves.
**Solution**: Added `transferTiming` as a core metric.
- **Early Strategic**: Moves made >48h before deadline.
- **Panic/Deadline**: Moves made <3h before deadline.
- **Late Night**: Moves made between 11 PM and 4 AM.

**Impact**: Emery is now strictly reserved for `earlyPlanners` with high rank, while Mourinho/Redknapp capture the "Deadline Day" specialists.

---

## Clear Archetype Examples

### 🧠 **Pep Guardiola - The Bald Genius**
**Required Data Pattern:**
- Bench points per week: **8-10+** (overthink > 0.55)
- Active transferring but not excessive hits
- Has popular players but rotates them poorly
- Decent efficiency despite rotation pain

**Example Manager:**
- 50 transfers (0.625 activity)
- 8 hits (0.267 chaos)
- 9 pts/week on bench (0.60 overthink)
- 70% template overlap

### 💸 **Harry Redknapp - The Wheeler-Dealer**
**Required Data Pattern:**
- Point hits: **12+** (chaos > 0.35)
- High transfer count: **40+** (activity > 0.5)
- Mixed success on transfers
- Willing to go off-template for deals

**Example Manager:**
- 60 transfers (0.75 activity)
- 15 hits (0.50 chaos)
- Negative transfer efficiency
- 50% template overlap

### 🛡️ **David Moyes - The Reliable**
**Required Data Pattern:**
- Very few hits: **<4** (chaos < 0.12)
- Low transfer count: **<35** (activity < 0.45)
- High template overlap: **>50%**
- Set and forget approach

**Example Manager:**
- 25 transfers (0.313 activity)
- 2 hits (0.067 chaos)
- 75% template overlap
- Steady, reliable picks

### 🎸 **Jurgen Klopp - Heavy Metal FPL**
**Required Data Pattern:**
- Low template overlap: **<55%**
- Chases differentials
- Moderate chaos tolerated
- When it works, it really works

**Example Manager:**
- 45% template overlap
- Bold captaincy choices
- Punts on form players
- High variance results

### 👑 **Sir Alex Ferguson - The GOAT**
**Required Data Pattern:**
- Elite efficiency: **>65%**
- Elite captaincy: **>75%**
- Simply wins gameweeks
- Consistently good decisions

**Example Manager:**
- 70% captaincy efficiency
- 80% transfer efficiency
- Top 100K rank
- Legendary picks

---

## Testing Recommendations

To verify the algorithm works properly, test with these profile types:

1. **Template Follower (35 transfers, 3 hits, 65% template)** → Should get: Moyes or Arteta
2. **Hit Taker (55 transfers, 18 hits, 50% template)** → Should get: Redknapp
3. **Bench Regret (45 transfers, 8 pts/week benched)** → Should get: Pep
4. **Differential Hunter (45 transfers, 2 hits, 35% template)** → Should get: Wenger or Klopp
5. **Tinkerer (70 transfers, 12 hits, poor efficiency)** → Should get: Ten Hag
6. **Elite Manager (75% captain acc, 80% efficiency)** → Should get: Ferguson or Slot

---

## Expected Distribution

With these changes, persona distribution should look like:

- **Pep**: 10-15% (only high bench regret)
- **Moyes/Arteta**: 20-25% (template followers)
- **Redknapp**: 5-10% (hit takers)
- **Klopp/Wenger/Postecoglou**: 15-20% (differential hunters)
- **Ferguson/Slot**: 5-8% (elite managers)
- **Ancelotti/Maresca**: 15-20% (balanced/flexible)
- **Others**: Remaining distribution

**Key**: No single persona should exceed 30% of the user base.

---

## Phase 3: Centroid-Based Scoring (The "Emery Fix")

In the final refinement, we moved from a purely additive/multiplicative scoring system to a **Centroid-Based Vector Model**.

### Rationale for the Shift
The previous system suffered from "Emery Gravity." Because Unai Emery was defined as the "Balanced/Methodical" persona, he became the default for any manager who didn't have extreme outliers. In a weighted system, "average" scores across multiple categories often summed up to favor the most "average" persona.

### The 4D Personality Space
We now map every manager into a 4-dimensional vector space:
1.  **Differential (D)**: High ownership vs. low ownership preference.
2.  **Analyzer (A)**: Statistical efficiency and captaincy accuracy.
3.  **Patient (P)**: Transfer timing and hit-taking behavior.
4.  **Cautious (C)**: Risk aversion and template adherence.

### Vector Gravity
Instead of just checking if a metric is "high," we use **Behavioral Signals** to pull the manager's vector toward specific poles:
-   `earlyPlanner` pulls the vector toward **Patient**.
-   `kneeJerker` pulls the vector away from **Patient**.
-   `templateSlave` pulls the vector toward **Cautious**.
-   `maverick` pulls the vector toward **Differential**.

### Distance-Based Selection
The final persona is selected by calculating the **Euclidean Distance** between the manager's 4D vector and each persona's "Ideal Centroid."
-   **Primary Selection**: The persona with the highest score (boosted by proximity).
-   **Tie-Breaking**: If scores are close, the persona with the shortest geometric distance to the manager's behavior wins.

This ensures that a manager is assigned to the persona they *most closely resemble* in character, not just the one whose weights happened to sum the highest.

---

## Monitoring Metrics

To ensure algorithm health, track:

1. **Persona Distribution** - No persona > 30%
2. **Metric Variance** - Users getting same persona should have similar metrics
3. **Edge Case Handling** - Verify fallback works when no personas qualify
4. **User Sentiment** - Do people agree with their assignment?

---

## Next Steps

If issues persist:
1. Log actual metric values for misclassified users
2. Analyze score distributions per persona
3. Consider dynamic thresholds based on season-wide distributions
4. Add more nuanced sub-personas (e.g., "Early Season Pep" vs "Late Season Pep")
