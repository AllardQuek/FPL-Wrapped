# Design Decisions & Technical Architecture

This document tracks the key architectural and design decisions made during the development of FPL Wrapped.

## 1. Caching Strategy: The Hybrid Approach

**Context**: The FPL API's `bootstrap-static` endpoint returns 2MB+ of data. Next.js has a 2MB limit on individual entries in its Data Cache. Additionally, frequent development restarts can lead to IP bans if the FPL API is hit too often.

**Decision**: Implemented a multi-tier caching strategy in `lib/fpl-api.ts`.
- **In-Memory Cache (Global Variable)**: The primary cache for both Development and Production (Vercel). Extremely fast (0ms) and scales horizontally on Vercel as long as Lambda instances are "warm".
- **File System Cache (Dev Only)**: Persists the 2MB bootstrap JSON in `.cache/fpl-bootstrap.json`. 
- **Environment Awareness**: 
    - In **Production**, we bypass the file system because Vercel lambdas are read-only. We rely on the speed of the FPL API and warm memory.
    - In **Development**, the file system cache ensures that saving code and restarting the dev server doesn't re-fetch data, preventing FPL API rate-limiting (429 errors).

## 2. Manager Persona & DNA Logic

**Context**: We wanted to evolve from abstract grades to a relatable narrative, similar to Spotify's "Listening Personality."

**Decision**: Mapped FPL behaviors to iconic real-world managers (Pep, Redknapp, Mourinho, etc.).
- **DNA Scoring**: Managers are assigned scores across 4 archetypes based on their season data:
    - **The Tinker (Pep)**: High transfer volume, high bench regrets.
    - **The Wheeler-Dealer (Redknapp)**: High volume of transfer "hits" (-4s).
    - **The Pragmatist (Moyes)**: Low transfer volume, template-heavy squad.
    - **The Motivator (Ferguson)**: High captaincy accuracy, elite decision grade.
- **Normalization**: These scores are converted into a percentage "DNA" breakdown, with the primary archetype determining the identity.

## 3. UI/UX: Minimalist "Manager ID" Aesthetic

**Context**: Initial designs were neon-heavy and "gamey." User feedback suggested a more premium, "high-end" vibe.

**Decision**: Adopted a clean, minimalist design language.
- **Color Palette**: `#0a0a0a` (Pure Black) background with subtle glassmorphism and monochrome cards.
- **The Manager ID**: The final summary is designed as a "Physical ID Card," using high-contrast typography and subtle branding.
- **Persona Insights**: Every analysis card includes a "speech bubble" from the manager persona (e.g., "Like Pep, you overthought this one"), bridging the gap between dry stats and personality.

## 4. Methodology: Squad-Level vs. XI Analysis

**Context**: How to judge a transfer? Is it a failure if the player scores 15 points but sits on the bench?

**Decision**:
- **Transfers (Squad Level)**: We evaluate transfers based on **Total Points Gained over Lifetime (PGLT)**. This judges the *talent identification*. If a player you bought hauls on your bench, the transfer was still "good business," but your selection was poor.
- **Bench (Selection Level)**: We use **Missed Points** (Best Bench Player - Worst Starter) to judge team selection.
- **Captaincy (Herd Factor)**: Added a comparison against the "Most popular captain" to identify if the manager follows the template or takes risks.

## 4.1 Captaincy Accuracy Definition

**Context**: Originally, accuracy was defined as whether your captain scored 6+ points (an arbitrary threshold). The ideal would have been comparing against the top 5 most popular captain choices each gameweek, but this data is not available through the FPL API.

**Problem**: The FPL API only provides:
- `most_captained`: The single most captained player globally per gameweek
- No data on the top 5 or top 10 most captained players
- No captain selection percentages per player

**Decision**: Define "Captaincy Accuracy" as: **Did you captain the highest-scoring player in your starting XI that gameweek?**

**Rationale**:
- **Objective & Data-Driven**: No arbitrary point thresholds (like "6+ points")
- **Measures Optimal Decision-Making**: Rewards perfect captain selection from your available options
- **Realistic Constraint**: You can only captain players you own, so comparing against your own squad is the most meaningful benchmark
- **Clear Win Condition**: Either you picked the best option or you didn't

**Implementation**: The `wasSuccessful` field in `CaptaincyAnalysis` is set to `true` only when `captainId === bestPickId` (i.e., your captain was your highest-scoring starting XI player).

### 4.2 "Points Left on Table" Terminology

**Naming Origin**: "Left on the table" is a poker/gambling term meaning money or value you could have won but didn't take. In FPL context, these are captain points you could have earned by selecting your best-performing player.

**Definition**: The cumulative points lost across the season by not captaining your highest-scoring starting XI player each gameweek. Calculated as: `(Best Player Points × Multiplier) - (Actual Captain Points)`.

**Transparency**: Both accuracy and points left on table metrics include detailed data views showing:
- **Accuracy Modal**: Lists all gameweeks with visual badges for optimal picks and side-by-side comparison cards for missed opportunities
- **Points Lost Modal**: Breaks down each gameweek where points were left behind, showing who you captained vs. who you should have captained and the point differential

This audit trail allows users to review specific decisions and learn from suboptimal choices.

### 4.3 Data Transparency UI Pattern: Modal Dialogs vs. Tooltips

**Context**: Initially implemented scrollable tooltips for showing detailed gameweek-by-gameweek breakdowns. However, tooltips competed with page scrolling, creating unpredictable UX where users would accidentally scroll the page instead of the tooltip content.

**Problem with Tooltips**:
- Scroll behavior conflict with page
- Limited space for dense data
- Difficult to interact with on mobile
- Easy to accidentally dismiss by moving mouse away
- Not ideal for data that requires careful review

**Decision**: Replaced tooltips with **click-to-open modal dialogs** for detailed data views.

**Implementation**:
- Created `Dialog.tsx` component using Radix UI (`@radix-ui/react-dialog`)
- Created `InfoDialog.tsx` wrapper combining info icon (ⓘ) with dialog trigger
- Modal specifications:
  - `max-w-lg` (512px) - compact but spacious
  - `w-[90vw]` on mobile - responsive with side padding
  - `max-h-[70vh]` - leaves breathing room, doesn't dominate screen
  - `bg-black/60` backdrop - lighter than typical modals, less oppressive
  - Scrollable content area with custom scrollbar styling
  - ESC key and backdrop click to close

**Visual Design in Modals**:
- **Accuracy Modal**: 
  - Summary stats card at top
  - Grid layout for successful picks (visual badges)
  - List layout for missed opportunities with side-by-side comparison
  - Color-coded: green for optimal, red for missed
- **Points Lost Modal**:
  - Summary card showing total points lost
  - Breakdown of each suboptimal decision
  - Side-by-side comparison: what you did vs. what you should have done
  - Celebration card if perfect season

**Interaction Pattern Choice: Click vs. Hover**

We chose **click-to-open** over hover because:
1. **Mobile-friendly**: Touch devices don't support hover
2. **Intentional**: Dense data requires focused attention, not accidental preview
3. **Stable**: Modal stays open until user dismisses - can scroll and read carefully
4. **No accidents**: Won't trigger while scrolling past the icon
5. **Better for audit trails**: Users are specifically choosing to review their decisions

**Rationale**: These are audit trails and detailed breakdowns, not quick reference info. Users need time to digest the data, scroll through gameweeks, and learn from decisions. A modal provides the focused, distraction-free environment needed for this type of content.

### 4.4 Color Coding System for Performance Metrics

**Context**: Metrics like accuracy and herd factor need visual feedback to convey performance at a glance.

**Challenge**: Different backgrounds (dark vs. light) require different color approaches for readability.

**Decision**: Implemented context-aware color coding with specific attention to contrast.

**Accuracy Colors** (dark background: `bg-white/5`):
- **80%+**: `#00ff87` (bright green) - Excellent
- **60-79%**: `#37ffef` (cyan) - Good  
- **40-59%**: `#fbbf24` (yellow/amber) - Average
- **<40%**: `#ff6b9d` (lighter pink-red) - Poor
  - Note: Used lighter red (`#ff6b9d` instead of `#e90052`) for better contrast on dark backgrounds

**Herd Factor Colors** (light background: `bg-black/5` on white card):
- **80%+**: `#dc2626` (Tailwind red-600) - Very template
- **60-79%**: `#d97706` (Tailwind amber-600) - Mostly template
- **40-59%**: `#0891b2` (Tailwind cyan-600) - Balanced
- **<40%**: `#059669` (Tailwind emerald-600) - Differential/independent
  - Note: All colors use Tailwind's 600 series for proper contrast on light backgrounds
  - Inverted logic: Lower is better (shows independent thinking)

**Design Principles**:
- Dark backgrounds need brighter, more saturated colors
- Light backgrounds need darker shades (Tailwind 600 series)
- Maintain semantic consistency across contexts (red = poor, green = excellent)
- Both systems use 4-tier hierarchy for nuanced feedback
- Icon variants: `InfoDialog` supports `variant="light"` for light backgrounds

### 4.5 Raw Scores for Transparency

**Context**: Percentages alone can be misleading without context (e.g., "75%" could be 3/4 or 30/40).

**Decision**: Always show raw scores alongside percentages for key metrics.

**Examples**:
- **Accuracy**: Shows "75%" with "15/20 Gameweeks" underneath
- **Herd Factor**: Shows "60%" with "12/20 GWs" underneath

**Rationale**:
- Provides immediate context for the percentage
- Allows users to judge sample size
- More transparent and trustworthy
- Helps users understand if metric is meaningful (3/4 GWs vs 30/40 GWs)

## 4.6 Bench Analysis: Selection Errors vs. Team Sheet Grade

**Context**: The bench card originally displayed three metrics:
1. **Regret Factor** (now "Selection Errors") - Gameweeks with selection mistakes
2. **Total Bench Points** - All points scored by bench players
3. **Team Sheet Grade** - A letter grade derived from average bench points per week

**Problems Identified**:
1. "Regret Factor" tooltip was misleading - said "bench outscored starters" when it actually meant "best bench player > worst starter"
2. "Team Sheet Grade" was redundant - just a derivative of Total Bench Points
3. The grade calculation (`100 - avgBenchPerWeek * 5`) wasn't intuitive

**Decisions**:

**Renamed "Regret Factor" to "Selection Errors"**:
- More accurate and clearer terminology
- Updated tooltip to explain the actual logic: *"Gameweeks where your best bench player scored more points than your worst starter - a clear selection mistake"*
- This is a specific, actionable metric showing when you definitively benched the wrong player

**Added 3-Point Threshold (V2 Update)**:
- **Problem**: The original logic (`missedPoints > 0`) was too harsh - it flagged every gameweek where a bench player outscored any starter, even by 1 point
- **Reality Check**: In a 38-gameweek season, users would typically have 15-25 "errors" using the strict criteria, making it seem like they were terrible at selection when it was just variance
- **Solution**: Changed logic to `missedPoints > 3` - only counts as an error if the difference is significant
- **Rationale**: This filters out marginal calls (6 pts vs 5 pts) and focuses on **genuine mistakes** (12 pts vs 2 pts) where the user clearly benched the wrong player

**Added Position Breakdown**:
- Track which position each error occurred in: GKP, DEF, MID, FWD
- Provides granular insights into selection patterns
- Helps users identify specific weaknesses (e.g., "Most errors in defense - need a clearer rotation strategy")
- Displayed in a detailed modal dialog showing:
  - Error count by position
  - Complete list of all selection errors with gameweek details
  - The benched player, their points, and who they should have replaced

**Removed "Team Sheet Grade"**:
- Redundant with existing metrics (users already see total bench points and number of errors)
- The letter grade didn't add meaningful insight
- Simplified the card to focus on what matters:
  - How many selection mistakes you made (Selection Errors)
  - How many points sat on your bench (Total Bench Points)
  - Your single worst miss (Biggest Bench Miss card)

**Rationale**: The 3-point threshold makes the metric fairer and more actionable. Position breakdown adds valuable context without cluttering the main card (hidden in a dialog). Focus on clear, specific metrics rather than derivative scores. "Selection Errors" with the threshold is meaningful enough to learn from while not being punishingly harsh for normal variance in FPL.

## 5. Next.js 16 & Serverless Considerations

**Decision**: Optimized for Vercel deployment.
- **Async Data Fetching**: Parallelized FPL API calls (`Promise.all`) to reduce cold-start latency.
- **Static vs Dynamic**: The Wrapped pages are dynamic based on the `teamId`, using `cache: 'no-store'` for user-specific data to ensure the analysis is always up to date with the latest FPL Gameweek.
