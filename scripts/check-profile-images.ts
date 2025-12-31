/**
 * Script to test FPL API endpoints for user profile images
 * Run with: npx tsx scripts/check-profile-images.ts <teamId>
 */

const FPL_BASE_URL = 'https://fantasy.premierleague.com';

async function checkImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkProfileImages(teamId: string) {
  console.log(`\n🔍 Checking profile image availability for Team ID: ${teamId}\n`);
  
  // Fetch manager info first to get player details
  const managerInfo = await fetch(`${FPL_BASE_URL}/api/entry/${teamId}/`)
    .then(res => res.json());
  
  console.log('📋 Manager Info:');
  console.log(`   Name: ${managerInfo.player_first_name} ${managerInfo.player_last_name}`);
  console.log(`   Team Name: ${managerInfo.name}`);
  console.log(`   Kit: ${managerInfo.kit || 'None'}`);
  console.log(`   Favourite Team: ${managerInfo.favourite_team || 'None'}\n`);
  
  // Test various potential image endpoints
  const imageEndpoints = [
    // User avatars
    `${FPL_BASE_URL}/img/avatar/${teamId}.jpg`,
    `${FPL_BASE_URL}/img/avatar/${teamId}.png`,
    `${FPL_BASE_URL}/img/avatars/${teamId}.jpg`,
    `${FPL_BASE_URL}/img/avatars/${teamId}.png`,
    `${FPL_BASE_URL}/static/img/avatar/${teamId}.jpg`,
    `${FPL_BASE_URL}/dist/img/avatar/${teamId}.jpg`,
    
    // Profile pictures
    `${FPL_BASE_URL}/img/profile/${teamId}.jpg`,
    `${FPL_BASE_URL}/img/profile/${teamId}.png`,
    
    // User photos
    `${FPL_BASE_URL}/img/users/${teamId}.jpg`,
    `${FPL_BASE_URL}/img/users/${teamId}.png`,
    
    // Kit/Badge images (if available)
    managerInfo.kit ? `${FPL_BASE_URL}/dist/img/kits/${managerInfo.kit}.png` : null,
    managerInfo.kit ? `${FPL_BASE_URL}/img/kits/${managerInfo.kit}.png` : null,
    
    // Team badge (favourite team)
    managerInfo.favourite_team ? `${FPL_BASE_URL}/dist/img/badges/badge_${managerInfo.favourite_team}.png` : null,
    managerInfo.favourite_team ? `${FPL_BASE_URL}/dist/img/badges/badge_${managerInfo.favourite_team}_40.png` : null,
    managerInfo.favourite_team ? `${FPL_BASE_URL}/dist/img/badges/badge_${managerInfo.favourite_team}_80.png` : null,
  ].filter(Boolean) as string[];
  
  console.log('🖼️  Testing Image Endpoints:\n');
  
  const results = await Promise.all(
    imageEndpoints.map(async (url) => {
      const exists = await checkImageUrl(url);
      return { url, exists };
    })
  );
  
  const found = results.filter(r => r.exists);
  const notFound = results.filter(r => !r.exists);
  
  if (found.length > 0) {
    console.log('✅ FOUND (Available):');
    found.forEach(r => console.log(`   ${r.url}`));
    console.log('');
  }
  
  if (notFound.length > 0) {
    console.log('❌ NOT FOUND:');
    notFound.forEach(r => console.log(`   ${r.url}`));
    console.log('');
  }
  
  // Check if Google/OAuth profile exists (would need authentication)
  console.log('🔐 OAuth Profile Images:');
  console.log('   Note: OAuth profile images (Google, Facebook, etc.) require authentication');
  console.log('   and are typically only accessible via the authenticated user\'s session.\n');
  
  // Summary
  console.log('📊 Summary:');
  console.log(`   Total endpoints tested: ${results.length}`);
  console.log(`   Available: ${found.length}`);
  console.log(`   Not available: ${notFound.length}\n`);
  
  // Recommendations
  console.log('💡 Recommendations:');
  if (found.length === 0) {
    console.log('   ❌ No profile images found via FPL public API');
    console.log('   ✅ Consider using:');
    console.log('      1. UI Avatars: https://ui-avatars.com/api/?name=${firstName}+${lastName}');
    console.log('      2. DiceBear: https://api.dicebear.com/7.x/initials/svg?seed=${name}');
    console.log('      3. Gravatar (if email available): https://www.gravatar.com/avatar/${hash}');
    console.log('      4. Generate SVG avatars with user initials');
  } else {
    console.log(`   ✅ Found ${found.length} potential image source(s)`);
    console.log('   Use these URLs with proper fallback handling');
  }
}

// Run the script
const teamId = process.argv[2];
if (!teamId) {
  console.error('❌ Error: Please provide a team ID');
  console.log('Usage: npx tsx scripts/check-profile-images.ts <teamId>');
  process.exit(1);
}

checkProfileImages(teamId).catch(console.error);
