import { CaptaincyAnalysis } from '../types';
import { ManagerData } from './types';
import { getPlayer, getPlayerPointsInGameweek } from './utils';

/**
 * Analyze captaincy decisions for each gameweek
 * 
 * DESIGN DECISION: Captaincy Accuracy Definition
 * ------------------------------------------------
 * The FPL API does not provide data on the top 5 most captained players per gameweek.
 * Only the single most captained player globally is available via `most_captained` field.
 * 
 * Therefore, "accuracy" is defined as: Did you captain the highest-scoring player 
 * in your starting XI that gameweek? This measures optimal decision-making within 
 * the constraints of your own squad, rather than comparing against arbitrary point 
 * thresholds or external captain choices.
 * 
 * This definition:
 * - Is objective and data-driven (no arbitrary thresholds)
 * - Rewards perfect captain selection from available options
 * - Accounts for the reality that you can only captain players you own
 */
export function analyzeCaptaincy(data: ManagerData): CaptaincyAnalysis[] {
    const { bootstrap, picksByGameweek, liveByGameweek, finishedGameweeks } = data;
    const analyses: CaptaincyAnalysis[] = [];

    for (const gw of finishedGameweeks) {
        const picks = picksByGameweek.get(gw);
        if (!picks) continue;

        const captainPick = picks.picks.find((p) => p.is_captain);
        if (!captainPick) continue;

        const captain = getPlayer(captainPick.element, bootstrap);
        if (!captain) continue;

        const rawCaptainPoints = getPlayerPointsInGameweek(captainPick.element, gw, liveByGameweek);
        const captainPoints = rawCaptainPoints * captainPick.multiplier;

        const startingPicks = picks.picks.filter((p) => p.position <= 11);
        let bestPickId = captainPick.element;
        let bestPickRawPoints = rawCaptainPoints;

        for (const pick of startingPicks) {
            const points = getPlayerPointsInGameweek(pick.element, gw, liveByGameweek);
            if (points > bestPickRawPoints) {
                bestPickRawPoints = points;
                bestPickId = pick.element;
            }
        }

        const bestPlayer = getPlayer(bestPickId, bootstrap);
        const bestPickIfCaptainPoints = bestPickRawPoints * captainPick.multiplier;
        // Net team difference when swapping the captain to the best starter:
        // (multiplier * bestRaw + rawCaptain) - (multiplier * rawCaptain + bestRaw) = (multiplier - 1) * (bestRaw - rawCaptain)
        const pointsLeftOnTable = (captainPick.multiplier - 1) * (bestPickRawPoints - rawCaptainPoints);

        const mostCaptainedId = bootstrap.events[gw - 1]?.most_captained;
        const wasMostCaptainedGlobal = captainPick.element === mostCaptainedId;

        // Accuracy: Did you captain the highest-scoring player in your starting XI?
        const wasAccurate = bestPickId === captainPick.element;

        analyses.push({
            gameweek: gw,
            captainId: captainPick.element,
            captainName: captain.web_name,
            captainPoints,
            bestPickId,
            bestPickName: bestPlayer?.web_name ?? 'Unknown',
            // Store the raw points the best starter scored (single game points)
            bestPickPoints: bestPickRawPoints,
            pointsLeftOnTable,
            wasOptimal: wasAccurate,
            wasSuccessful: wasAccurate,
            wasMostCaptainedGlobal,
            captainMultiplier: captainPick.multiplier,
        });
    }

    return analyses;
}
