import { NextRequest, NextResponse } from 'next/server';
import { getPlayerSummary, getPlayerById } from '@/lib/fpl-api';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const p1 = searchParams.get('p1');
    const p2 = searchParams.get('p2');
    const start = parseInt(searchParams.get('start') || '1');
    const end = parseInt(searchParams.get('end') || '38');

    if (!p1 || !p2) {
        return NextResponse.json({ error: 'Missing player IDs' }, { status: 400 });
    }

    try {
        const [id1, id2] = [parseInt(p1), parseInt(p2)];
        const [summary1, summary2, player1, player2] = await Promise.all([
            getPlayerSummary(id1),
            getPlayerSummary(id2),
            getPlayerById(id1),
            getPlayerById(id2)
        ]);

        if (!player1 || !player2) {
            return NextResponse.json({ error: 'One or more players not found' }, { status: 404 });
        }

        // Validate that both players are of the same position (element_type)
        if (player1.element_type !== player2.element_type) {
            return NextResponse.json({ 
                error: 'Players must be of the same position. In FPL, you can only transfer players of the same position.' 
            }, { status: 400 });
        }

        const pointsHistory: { gw: number; in: number; out: number }[] = [];
        let pointsInTotal = 0;
        let pointsOutTotal = 0;

        // Use current finished gameweeks or requested range
        const gws = Array.from({ length: end - start + 1 }, (_, i) => start + i);

        for (const gw of gws) {
            const h1 = summary1.history.find(h => h.round === gw);
            const h2 = summary2.history.find(h => h.round === gw);

            if (!h1 && !h2) continue;

            const pts1 = h1?.total_points || 0;
            const pts2 = h2?.total_points || 0;

            pointsInTotal += pts1;
            pointsOutTotal += pts2;

            pointsHistory.push({
                gw,
                in: pts1,
                out: pts2
            });
        }

        return NextResponse.json({
            playerIn: player1,
            playerOut: player2,
            pointsGained: pointsInTotal - pointsOutTotal,
            gameweeksHeld: pointsHistory.length,
            ownedGWRange: { start, end: pointsHistory[pointsHistory.length - 1]?.gw || end },
            breakdown: {
                pointsIn: pointsInTotal,
                pointsOut: pointsOutTotal,
                gwRange: `GW${start}-GW${end}`,
                pointsHistory
            }
        });
    } catch (error) {
        console.error('Error in compare API:', error);
        const errorMessage = error instanceof Error ? error.message : '';

        if (errorMessage.includes('429')) {
            return NextResponse.json(
                { error: 'The FPL API is currently busy. Please try again in a minute.' },
                { status: 429 }
            );
        }

        return NextResponse.json({ error: 'Failed to compare players. Please try again later.' }, { status: 500 });
    }
}
