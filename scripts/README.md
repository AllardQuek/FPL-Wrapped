# FPL Wrapped Scripts

This directory contains various utility scripts for the FPL Wrapped project.

## 📊 Elasticsearch Indexing

### Quick Start

```bash
# Index all gameweeks for a single manager
pnpm es:index -- --manager 495371 --all

# Index all gameweeks for all managers in a league
pnpm es:index -- --league 213 --all

# Index a specific gameweek for a manager
pnpm es:index -- --manager 495371 --gameweek 10

# Index a specific gameweek for all managers in a league
pnpm es:index -- --league 213 --gameweek 10

# Index a range of gameweeks
pnpm es:index -- --manager 495371 --from 1 --to 25
pnpm es:index -- --league 213 --from 10 --to 20
```

### Use Cases

- **Single Manager Analysis**: Index all gameweeks for detailed performance tracking
- **League Comparison**: Index entire leagues to compare manager performances over the season
- **Historical Data**: Build up a dataset for analysis and insights
- **Mini-League Rankings**: Track how managers in your league perform week-by-week

### Performance Notes

- The script respects FPL API rate limits with built-in delays
- League-wide indexing processes managers sequentially to avoid overwhelming the API
- Progress is shown for each manager and gameweek
- Failed operations are logged but don't stop the overall process

---

## 🖼️ Profile Images Testing

## 🚀 Run This Now

```bash
# Test with your FPL team ID
npx tsx scripts/check-profile-images.ts YOUR_TEAM_ID

# Example with team ID 123456
npx tsx scripts/check-profile-images.ts 123456
```

## 📋 What You'll See

The script will output:
1. ✅ Which image endpoints work
2. ❌ Which endpoints don't exist
3. 💡 Recommendations based on findings

## 🔍 Example Output

```
🔍 Checking profile image availability for Team ID: 123456

📋 Manager Info:
   Name: John Doe
   Team Name: Dream Team FC
   Kit: None
   Favourite Team: 3

🖼️  Testing Image Endpoints:

✅ FOUND (Available):
   https://fantasy.premierleague.com/dist/img/badges/badge_3_80.png

❌ NOT FOUND:
   https://fantasy.premierleague.com/img/avatar/123456.jpg
   https://fantasy.premierleague.com/img/profile/123456.png
   ...

💡 Recommendations:
   ✅ Found 1 potential image source(s)
   Use these URLs with proper fallback handling
```

## 📤 Share Results

After running the script:
1. Copy the output
2. Share it with me
3. I'll implement the best solution based on what's available

## 🎯 What Happens Next

Based on the results:
- **If FPL avatars exist**: We'll use them first
- **If team badges exist**: Great fallback option
- **Always**: Generated avatars as final fallback

The `UserAvatar` component I created handles all of this automatically! 🎨
