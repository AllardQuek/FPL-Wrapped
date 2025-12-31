/**
 * Manager Persona Analysis Script
 * 
 * Fetches FPL manager data and analyzes persona assignments to validate 
 * the classification algorithm and identify areas for improvement.
 */

const managers = [205286, 1685942, 7486369, 495371];

console.log('='.repeat(80));
console.log('MANAGER PERSONA ANALYSIS');
console.log('='.repeat(80));
console.log('\nFetching data from FPL API and analyzing...\n');

async function analyzeManager(managerId: number) {
  try {
    const response = await fetch(`http://localhost:3000/api/manager/${managerId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch manager ${managerId}: ${response.statusText}`);
    }

    const summary = await response.json();

    console.log(`\n${'='.repeat(80)}`);
    console.log(`MANAGER ID: ${managerId} - ${summary.managerName}`);
    console.log(`${'='.repeat(80)}`);

    console.log(`\n🎯 ASSIGNED PERSONA: ${summary.persona.name}`);
    console.log(`   Full Title: ${summary.persona.fullName}`);
    console.log(`   Archetype: ${summary.persona.archetype}`);
    console.log();

    console.log('📊 OVERALL PERFORMANCE:');
    console.log(`   Total Points: ${summary.totalPoints}`);
    console.log(`   Overall Rank: ${summary.overallRank?.toLocaleString() || 'N/A'}`);
    console.log(`   Season Grade: ${summary.seasonGrade}`);
    console.log();

    console.log('� TRANSFER ANALYSIS:');
    console.log(`   Total Transfers: ${summary.totalTransfers}`);
    console.log(`   Hits Taken: ${summary.hitsTaken}`);
    console.log(`   Total Hit Cost: -${summary.hitsTaken * 4} pts`);
    console.log(`   Transfer Efficiency: ${summary.transferEfficiency.toFixed(1)}%`);
    console.log(`   Transfer Grade: ${summary.transferGrade}`);
    if (summary.bestTransfer) {
      console.log(`   Best Transfer: ${summary.bestTransfer.playerIn.web_name} (GW${summary.bestTransfer.gameweek})`);
    }
    console.log();

    console.log('👑 CAPTAINCY ANALYSIS:');
    console.log(`   Captaincy Efficiency: ${summary.captaincyEfficiency.toFixed(1)}%`);
    console.log(`   Captaincy Grade: ${summary.captaincyGrade}`);
    if (summary.bestCaptain) {
      console.log(`   Best Captain: ${summary.bestCaptain.player.web_name} (GW${summary.bestCaptain.gameweek}, ${summary.bestCaptain.points} pts)`);
    }
    console.log();

    console.log('� BENCH ANALYSIS:');
    console.log(`   Avg Bench Points/GW: ${summary.avgPointsOnBench.toFixed(1)}`);
    console.log(`   Bench Regrets: ${summary.benchRegrets} times`);
    console.log(`   Bench Grade: ${summary.benchGrade}`);
    console.log();

    console.log('💎 CHIPS USED:');
    const chipsUsed = summary.chips.filter((c: { used: boolean }) => c.used);
    if (chipsUsed.length > 0) {
      chipsUsed.forEach((chip: { name: string; gameweek: number; pointsGained: number }) => {
        console.log(`   GW${chip.gameweek}: ${chip.name} (+${chip.pointsGained} pts)`);
      });
    } else {
      console.log('   No chips used yet');
    }
    console.log();

    console.log('📈 SQUAD ANALYSIS:');
    console.log(`   Template Overlap: ${summary.templateOverlap.toFixed(1)}%`);
    console.log(`   Squad Value: £${(summary.squadValue / 10).toFixed(1)}m`);
    if (summary.mostValuablePlayer) {
      console.log(`   MVP: ${summary.mostValuablePlayer.player.web_name} (${summary.mostValuablePlayer.points} pts)`);
    }
    console.log();

    // Save detailed data to file for deeper analysis
    return {
      managerId,
      name: summary.managerName,
      persona: summary.persona.name,
      personaArchetype: summary.persona.archetype,
      totalPoints: summary.totalPoints,
      overallRank: summary.overallRank,
      totalTransfers: summary.totalTransfers,
      hitsTaken: summary.hitsTaken,
      transferEfficiency: summary.transferEfficiency,
      captaincyEfficiency: summary.captaincyEfficiency,
      avgBenchPoints: summary.avgPointsOnBench,
      templateOverlap: summary.templateOverlap,
      squadValue: summary.squadValue,
      seasonGrade: summary.seasonGrade,
    };

  } catch (error) {
    console.error(`\n❌ Error analyzing manager ${managerId}:`, error);
    return null;
  }
}

async function main() {
  const results = [];
  
  for (const managerId of managers) {
    const result = await analyzeManager(managerId);
    if (result) {
      results.push(result);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('COMPARATIVE SUMMARY');
  console.log('='.repeat(80));
  console.log();

  // Group by persona
  const personaGroups = new Map<string, typeof results>();
  results.forEach(r => {
    const group = personaGroups.get(r.persona) || [];
    group.push(r);
    personaGroups.set(r.persona, group);
  });

  console.log('� PERSONA DISTRIBUTION:');
  personaGroups.forEach((group, persona) => {
    console.log(`   ${persona}: ${group.length} manager(s)`);
    group.forEach(m => {
      console.log(`      - ${m.name} (ID: ${m.managerId})`);
    });
  });
  console.log();

  if (personaGroups.size === 1) {
    console.log('⚠️  WARNING: All managers assigned to same persona!');
    console.log('    This indicates the algorithm needs more differentiation.\n');
  }

  console.log('🔍 KEY DIFFERENTIATORS:');
  console.log('   Transfer Activity:');
  results.forEach(r => {
    console.log(`      ${r.name.padEnd(30)} ${r.totalTransfers} transfers, ${r.hitsTaken} hits`);
  });
  console.log();
  
  console.log('   Efficiency Metrics:');
  results.forEach(r => {
    console.log(`      ${r.name.padEnd(30)} Transfer: ${r.transferEfficiency.toFixed(0)}%, Captaincy: ${r.captaincyEfficiency.toFixed(0)}%`);
  });
  console.log();
  
  console.log('   Style Indicators:');
  results.forEach(r => {
    console.log(`      ${r.name.padEnd(30)} Template: ${r.templateOverlap.toFixed(0)}%, Bench: ${r.avgBenchPoints.toFixed(1)} pts/GW`);
  });
  console.log();

  console.log('='.repeat(80));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

main();
