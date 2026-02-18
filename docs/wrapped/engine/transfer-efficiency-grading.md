# Transfer Efficiency Grading Algorithm

## Overview

Transfer efficiency measures the net point gain from transfers (points gained minus hit costs) normalized by the actual gameweeks each transfer was held. This accounts for the fact that early-season transfers have more opportunities to accumulate points than late-season transfers.

## Formula

```
Transfer Efficiency = Net Transfer Points - Total Hit Costs
Pts per Transfer-GW = Transfer Efficiency ÷ Actual Transfer-GWs
```

Where:
- **Net Transfer Points**: Sum of (Player In Points - Player Out Points) for all transfers
- **Total Hit Costs**: Total points deducted for hits taken
- **Actual Transfer-GWs**: Sum of gameweeks each transfer was actually held in the squad

### Example Calculation

Manager with 32 transfers held for varying durations:
- Transfer 1 (GW1): Held for 18 weeks
- Transfer 2 (GW3): Held for 16 weeks  
- Transfer 3 (GW5): Held for 14 weeks
- ... (remaining transfers)
- **Total Transfer-GWs**: 186 weeks

If they gained +266 net points:
- **Efficiency**: 266 ÷ 186 = **1.43 pts/transfer-GW**
- **Grade**: C (within 1.0-1.5 range)

## Grading Thresholds

| Grade | Threshold | Description | Performance Level |
|-------|-----------|-------------|-------------------|
| **A** | ≥2.0 pts/transfer-GW | Elite - Consistently excellent picks | Top tier |
| **B** | ≥1.5 pts/transfer-GW | Very good - Strong positive returns | Above average |
| **C** | ≥1.0 pts/transfer-GW | Decent - Solid edge over time | Average/Acceptable |
| **D** | ≥0.5 pts/transfer-GW | Below average - Marginal gains | Below average |
| **F** | <0.5 pts/transfer-GW | Poor - Losing value on transfers | Failing |

## Real-World Data Analysis

### Sample Dataset (18 Gameweeks, 2024/25 Season)

Analysis of 8 FPL managers to validate grading thresholds:

#### B Grade Performers (1.50-2.00 pts/transfer-GW)

| Manager ID | Transfers | Transfer-GWs | Efficiency | Pts/Transfer-GW | Grade |
|------------|-----------|--------------|------------|-----------------|-------|
| 7486369 | 32 | 193 | +318 pts | **1.65** | B |
| 1685942 | 31 | 175 | +281 pts | **1.61** | B |
| 205286 | 31 | 142 | +214 pts | **1.51** | B |

**Characteristics:**
- Strong transfer decisions with consistent positive returns
- Average 1.59 pts/transfer-GW
- Minimal hits (0-1)
- Early transfers held longer, maximizing scoring opportunities

#### C Grade Performers (1.00-1.50 pts/transfer-GW)

| Manager ID | Transfers | Transfer-GWs | Efficiency | Pts/Transfer-GW | Grade |
|------------|-----------|--------------|------------|-----------------|-------|
| 495371 | 32 | 186 | +266 pts | **1.43** | C |
| 2825258 | 33 | 162 | +225 pts | **1.39** | C |

**Characteristics:**
- Decent performance with solid net positive returns
- Average 1.41 pts/transfer-GW
- Acceptable level of success
- Some hits taken (0-2)

#### D Grade Performers (0.50-1.00 pts/transfer-GW)

| Manager ID | Transfers | Transfer-GWs | Efficiency | Pts/Transfer-GW | Grade |
|------------|-----------|--------------|------------|-----------------|-------|
| 7182632 | 32 | 151 | +142 pts | **0.94** | D |
| 2165087 | 31 | 164 | +150 pts | **0.91** | D |
| 9350232 | 29 | 161 | +129 pts | **0.80** | D |

**Characteristics:**
- Below-average transfer performance
- Average 0.88 pts/transfer-GW
- Marginal net gains, barely covering hit costs
- Mix of good and poor transfer decisions

### Key Findings

1. **Natural Grade Separation**: The 2.0/1.5/1.0/0.5 thresholds create clear performance tiers with minimal overlap

2. **No A Grades in Sample**: None of the 8 managers achieved 2.0+ pts/transfer-GW, confirming A grade is reserved for elite performance

3. **Transfer-GWs Range**: 142-193 across managers (avg ~168), showing transfer timing significantly impacts opportunities

4. **Validation**: Real-world data confirms thresholds are well-calibrated:
   - B range: 1.51-1.65 (excellent)
   - C range: 1.39-1.43 (solid)
   - D range: 0.80-0.94 (weak)

## Why Transfer-GWs Matter

Using actual Transfer-GWs instead of theoretical maximums is crucial:

### ❌ Old Approach (Incorrect)
```
Assumed 1 transfer per GW
Theoretical Transfer-GWs = GWs × (38 + (38 - GWs + 1)) / 2
At GW18: 531 Transfer-GWs expected
Required +531 pts just for D grade!
```

### ✅ New Approach (Correct)
```
Actual Transfer-GWs = Sum of weeks each transfer was held
Example: 32 transfers held avg 5.8 weeks = 186 Transfer-GWs
Required +93 pts for D grade (0.5 × 186)
```

## Implementation Notes

### Code Location
- **Calculation**: `lib/analysis/summary.ts` (lines ~181-195)
- **Display**: `components/cards/transfers/TransferStats.tsx`
- **Type Definition**: `lib/types.ts` (`actualTransferGWs` in `SeasonSummary`)

### Calculation Process
1. Analyze each transfer's ownership period (from `lib/analysis/transfers.ts`)
2. Sum `gameweeksHeld` for all non-Free Hit transfers
3. Calculate efficiency: `(netTransferPoints - totalTransfersCost) / actualTransferGWs`
4. Apply grade thresholds: A=2.0, B=1.5, C=1.0, D=0.5

### Edge Cases
- **Wildcard transfers**: Counted as net squad changes (before vs after)
- **Free Hit transfers**: Excluded entirely (temporary moves)
- **Zero transfers**: Use default multiplier of 10 GWs per transfer
- **Negative efficiency**: Always F grade regardless of ratio

## Future Considerations

### Potential Adjustments
- **End-of-season scaling**: Thresholds may need adjustment after full 38 GWs
- **A grade achievability**: Monitor if any managers reach 2.0+ benchmark
- **Hit penalty impact**: Consider separate grading for hit frequency vs efficiency

### Areas for Research
- Correlation between transfer timing patterns and efficiency
- Impact of chip usage on transfer-GW calculations
- Template overlap vs transfer efficiency relationship
- Optimal transfer frequency for maximizing pts/transfer-GW

## References

- Analysis script: `scripts/analyze-managers.ts`
- Transfer timing analysis: `docs/wrapped/research/transfer-timing-psychology.md`
- Behavioral signals: `docs/wrapped/engine/behavioral-signals.md`
