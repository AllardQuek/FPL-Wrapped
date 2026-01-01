/**
 * Detailed Persona Analysis Script
 * 
 * Deep dive into behavioral signals and timing patterns that influence persona assignment
 */

export {};

const managers = [
  205286,    // wong minamino - Wenger
  1685942,   // JYi Lye - Slot
  7486369,   // Edwin Chua - Emery  
  495371,    // Allard Q - Klopp
  2825258,   // Low Hon Zheng - Wenger
  7182632,   // Andre Ho - Klopp
  2165087,   // Samay Sagar - Emery
  9350232,   // Junyi Tan - Klopp
];

console.log('='.repeat(80));
console.log('DETAILED BEHAVIORAL & TIMING ANALYSIS');
console.log('='.repeat(80));
console.log('\nFetching comprehensive data from FPL API...\n');

async function analyzeManagerDetailed(managerId: number) {
  try {
    const response = await fetch(`http://localhost:3000/api/manager/${managerId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch manager ${managerId}: ${response.statusText}`);
    }

    const summary = await response.json();

    console.log(`\n${'='.repeat(80)}`);
    console.log(`MANAGER: ${summary.managerName} (${managerId})`);
    console.log(`ASSIGNED PERSONA: ${summary.persona.name} - "${summary.persona.title}"`);
    console.log(`${'='.repeat(80)}`);

    // Core metrics
    console.log(`\n📊 CORE METRICS:`);
    console.log(`   Total Points: ${summary.totalPoints} | Rank: ${summary.overallRank?.toLocaleString()}`);
    console.log(`   Transfers: ${summary.totalTransfers} | Template: ${summary.templateOverlap?.toFixed(1)}%`);
    console.log(`   Net Transfer Points: ${summary.netTransferPoints} | Transfer Grade: ${summary.transferGrade}`);
    console.log(`   Captaincy Success: ${summary.captaincySuccessRate?.toFixed(1)}% | Cap Grade: ${summary.captaincyGrade}`);
    console.log(`   Bench Regrets: ${summary.benchRegrets} | Bench Grade: ${summary.benchGrade}`);
    console.log(`   Overall Grade: ${summary.overallDecisionGrade}`);

    // Calculate normalized metrics (matching persona.ts logic)
    const metrics = {
      activity: Math.min(1, summary.totalTransfers / 80),
      chaos: Math.min(1, (summary.totalTransfersCost / 4) / 30),  // Assuming some hits
      template: summary.templateOverlap / 100,
      efficiency: Math.max(0, Math.min(1, summary.netTransferPoints / 300)), // Rough estimate
      leadership: summary.captaincySuccessRate / 100,
    };

    console.log(`\n🔢 NORMALIZED METRICS (0-1 scale):`);
    console.log(`   Activity:    ${(metrics.activity * 100).toFixed(0)}% ${getBar(metrics.activity)}`);
    console.log(`   Chaos:       ${(metrics.chaos * 100).toFixed(0)}% ${getBar(metrics.chaos)}`);
    console.log(`   Template:    ${(metrics.template * 100).toFixed(0)}% ${getBar(metrics.template)}`);
    console.log(`   Efficiency:  ${(metrics.efficiency * 100).toFixed(0)}% ${getBar(metrics.efficiency)}`);
    console.log(`   Leadership:  ${(metrics.leadership * 100).toFixed(0)}% ${getBar(metrics.leadership)}`);

    // Behavioral signals (from persona spectrum)
    console.log(`\n🧠 BEHAVIORAL SPECTRUM:`);
    if (summary.persona?.spectrum) {
      summary.persona.spectrum.forEach((item: { trait: string; score: number; maxScore: number }) => {
        const pct = (item.score / item.maxScore) * 100;
        console.log(`   ${item.trait.padEnd(25)} ${getBar(item.score / 100)} ${item.score}/${item.maxScore} (${pct.toFixed(0)}%)`);
      });
    }

    // Show why this persona was assigned
    console.log(`\n💡 PERSONA REASONING:`);
    console.log(`   Description: ${summary.persona.description}`);
    console.log(`   Key Traits: ${summary.persona.traits?.join(', ')}`);

    // Compare with other potential personas
    console.log(`\n🎭 POTENTIAL ALTERNATIVE PERSONAS:`);
    console.log(`   Based on profile, could also fit:`);
    
    // Activity-based suggestions
    if (metrics.activity > 0.8) {
      console.log(`   - Erik ten Hag (Very High Activity: ${(metrics.activity * 100).toFixed(0)}%)`);
      console.log(`   - Jurgen Klopp (Heavy Metal: ${(metrics.activity * 100).toFixed(0)}% activity)`);
    } else if (metrics.activity < 0.4) {
      console.log(`   - David Moyes (Low Activity: ${(metrics.activity * 100).toFixed(0)}%)`);
    }
    
    // Template-based suggestions
    if (metrics.template < 0.25) {
      console.log(`   - Arsene Wenger (Ultra Contrarian: ${(metrics.template * 100).toFixed(0)}% template)`);
      console.log(`   - Ange Postecoglou (Differential King: ${(metrics.template * 100).toFixed(0)}% template)`);
    } else if (metrics.template > 0.65) {
      console.log(`   - Mikel Arteta (Template Follower: ${(metrics.template * 100).toFixed(0)}% template)`);
    }
    
    // Rank-based suggestions
    if (summary.overallRank && summary.overallRank <= 100000) {
      console.log(`   - Sir Alex Ferguson / Arne Slot (Elite Rank: ${summary.overallRank.toLocaleString()})`);
    }

    console.log('\n');

  } catch (error) {
    console.error(`\n❌ Error analyzing manager ${managerId}:`, error);
  }
}

function getBar(value: number): string {
  const filled = Math.round(value * 20);
  return '█'.repeat(filled) + '░'.repeat(20 - filled);
}

async function main() {
  for (const managerId of managers) {
    await analyzeManagerDetailed(managerId);
  }

  console.log('='.repeat(80));
  console.log('KEY INSIGHTS');
  console.log('='.repeat(80));
  console.log('\n⚠️  MISSING TIMING DATA:');
  console.log('   The API doesn\'t return transfer timing information like:');
  console.log('   - Panic buyers (<3h before deadline)');
  console.log('   - Deadline day scramblers (last 24h)');
  console.log('   - Early planners (>96h before deadline)');
  console.log('   - Knee-jerkers (<48h after GW starts)');
  console.log('   - Late night reactors (11pm-5am transfers)');
  console.log('\n   These signals are CALCULATED server-side but not exposed in the API response!');
  console.log('   Consider adding these to the API for richer client-side analysis.\n');
  
  console.log('='.repeat(80));
}

main();
