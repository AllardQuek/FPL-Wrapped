
import { getLeagueStandings, getManagerTransfers, getBootstrapData, getManagerInfo, getGameWeekPicks, getLiveGameWeek } from '../lib/fpl-api';
import { transformToGameweekDecision } from '../lib/elasticsearch/transformer';

async function debug() {
    const leagueId = 1305804;
    console.log(`Fetching league ${leagueId}...`);
    const standings = await getLeagueStandings(leagueId, 1);

    if (!standings.standings.results.length) {
        console.log('No managers found in league');
        return;
    }

    const managerId = standings.standings.results[0].entry;
    console.log(`Checking manager ${managerId}...`);

    const [bootstrap, managerInfo, transfers] = await Promise.all([
        getBootstrapData(),
        getManagerInfo(managerId),
        getManagerTransfers(managerId)
    ]);

    if (transfers.length === 0) {
        console.log('Manager has no transfers');
    } else {
        console.log(`Manager has ${transfers.length} transfers. First one:`, transfers[0]);
    }

    // Find a gameweek where they made a transfer
    const gwWithTransfer = transfers.length > 0 ? transfers[0].event : 1;

    console.log(`Testing transformation for GW${gwWithTransfer}...`);

    const picks = await getGameWeekPicks(managerId, gwWithTransfer);
    const liveGW = await getLiveGameWeek(gwWithTransfer);

    const doc = transformToGameweekDecision(
        managerId,
        managerInfo,
        gwWithTransfer,
        picks,
        transfers,
        liveGW,
        bootstrap,
        [leagueId]
    );

    console.log('--- Document Output ---');
    console.log('transfer_timestamps:', doc.transfer_timestamps);
    console.log('transfers (nested):', JSON.stringify(doc.transfers, null, 2));
}

debug().catch(console.error);
