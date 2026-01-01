/**
 * Manager Persona Analysis Script
 * 
 * Fetches FPL manager data and analyzes persona assignments to validate 
 * the classification algorithm and identify areas for improvement.
 */

export {};

const managers = [
  205286,    // Original test manager
  1685942,   // Original test manager
  7486369,   // Original test manager
  495371,    // Original test manager
  2825258,   // Suspected "Most Template" - new test case
  7182632,   // Additional test case
  2165087,   // Additional test case
  9350232,   // Additional test case
];

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
    console.log(`   Full Title: ${summary.persona.fullName || 'N/A'}`);
    console.log(`   Archetype: ${summary.persona.archetype || 'N/A'}`);
    console.log();

    console.log('📊 OVERALL PERFORMANCE:');
    console.log(`   Total Points: ${summary.totalPoints}`);
    console.log(`   Overall Rank: ${summary.overallRank?.toLocaleString() || 'N/A'}`);
    console.log(`   Season Grade: ${summary.seasonGrade || 'N/A'}`);
    console.log();

    console.log('🔄 TRANSFER ANALYSIS:');
    console.log(`   Total Transfers: ${summary.totalTransfers}`);
    console.log(`   Hits Taken: ${summary.hitsTaken ?? 'N/A'}`);
    console.log(`   Total Hit Cost: ${summary.hitsTaken ? `-${summary.hitsTaken * 4} pts` : 'N/A'}`);
    console.log(`   Transfer Efficiency: ${summary.transferEfficiency?.toFixed(1) ?? 'N/A'}%`);
    console.log(`   Transfer Grade: ${summary.transferGrade || 'N/A'}`);
    if (summary.bestTransfer) {
      console.log(`   Best Transfer: ${summary.bestTransfer.playerIn.web_name} (GW${summary.bestTransfer.gameweek})`);
    }
    console.log();

    console.log('👑 CAPTAINCY ANALYSIS:');
    console.log(`   Captaincy Efficiency: ${summary.captaincyEfficiency?.toFixed(1) ?? 'N/A'}%`);
    console.log(`   Captaincy Grade: ${summary.captaincyGrade || 'N/A'}`);
    if (summary.bestCaptain) {
      console.log(`   Best Captain: ${summary.bestCaptain.player.web_name} (GW${summary.bestCaptain.gameweek}, ${summary.bestCaptain.points} pts)`);
    }
    console.log();

    console.log('🪑 BENCH ANALYSIS:');
    console.log(`   Avg Bench Points/GW: ${summary.avgPointsOnBench?.toFixed(1) ?? 'N/A'}`);
    console.log(`   Bench Regrets: ${summary.benchRegrets ?? 'N/A'} times`);
    console.log(`   Bench Grade: ${summary.benchGrade || 'N/A'}`);
    console.log();

    if (summary.chips && Array.isArray(summary.chips)) {
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
    }

    console.log('📈 SQUAD ANALYSIS:');
    console.log(`   Template Overlap: ${summary.templateOverlap?.toFixed(1) ?? 'N/A'}%`);
    console.log(`   Overall Decision Grade: ${summary.overallDecisionGrade || 'N/A'}`);
    console.log();

    console.log('✨ MEMORABLE MOMENTS:');
    if (summary.persona?.memorableMoments && summary.persona.memorableMoments.length > 0) {
      summary.persona.memorableMoments.forEach((moment: string) => {
        console.log(`   • ${moment}`);
      });
    } else {
      console.log('   No memorable moments recorded');
    }
    console.log();

    console.log('🧠 PERSONA TRAITS:');
    if (summary.persona?.traits && summary.persona.traits.length > 0) {
      summary.persona.traits.forEach((trait: string) => {
        console.log(`   • ${trait}`);
      });
    }
    console.log();

    console.log('📈 BEHAVIORAL SPECTRUM:');
    if (summary.persona?.spectrum && summary.persona.spectrum.length > 0) {
      summary.persona.spectrum.forEach((item: { trait: string; score: number; maxScore: number }) => {
        const bar = '█'.repeat(Math.round(item.score / 10)) + '░'.repeat(10 - Math.round(item.score / 10));
        console.log(`   ${item.trait.padEnd(25)} ${bar} ${item.score}/${item.maxScore}`);
      });
    }
    console.log();

    // Save detailed data to file for deeper analysis
    return {
      managerId,
      name: summary.managerName,
      persona: summary.persona.name,
      personaTitle: summary.persona.title,
      personaDescription: summary.persona.description,
      totalPoints: summary.totalPoints,
      overallRank: summary.overallRank,
      totalTransfers: summary.totalTransfers,
      netTransferPoints: summary.netTransferPoints,
      transferGrade: summary.transferGrade,
      captaincyGrade: summary.captaincyGrade,
      captaincySuccessRate: summary.captaincySuccessRate,
      benchRegrets: summary.benchRegrets,
      benchGrade: summary.benchGrade,
      templateOverlap: summary.templateOverlap,
      overallDecisionGrade: summary.overallDecisionGrade,
    };

  } catch (error) {
    console.error(`\n❌ Error analyzing manager ${managerId}:`, error);
    return null;
  }
}

async function main() {
  const results = [];
  
  for (let i = 0; i < managers.length; i++) {
    const managerId = managers[i];
    const result = await analyzeManager(managerId);
    if (result) {
      results.push(result);
    }
    
    // Add a small delay between managers to be kind to the API
    if (i < managers.length - 1) {
      const delay = 500; // 0.5 seconds
      await new Promise(resolve => setTimeout(resolve, delay));
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
  console.log('   Transfer Performance:');
  results.forEach(r => {
    console.log(`      ${r.name.padEnd(30)} ${r.totalTransfers} transfers, Net: ${r.netTransferPoints} pts, Grade: ${r.transferGrade}`);
  });
  console.log();
  
  console.log('   Captain & Bench:');
  results.forEach(r => {
    console.log(`      ${r.name.padEnd(30)} Cap Grade: ${r.captaincyGrade}, Success: ${r.captaincySuccessRate?.toFixed(0) ?? 'N/A'}%, Bench Regrets: ${r.benchRegrets}`);
  });
  console.log();
  
  console.log('   Overall Style:');
  results.forEach(r => {
    console.log(`      ${r.name.padEnd(30)} Template: ${r.templateOverlap?.toFixed(0) ?? 'N/A'}%, Overall Grade: ${r.overallDecisionGrade}`);
  });
  console.log();

  console.log('='.repeat(80));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

main();
