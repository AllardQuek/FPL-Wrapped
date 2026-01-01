/**
 * Quick Persona Check - Diagnostic for squad value signals
 */

async function checkManager(managerId: number) {
  const response = await fetch(`http://localhost:3000/api/manager/${managerId}`);
  const data = await response.json();
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${data.managerName} (${managerId})`);
  console.log(`Persona: ${data.persona.name} - "${data.persona.title}"`);
  console.log(`${'='.repeat(70)}`);
  
  console.log(`\n💰 Squad Value: £${(data.currentSquadValue / 10 || 100).toFixed(1)}m`);
  console.log(`📊 Rank: ${data.overallRank?.toLocaleString()}`);
  console.log(`🔄 Transfers: ${data.totalTransfers} | Hits: ${data.hitsTaken || 0}`);
  console.log(`📈 Template: ${data.templateOverlap?.toFixed(1)}%`);
  console.log(`👑 Cap Efficiency: ${data.captaincyEfficiency?.toFixed(1)}%`);
  console.log(`🪑 Avg Bench: ${data.avgPointsOnBench?.toFixed(1)} pts`);
  console.log(`💡 Transfer Efficiency: ${data.transferEfficiency?.toFixed(1)}%`);
  
  console.log(`\n🎯 Top Traits:`);
  if (data.persona.spectrum) {
    data.persona.spectrum.slice(0, 4).forEach((t: any) => {
      console.log(`   ${t.trait}: ${t.score}/${t.maxScore}`);
    });
  }
}

async function main() {
  const managers = [
    495371,    // Allard (Ancelotti, 105m)
    205286,    // wong minamino
    1685942,   // JYi Lye
    7486369,   // Edwin Chua
  ];
  
  console.log('\nQUICK PERSONA DIAGNOSTIC - SQUAD VALUE SIGNALS');
  console.log('='.repeat(70));
  
  for (const id of managers) {
    try {
      await checkManager(id);
    } catch (e) {
      console.log(`\n❌ Error fetching ${id}`);
    }
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log('ANALYSIS NOTES:');
  console.log('- High squad value (>104m) suggests:');
  console.log('  a) valueBuildingGenius → boosts Amorim, Wenger, Mourinho');
  console.log('  b) bankHoarder → boosts Emery, Ancelotti, Arteta');
  console.log('- Ancelotti fits: balanced template, good leadership, low chaos');
  console.log('='.repeat(70));
}

main();
