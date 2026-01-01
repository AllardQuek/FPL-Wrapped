/**
 * Squad Value Signal Testing Script
 * 
 * Tests the new squad value behavioral signals to ensure proper persona assignment
 */

export {};

const testManagers = [
  495371,    // Allard Q - Your team (Ancelotti with 105m squad value)
  205286,    // wong minamino
  1685942,   // JYi Lye
  7486369,   // Edwin Chua
  2825258,   // Low Hon Zheng
  7182632,   // Andre Ho
  2165087,   // Samay Sagar
  9350232,   // Junyi Tan
];

console.log('='.repeat(80));
console.log('SQUAD VALUE SIGNALS TESTING');
console.log('='.repeat(80));
console.log('\nAnalyzing squad value patterns and behavioral signals...\n');

async function analyzeSquadValueSignals(managerId: number) {
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

    // Core Performance
    console.log(`\n📊 PERFORMANCE:`);
    console.log(`   Total Points: ${summary.totalPoints}`);
    console.log(`   Overall Rank: ${summary.overallRank?.toLocaleString()}`);
    console.log(`   Overall Grade: ${summary.overallDecisionGrade}`);

    // Squad Value Analysis
    console.log(`\n💰 SQUAD VALUE ANALYSIS:`);
    console.log(`   Current Squad Value: £${(summary.currentSquadValue / 10).toFixed(1)}m`);
    
    // Transfer metrics
    console.log(`\n🔄 TRANSFER METRICS:`);
    console.log(`   Total Transfers: ${summary.totalTransfers}`);
    console.log(`   Hits Taken: ${summary.hitsTaken ?? 0}`);
    console.log(`   Net Transfer Points: ${summary.netTransferPoints}`);
    console.log(`   Transfer Efficiency: ${summary.transferEfficiency?.toFixed(1) ?? 'N/A'}%`);
    console.log(`   Transfer Grade: ${summary.transferGrade}`);

    // Other key metrics
    console.log(`\n📈 OTHER METRICS:`);
    console.log(`   Template Overlap: ${summary.templateOverlap?.toFixed(1)}%`);
    console.log(`   Captaincy Efficiency: ${summary.captaincyEfficiency?.toFixed(1)}%`);
    console.log(`   Avg Bench Points: ${summary.avgPointsOnBench?.toFixed(1)}`);

    // Calculated normalized metrics
    const metrics = {
      activity: Math.min(1, summary.totalTransfers / 80),
      chaos: Math.min(1, (summary.hitsTaken ?? 0) / 30),
      template: summary.templateOverlap / 100,
      efficiency: Math.max(0, Math.min(1, (summary.netTransferPoints + 150) / 300)),
      leadership: (summary.captaincyEfficiency ?? 50) / 100,
      thrift: Math.max(0, Math.min(1, (1040 - (summary.currentSquadValue ?? 1000)) / 60)),
    };

    console.log(`\n🔢 NORMALIZED METRICS:`);
    console.log(`   Activity:    ${(metrics.activity * 100).toFixed(1)}%`);
    console.log(`   Chaos:       ${(metrics.chaos * 100).toFixed(1)}%`);
    console.log(`   Template:    ${(metrics.template * 100).toFixed(1)}%`);
    console.log(`   Efficiency:  ${(metrics.efficiency * 100).toFixed(1)}%`);
    console.log(`   Leadership:  ${(metrics.leadership * 100).toFixed(1)}%`);
    console.log(`   Thrift:      ${(metrics.thrift * 100).toFixed(1)}% (higher = lower squad value)`);

    // Expected squad value signals
    console.log(`\n🚨 EXPECTED SQUAD VALUE SIGNALS:`);
    console.log(`   Note: These are ESTIMATED - actual signals calculated server-side with GW history`);
    
    // Since we don't have GW-by-GW value progression, we can only estimate
    const squadValue = summary.currentSquadValue ?? 1000;
    if (squadValue > 1040) {
      console.log(`   ⚠️  HIGH SQUAD VALUE (${(squadValue/10).toFixed(1)}m > 104.0m)`);
      console.log(`      → Might trigger: valueBuildingGenius (if grew over time)`);
      console.log(`      → Or: bankHoarder (if high ITB)`);
    } else if (squadValue < 1000) {
      console.log(`   ⚠️  LOW SQUAD VALUE (${(squadValue/10).toFixed(1)}m < 100.0m)`);
      console.log(`      → Might trigger: burningValue signal`);
    } else {
      console.log(`   ✓ Normal squad value range (${(squadValue/10).toFixed(1)}m)`);
    }

    // Behavioral spectrum
    console.log(`\n🧠 BEHAVIORAL SPECTRUM:`);
    if (summary.persona?.spectrum) {
      summary.persona.spectrum.forEach((item: { trait: string; score: number; maxScore: number }) => {
        const pct = (item.score / item.maxScore) * 100;
        const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
        console.log(`   ${item.trait.padEnd(25)} ${bar} ${pct.toFixed(0)}%`);
      });
    }

    // Why this persona?
    console.log(`\n💡 PERSONA FIT ANALYSIS:`);
    console.log(`   Ancelotti Profile: Calm, balanced, cool under pressure, veteran wisdom`);
    console.log(`   Ancelotti Weights: template:0.8, chaos:-1.0, leadership:1.0, overthink:-0.6, efficiency:0.6`);
    console.log(`   Ancelotti Gets Boosts From:`);
    console.log(`      - bankHoarder signal (1.8x)`);
    console.log(`      - consistent performance (1.9x)`);
    console.log(`      - moderate overthink + good activity (1.7-2.0x)`);
    console.log(`      - disciplined + good efficiency (1.8x)`);

    if (squadValue > 1040) {
      console.log(`\n   🔍 YOUR HIGH SQUAD VALUE ANALYSIS:`);
      console.log(`      With ${(squadValue/10).toFixed(1)}m squad value, you likely have:`);
      console.log(`      1. Built value well over time → valueBuildingGenius signal`);
      console.log(`         This boosts: Amorim, Wenger, Mourinho, Maresca`);
      console.log(`      2. OR have high bank balance → bankHoarder signal`);
      console.log(`         This boosts: Emery, ANCELOTTI (1.8x), Arteta`);
      console.log(`\n      You got Ancelotti → suggests bankHoarder or consistent/balanced play!`);
    }

    console.log('\n');

  } catch (error) {
    console.error(`\n❌ Error analyzing manager ${managerId}:`, error);
  }
}

async function main() {
  for (const managerId of testManagers) {
    await analyzeSquadValueSignals(managerId);
    // Add delay to be nice to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('='.repeat(80));
  console.log('TESTING COMPLETE');
  console.log('='.repeat(80));
  console.log('\n📝 KEY OBSERVATIONS:');
  console.log('   - High squad value (>104m) can indicate either:');
  console.log('     a) Smart value building (→ Amorim, Wenger, Mourinho)');
  console.log('     b) High bank balance (→ Emery, Ancelotti, Arteta)');
  console.log('   - Need GW-by-GW data to properly differentiate!');
  console.log('   - Ancelotti benefits from bankHoarder + balanced metrics\n');
}

main();
