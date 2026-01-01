import { fetchAllManagerData, getLeagueStandings } from '../lib/fpl-api';
import { generateSeasonSummary } from '../lib/analysis/summary';

async function main() {
  const leagueId = parseInt(process.argv[2]) || 213;
  const numTeams = parseInt(process.argv[3]) || 10;

  console.log(`\n🚀 Starting bulk analysis for League ID: ${leagueId}`);
  console.log(`📊 Sampling ${numTeams} teams across the standings...\n`);

  // Pages to sample from (logarithmic-ish distribution for diversity)
  // We'll use a mix of top, middle, and lower pages
  const targetPages = [1, 5, 20, 100, 500, 1000, 2000, 3000, 4000, 5000];
  const pages = targetPages.slice(0, numTeams);
  
  const results = [];

  for (const page of pages) {
    try {
      process.stdout.write(`Fetching page ${page}... `);
      const standings = await getLeagueStandings(leagueId, page);
      
      if (!standings.standings || !standings.standings.results || !standings.standings.results.length) {
        console.log('⚠️ No results found.');
        continue;
      }

      // Pick the first manager on the page
      const entry = standings.standings.results[0];
      const managerId = entry.entry;

      console.log(`Analyzing: ${entry.player_name} (Rank: ${entry.rank})`);
      
      const data = await fetchAllManagerData(managerId);
      const summary = generateSeasonSummary(data);

      results.push({
        rank: entry.rank,
        managerName: entry.player_name,
        teamName: entry.entry_name,
        persona: summary.persona.name,
        code: summary.persona.personalityCode,
        grade: summary.overallDecisionGrade,
        transfers: summary.totalTransfers,
        url: `https://fpl-wrapped-season.vercel.app/wrapped/${managerId}`
      });

      // Small delay to be kind to the API
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  if (results.length === 0) {
    console.log('\n❌ No managers were successfully analyzed.');
    return;
  }

  console.log('\n' + '='.repeat(110));
  console.log('COMPARATIVE LEAGUE ANALYSIS');
  console.log('='.repeat(110));
  console.log(
    'Rank'.padEnd(10), 
    'Manager'.padEnd(25), 
    'Persona'.padEnd(25), 
    'Grade'.padEnd(8), 
    'Transfers'.padEnd(10),
    'Wrapped URL'
  );
  console.log('-'.repeat(110));

  results.sort((a, b) => a.rank - b.rank).forEach(r => {
    console.log(
      r.rank.toString().padEnd(10),
      r.managerName.substring(0, 24).padEnd(25),
      `${r.persona} [${r.code}]`.padEnd(25),
      r.grade.padEnd(8),
      r.transfers.toString().padEnd(10),
      r.url
    );
  });

  console.log('='.repeat(110));

  // Aggregate results
  console.log('\n📊 PERSONA DISTRIBUTION:');
  const distribution = new Map<string, number>();
  results.forEach(r => {
    const key = `${r.persona} [${r.code}]`;
    distribution.set(key, (distribution.get(key) || 0) + 1);
  });

  Array.from(distribution.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([persona, count]) => {
      const percentage = ((count / results.length) * 100).toFixed(1);
      console.log(`   ${persona.padEnd(30)} ${count} (${percentage}%)`);
    });

  console.log(`\n✅ Analysis complete. Processed ${results.length} managers.`);
}

main().catch(console.error);
