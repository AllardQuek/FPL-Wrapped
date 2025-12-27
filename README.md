# FPL Wrapped 🏆

Your Fantasy Premier League Season in Review - A "Spotify Wrapped" style experience for FPL managers.

![FPL Wrapped](https://img.shields.io/badge/FPL-Wrapped-37003c?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge)

## Features

FPL Wrapped analyzes your season and grades your decision-making across three key areas:

### 🔄 Transfer Analysis
- Net points gained/lost from all transfers
- Best and worst transfer of the season
- Hit points taken vs value generated
- Overall transfer grade (A-F)

### ©️ Captaincy Analysis
- Captain success rate (6+ points)
- Points left on the table vs optimal captain
- Best and worst captain picks
- Captaincy efficiency grade (A-F)

### 🪑 Bench/Team Selection Analysis
- Total bench points across the season
- "Bench regret" moments (when bench outscored starters)
- Biggest bench misses
- Team selection grade (A-F)

### 📊 Overall Summary
- Combined decision quality grade
- Season stats at a glance
- MVP (your highest-scoring player)
- Rank progression throughout the season

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
│   │   ├── MVPCard.tsx
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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/fpl-wrapped)

## Disclaimer

This project is not affiliated with, endorsed by, or connected to the Premier League or Fantasy Premier League. All data is sourced from the publicly available FPL API.

## License

MIT License - feel free to use this project however you'd like!

---

Made with ⚽ for FPL managers everywhere
