# FPL Wrapped 🏆

Your Fantasy Premier League Season in Review - A "Spotify Wrapped" style experience for FPL managers.

![FPL Wrapped](https://img.shields.io/badge/FPL-Wrapped-37003c?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge)

## Features

FPL Wrapped analyzes your season and grades your decision-making across three key areas:

### 🔄 Transfer Analysis
1. Ranks best/worst transfers of the season 
    - Evaluates every FPL transfer's hindsight success using [PGLT](https://www.fantasyfootballscout.co.uk/2021/10/08/points-gained-over-the-lifetime-of-a-transfer) (Points Gained over Lifetime of Transfer), Net points gained/lost from all transfers?
    - total points from incoming player minus outgoing player from transfer GW until sale/season end, adjusted for hit points taken
2. Hit points taken vs value generated
3. Overall transfer grade (A-F)

### ©️ Captaincy Analysis
1. Captain "success" rate
    - Should compare selected captain's points to top 5 most popular captains
2. Points left on the table vs optimal captain
3. Best and worst captain picks
4. Captaincy efficiency grade (A-F)

### 🪑 Bench/Team Selection Analysis
1. "Bench regret" moments (when bench outscored starters)
    - Compare each bench player points to average points per position?
    - Compare points for each player when selected for gameweek v.s. not selected (only for gameweeks owned by manager)
    - Biggest bench misses (e.g. you benched mateta during GW8 when he scored 17 points)
2. Team selection grade (A-F)

## 🍪 Chip Analysis
1. Bench Boost
- **Bench Boost score vs season average**  
  - Points gained from Bench Boost vs your **average bench points** in other weeks, plus how it compares to typical BB scores (e.g. “You got 18 points, higher than your usual bench of 7”)
- **“Was it worth it?” verdict**  
  - Show how many of the 15 players actually started and how many blanked.  
  - Simple tag like: “You converted 80% of available minutes into BB points – strong execution.”

2. Triple Captain
- **Chip gain vs normal captaincy**  
  - Compare TC week score to what you would have got with a regular captain: `TC_gain = (3×cap_pts) − (2×cap_pts) = cap_pts` and optionally against your best non-captain that week.
  - Present: “Your Triple Captain added +18 net points and was your 2nd‑best captain score of the season.”  
- **Timing grade**  
  - Compare that GW’s TC score to your **median captain score** across the season and label: “early / on point / late”.

3. Free Hit
- **Free Hit vs “normal team”**  
  - Reconstruct what your team would have scored without Free Hit (use previous GW squad, rolling autosubs, etc.), then show: `FH_gain = FH_points − no_chip_points`.
  - Insight: “Free Hit gained you +12 points compared to just rolling your squad.”  
- **Blank / Double exploitation**  
  - Count how many players you fielded vs how many you would have had without FH in blank/double GWs, and translate into an “fixture coverage” percentage. (optional, not sure of value)

4. Wildcard
- **Pre vs post Wildcard swing**  
  - Compare average GW points in the 4 GWs before vs 4 GWs after Wildcard; show net gain and rank trend (e.g. +8 pts/GW, 300k rank climb).
- **Squad refresh impact**  
  - Number of players kept vs changed, plus cumulative points from “new” players vs “old” squad over the next few weeks.

5. Overall Chip Report
- **Total chip points gained**  
  - Sum BB_gain + TC_gain + FH_gain + WC_post_gain and show as “Total points gained from chip play this season”.
- **Chip success badges**  
  - Simple icons like “🔥 Elite Triple Captain”, “🧱 Solid Bench Boost”, “🧠 Clutch Free Hit” based on being above/below global or mini-league medians for that chip week.

### 👔 Manager Persona (The Reveal)
The climax of your FPL Wrapped. We analyze your season DNA and map it to a legendary real-world manager.
- **DNA Breakdown**: Are you 70% Pep Guardiola (the overthinker) or 30% Harry Redknapp (the wheeler-dealer)?
- **Trigger Logic**: Hits taken, bench regret, captaincy variance, and template overlap.
- **Custom Badge**: A shareable minimalist ID card with your manager persona.

### 📊 Overall Summary
- **Combined Decision Quality Grade**: A weighted score of your season.
- **Season Stats at a Glance**: Total points, rank progression, and biggest haul.
- **MVP**: Your highest-scoring player throughout the season.
- **The Manager ID**: Your final real-world manager mapping.

## Getting Started

### Prerequisites

- Node.js 20+ (required for Next.js 16)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/fpl-wrapped.git
cd fpl-wrapped

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Finding Your FPL Team ID

1. Go to [fantasy.premierleague.com](https://fantasy.premierleague.com)
2. Log in and click on "Points" to view your team
3. Your Team ID is in the URL: `fantasy.premierleague.com/entry/XXXXXX/event/1`
4. Enter this number (XXXXXX) in FPL Wrapped

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Data:** FPL Public API (no authentication required)
- **Deployment:** Vercel-ready

## Project Structure

```
fpl-wrapped/
├── app/
│   ├── api/manager/[id]/    # API route for fetching manager data
│   ├── wrapped/[teamId]/    # Main wrapped experience page
│   ├── page.tsx             # Landing page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles & animations
├── components/
│   ├── cards/               # Wrapped card components
│   │   ├── WelcomeCard.tsx
│   │   ├── OverviewCard.tsx
│   │   ├── TransferCard.tsx
│   │   ├── CaptaincyCard.tsx
│   │   ├── BenchCard.tsx
│   │   ├── ChipsCard.tsx
│   │   ├── SquadAnalysisCard.tsx
│   │   ├── PersonaCard.tsx
│   │   └── SummaryCard.tsx
│   └── ui/                  # Reusable UI components
│       ├── GradeDisplay.tsx
│       ├── ProgressBar.tsx
│       └── StatNumber.tsx
└── lib/
    ├── types.ts             # TypeScript types for FPL API
    ├── fpl-api.ts           # FPL API client
    └── analysis.ts          # Decision analysis logic
```

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/bootstrap-static/` | All players, teams, gameweek data |
| `/entry/{id}/` | Manager basic info |
| `/entry/{id}/history/` | Gameweek-by-gameweek performance |
| `/entry/{id}/transfers/` | All transfers made |
| `/entry/{id}/event/{gw}/picks/` | Team selection per gameweek |
| `/event/{gw}/live/` | Live points for all players |

## Grading System

Grades are calculated based on:

- **Transfers:** Net points impact minus hit cost
- **Captaincy:** Percentage of optimal captain points captured
- **Bench:** Average bench points per week (lower is better)
- **Overall:** Weighted average (35% transfers, 40% captaincy, 25% bench)

| Grade | Meaning |
|-------|---------|
| A | Excellent decisions |
| B | Good decisions |
| C | Average |
| D | Below average |
| F | Needs improvement |

## Deployment

Deploy to Vercel with one click:

## Documentation

- **[Documentation Index](docs/DOCUMENTATION_INDEX.md)** - Central hub for all project documentation
- **[Manager Personas Reference](docs/engine/manager-personas.md)** - Complete guide to all 16 manager personas with quick reference table, scoring weights, and UX integration
- **[Design Decisions & Technical Architecture](docs/architecture/design-decisions.md)** - Deep dive into caching, persona logic, and methodology
- **[Next.js vs Vite Discussion](docs/architecture/nextjs-vite.md)** - Architectural reasoning for choosing Next.js

## Disclaimer

This project is not affiliated with, endorsed by, or connected to the Premier League or Fantasy Premier League. All data is sourced from the publicly available FPL API.

## License

MIT License - feel free to use this project however you'd like!

---

Made with ⚽ for FPL managers
