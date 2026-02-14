# Elasticsearch Setup Guide

This guide walks you through setting up Elasticsearch for FPL Wrapped's experimental features.

## Prerequisites

- Elasticsearch Cloud account (free trial available)
- Node.js 20+ installed
- FPL Wrapped repository cloned

## Step 1: Create Elasticsearch Cloud Deployment

1. Go to [Elastic Cloud](https://cloud.elastic.co/registration)
2. Sign up for a free 14-day trial (no credit card required)
3. Create a new deployment:
   - Choose **Serverless** for auto-scaling (recommended)
   - Or **Standard** for fixed resources
   - Select your preferred region
   - Name it `fpl-wrapped-trial`

4. **Important**: Save your credentials immediately:
   - Elasticsearch endpoint URL
   - API key (or username/password)

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and set:
   ```env
   # Enable Elasticsearch
   ENABLE_ELASTICSEARCH=true
   
   # Your Elastic Cloud endpoint (from Step 1)
   ELASTICSEARCH_URL=https://your-deployment-id.es.us-east-1.aws.elastic.cloud:443
   
   # Your API key (from Step 1)
   ELASTICSEARCH_API_KEY=your-api-key-here
   
   # Index name (can leave as default)
   ELASTICSEARCH_INDEX_NAME=fpl-gameweek-decisions
   ```

3. Keep features disabled for now:
   ```env
   ENABLE_MINI_LEAGUE_REPORTS=false
   ENABLE_CONVERSATIONAL_QUERIES=false
   ```

## Step 3: Initialize Elasticsearch

Run the initialization script to create the index:

```bash
pnpm es:init
```

You should see:
```
✅ Connected to Elasticsearch 8.x.x
✅ Created index "fpl-gameweek-decisions" with mapping
✨ Elasticsearch initialization complete!
```

## Step 4: Test with Your Data

Index your own manager data for a completed gameweek:

```bash
# Replace 123456 with your FPL team ID
# Replace 10 with a completed gameweek number
pnpm es:index -- --manager 123456 --gameweek 10
```

Expected output:
```
✅ Indexed Your Name (Your Team) - GW10
   Points: 65, Rank: 1,234,567
   Captain: Haaland (14pts)
   Transfers: 1, Bench points: 8
```

## Step 5: Verify the Data

Check that data was indexed correctly:

```bash
pnpm es:health
```

You should see:
```
✅ Connected to Elasticsearch 8.x.x
✅ Healthy
📊 Index: fpl-gameweek-decisions
   Documents: 1
   Size: 0.01 MB
```

Query your specific document:

```bash
pnpm es:query -- --manager 123456 --gameweek 10
```

## Step 6: Index a Mini-League (Optional)

To test mini-league features, index all managers in a league:

```bash
# Replace 456789 with your mini-league ID
pnpm es:index -- --league 456789 --gameweek 10
```

This will:
- Fetch all managers in the league
- Index each manager's GW10 decisions
- Process in batches to respect FPL API rate limits

## Step 7: Enable Features

Once data is indexed, enable experimental features in `.env.local`:

```env
# Enable mini-league reports
ENABLE_MINI_LEAGUE_REPORTS=true

# Enable conversational queries (requires ELSER model - advanced)
ENABLE_CONVERSATIONAL_QUERIES=false
```

Restart your dev server:
```bash
pnpm dev
```

## Troubleshooting

### "Elasticsearch client not available"
- Check `ENABLE_ELASTICSEARCH=true` in `.env.local`
- Verify `ELASTICSEARCH_URL` and `ELASTICSEARCH_API_KEY` are correct
- Run `pnpm es:health` to diagnose connection issues

### "Failed to create index"
- Ensure your API key has write permissions
- Check Elasticsearch cluster is running in Cloud console
- Look for detailed error messages in console output

### "Rate limited on /api/..."
- FPL API has rate limits
- Script includes automatic delays between batches
- If indexing large leagues, consider smaller batches

### "Document not found"
- Ensure gameweek is finished (live GWs may have incomplete data)
- Check manager ID is correct
- Verify index exists: `pnpm es:health`

## Useful Commands

```bash
# Check health and status
pnpm es:health

# Initialize/recreate index
pnpm es:init

# Index single manager
pnpm es:index -- --manager 123456 --gameweek 10

# Index entire league
pnpm es:index -- --league 456789 --gameweek 10

# Query indexed document
pnpm es:query -- --manager 123456 --gameweek 10
```

## What's Indexed?

Each document represents one manager's decisions for one gameweek:

- **Manager info**: ID, name, team name
- **Transfers**: Players bought/sold, hit points taken
- **Captain**: Selected captain and points scored
- **Team selection**: Starting XI and bench with points
- **Chips**: Active chip used (wildcard, bench boost, etc.)
- **Results**: GW points, rank, bench points

## Next Steps

- **Phase 2**: Build mini-league report API (coming next)
- **Phase 3**: Add conversational queries with ELSER
- **Phase 4**: Set up automatic indexing after gameweeks

## Cost & Trial Info

- **Free trial**: 14 days, full features
- **After trial**: ~$95/month minimum for Standard tier
- **Data egress**: May incur charges for large data transfers
- **Tip**: Monitor usage in Cloud console to avoid surprises

## Rollback

To disable Elasticsearch and return to normal:

1. Set `ENABLE_ELASTICSEARCH=false` in `.env.local`
2. Restart dev server
3. All existing features work as before

To completely remove Elasticsearch:
- Delete `.env.local` ES variables
- Delete `lib/elasticsearch/` directory
- Delete ES scripts from `scripts/` directory
- Remove ES scripts from `package.json`

## Support

- [Elastic Cloud Documentation](https://www.elastic.co/guide/en/cloud/current/index.html)
- [Elasticsearch Node.js Client](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html)
- [FPL Wrapped Issues](https://github.com/yourrepo/fpl-wrapped/issues)
