# Transfer Timing Psychology

## The Gameweek Cycle

A typical gameweek runs from **Friday deadline** to **Monday night**:
- Friday 11am: Deadline & first matches kick off
- Friday-Sunday: Main fixtures
- Monday night: Final match(es)

Next GW deadline is typically **Friday 11am** (6-7 days later)

## Transfer Timing Categories

### 1. **Early Strategic Planner** (Sunday-Tuesday after GW ends)
- **When**: 96-144+ hours before next deadline
- **Context**: Made right after previous GW finishes, with full data
- **Psychology**: Methodical, data-driven, patient
- **Personas**: Unai Emery, Mikel Arteta, Arne Slot

### 2. **Mid-Week Adjuster** (Wednesday-Thursday)
- **When**: 24-96 hours before deadline
- **Context**: Made after midweek fixtures or team news
- **Psychology**: Flexible but measured, reacting to new info
- **Personas**: Carlo Ancelotti, Pep Guardiola

### 3. **Deadline Day Scrambler** (Thursday evening - Friday morning)
- **When**: 3-24 hours before deadline
- **Context**: Last-minute team news, captaincy switches
- **Psychology**: Reactive, influenced by social media/community
- **Personas**: David Moyes, Erik ten Hag

### 4. **Panic Buyer** (< 3 hours before deadline)
- **When**: Minutes/hours before lockout
- **Context**: FOMO, desperate last-minute changes
- **Psychology**: Emotional, impulsive, fear-driven
- **Personas**: Harry Redknapp, José Mourinho

### 5. **Knee-Jerk Reactor** (Transfers made within 48h of PREVIOUS GW starting)
- **When**: Friday-Sunday (during ongoing GW)
- **Context**: Reacting to live matches, early results, injuries
- **Psychology**: Impatient, can't wait for full data, chases points
- **Personas**: Ange Postecoglou, Jürgen Klopp (aggressive reactive play)

## Implementation Strategy

We should calculate TWO timing metrics:

1. **Hours before deadline** (existing)
   - < 3h: Panic
   - 3-24h: Deadline scramble
   - 24-96h: Mid-week adjustment
   - 96-144h: Early strategic
   - 144h+: Very early (possibly knee-jerk from previous GW)

2. **Hours after previous GW deadline** (NEW)
   - < 48h: Knee-jerk to previous GW results (BAD)
   - 48-96h: Quick adjustment to full data (GOOD)
   - 96h+: Patient strategic planning (BEST)

## Persona Mapping

| Persona | Early Strategic | Mid-Week | Deadline Day | Panic | Knee-Jerk |
|---------|----------------|----------|--------------|-------|-----------|
| Emery | ✅✅ | ✅ | ❌ | ❌ | ❌ |
| Arteta | ✅✅ | ✅ | ❌ | ❌ | ❌ |
| Slot | ✅✅ | ✅ | ❌ | ❌ | ❌ |
| Ancelotti | ✅ | ✅✅ | ✅ | ❌ | ❌ |
| Pep | ✅ | ✅✅ | ✅ | ❌ | ❌ |
| Moyes | ❌ | ✅ | ✅✅ | ❌ | ❌ |
| Ten Hag | ❌ | ✅ | ✅✅ | ✅ | ❌ |
| Redknapp | ❌ | ❌ | ✅ | ✅✅ | ✅ |
| Mourinho | ❌ | ❌ | ✅ | ✅✅ | ✅ |
| Klopp | ❌ | ✅ | ✅ | ✅ | ✅✅ |
| Postecoglou | ❌ | ❌ | ✅ | ✅ | ✅✅ |
