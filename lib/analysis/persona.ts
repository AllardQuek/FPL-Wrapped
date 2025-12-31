import { ManagerPersona, TransferAnalysis, CaptaincyAnalysis, BenchAnalysis, ChipAnalysis } from '../types';
import { ManagerData } from './types';

import { getPersonaImagePath } from '../constants/persona-images';

/**
 * Determine the manager persona based on season stats
 */
export function calculateManagerPersona(
    data: ManagerData,
    transferEfficiency: number,
    captaincyEfficiency: number,
    avgBenchPerWeek: number,
    templateOverlap: number,
    bestTransfer?: TransferAnalysis | null,
    worstTransfer?: TransferAnalysis | null,
    bestCaptain?: CaptaincyAnalysis | null,
    worstCaptain?: CaptaincyAnalysis | null,
    worstBench?: BenchAnalysis | null,
    bestChip?: ChipAnalysis
): ManagerPersona {
    const { history, transfers } = data;
    const totalHits = history.current.reduce((sum, gw) => sum + (gw.event_transfers_cost / 4), 0);
    const totalTransfers = transfers.length;
    const squadValue = history.current[history.current.length - 1]?.value ?? 1000;

    // Normalize metrics to 0-1 scale for relative scoring
    const metrics = {
        activity: Math.min(1, totalTransfers / 50),
        chaos: Math.min(1, totalHits / 20),
        overthink: Math.min(1, avgBenchPerWeek / 12),
        template: templateOverlap / 100,
        efficiency: Math.max(0, Math.min(1, transferEfficiency / 15)),
        leadership: captaincyEfficiency / 100,
        thrift: Math.max(0, Math.min(1, (1040 - squadValue) / 60))
    };

    const PERSONA_MAP: Record<string, {
        name: string;
        title: string;
        desc: string;
        color: string;
        traits: string[];
        emoji: string;
        weights: Partial<typeof metrics>;
    }> = {
        PEP: {
            name: "Pep Guardiola",
            title: "The Bald Genius",
            desc: "You constantly rotate and leave hauls on the bench. But somehow, your tactical genius makes it work.",
            color: "#6CABDD",
            traits: ["Rotation Roulette", "Bald Fraud Energy", "Makes It Work Anyway"],
            emoji: "🧠",
            weights: { overthink: 1, activity: 0.8, efficiency: 0.6 }
        },
        MOYES: {
            name: "David Moyes",
            title: "The Reliable",
            desc: "You trust the process, stick to the template, and rarely take hits. Consistency is your middle name.",
            color: "#800000",
            traits: ["Template King", "Hit-Averse", "Solid Foundation"],
            emoji: "🛡️",
            weights: { template: 1, chaos: -1, activity: -0.5 }
        },
        REDKNAPP: {
            name: "Harry Redknapp",
            title: "The Wheeler-Dealer",
            desc: "You love a deal. If there's a -4 to be taken, you're taking it. Somehow, your moves often work out.",
            color: "#0000FF",
            traits: ["Hit Specialist", "High Turnover", "Deal Maker"],
            emoji: "💸",
            weights: { chaos: 1, activity: 1, efficiency: 0.3 }
        },
        MOURINHO: {
            name: "Jose Mourinho",
            title: "The Special One",
            desc: "You build from the back and prioritize clean sheets. You'd rather win 1-0 than 4-3.",
            color: "#132257",
            traits: ["Defense First", "Pragmatic Wins", "Budget Warrior"],
            emoji: "🚌",
            weights: { chaos: -0.9, efficiency: 0.6, thrift: 0.6, template: 0.4 }
        },
        KLOPP: {
            name: "Jurgen Klopp",
            title: "Heavy Metal FPL",
            desc: "You ignore the template and chase the upside. When your differentials haul, the world knows it.",
            color: "#C8102E",
            traits: ["Differential Hunter", "High Variance", "Emotional Picks"],
            emoji: "🎸",
            weights: { template: -0.8, leadership: 0.6, chaos: 0.4 }
        },
        AMORIM: {
            name: "Ruben Amorim",
            title: "The Stubborn One",
            desc: "You stick to your vision when others doubt. Every move you make seems to turn to gold.",
            color: "#005CAB",
            traits: ["Unwavering Vision", "High ROI", "Anti-Template Edge"],
            emoji: "🦁",
            weights: { efficiency: 1, activity: 0.4, leadership: 0.4, template: -0.3 }
        },
        FERGUSON: {
            name: "Sir Alex Ferguson",
            title: "The GOAT",
            desc: "You simply know how to win. Your captaincy picks are legendary and your rank reflects it.",
            color: "#DA291C",
            traits: ["Elite Captaincy", "Serial Winner", "Mental Toughness"],
            emoji: "👑",
            weights: { leadership: 1, efficiency: 0.8, overthink: -0.5 }
        },
        POSTECOGLOU: {
            name: "Ange Postecoglou",
            title: "The All-Outer",
            desc: "Attack is your only setting. You take big risks on differentials and never second-guess yourself. Mate...",
            color: "#0B0E1E",
            traits: ["All-Out Attack", "Never Backs Down", "Differential King"],
            emoji: "🦘",
            weights: { chaos: 0.8, template: -1, activity: 0.9, overthink: -0.8 }
        },
        EMERY: {
            name: "Unai Emery",
            title: "The Methodical",
            desc: "Good ebening. Your preparation is unmatched. You think deeply about every transfer and rarely panic.",
            color: "#7B003A",
            traits: ["Deep Analysis", "Efficiency Master", "Calculated Moves"],
            emoji: "📋",
            weights: { efficiency: 1, overthink: 0.8, template: 0.3, chaos: -0.6 }
        },
        WENGER: {
            name: "Arsene Wenger",
            title: "The Professor",
            desc: "You hunt for the perfect differential. You'd rather find a 5.0m gem than follow the herd.",
            color: "#EF0107",
            traits: ["Differential Scout", "Beautiful FPL", "Low Hits"],
            emoji: "🧐",
            weights: { template: -1, efficiency: 0.7, chaos: -0.8 }
        },
        ANCELOTTI: {
            name: "Carlo Ancelotti",
            title: "The Calm Conductor",
            desc: "You stay composed under pressure. Your squad rotates smoothly and you rarely panic. Experience is your edge.",
            color: "#FFFFFF",
            traits: ["Cool Under Pressure", "Balanced Approach", "Veteran Wisdom"],
            emoji: "🤨",
            weights: { template: 0.6, chaos: -0.7, leadership: 0.8, overthink: -0.5 }
        },
        MARESCA: {
            name: "Enzo Maresca",
            title: "The System Builder",
            desc: "You trust young talent and rotate intelligently. Your squad depth is your weapon, and you adapt tactically.",
            color: "#034694",
            traits: ["Youth Over Experience", "Tactical Flexibility", "Smart Rotation"],
            emoji: "🎯",
            weights: { activity: 0.7, overthink: 0.5, efficiency: 0.6, template: -0.3 }
        },
        ARTETA: {
            name: "Mikel Arteta",
            title: "The Process Manager",
            desc: "You follow the plan religiously. You stick to the elite assets and rarely deviate from the template.",
            color: "#EF0107",
            traits: ["Trust the Process", "Efficiency First", "Elite Template"],
            emoji: "🏗️",
            weights: { efficiency: 0.8, template: 1, chaos: -0.8 }
        },
        SIMEONE: {
            name: "Diego Simeone",
            title: "The Warrior",
            desc: "You grind out results with grit and determination. Defense is sacred, and you fight for every single point.",
            color: "#CB3524",
            traits: ["Never Surrender", "Defensive Fortress", "Budget Master"],
            emoji: "⚔️",
            weights: { template: 0.7, chaos: -0.9, leadership: 0.6, thrift: 0.8 }
        },
        SLOT: {
            name: "Arne Slot",
            title: "The Optimizer",
            desc: "You're meticulous and data-driven. Every decision is backed by xG, xA, and underlying stats. You find smart differentials.",
            color: "#D00027",
            traits: ["Data-Driven", "Smart Differentials", "High Efficiency"],
            emoji: "📊",
            weights: { efficiency: 1, leadership: 0.7, overthink: 0.4, chaos: -0.6, template: 0.3 }
        },
        TENHAG: {
            name: "Erik ten Hag",
            title: "The Rebuilder",
            desc: "You're always one gameweek away from a masterpiece. You tinker with the squad constantly.",
            color: "#DA291C",
            traits: ["Constant Rebuild", "High Potential", "Inconsistent"],
            emoji: "📉",
            weights: { activity: 1, efficiency: -0.5, overthink: 0.5 }
        }
    };

    const scores: Record<string, number> = {};
    Object.entries(PERSONA_MAP).forEach(([key, p]) => {
        let score = 20;
        Object.entries(p.weights).forEach(([m, weight]) => {
            const metricValue = metrics[m as keyof typeof metrics];
            score += (metricValue * (weight as number) * 50);
        });
        scores[key] = Math.max(0, score);
    });

    // Apply eligibility filters (hard gates) to prevent nonsensical assignments
    const eligiblePersonas = Object.entries(scores).filter(([key]) => {
        switch (key) {
            case 'FERGUSON': // The GOAT requires excellence
                return metrics.efficiency > 0.6 && metrics.leadership > 0.7;
            
            case 'REDKNAPP': // Wheeler-Dealer requires high activity and hits
                return metrics.chaos > 0.3 && metrics.activity > 0.6;
            
            case 'MOYES': // The Reliable requires stability
                return metrics.chaos < 0.15 && metrics.activity < 0.5;
            
            case 'KLOPP': // Heavy Metal requires anti-template
                return metrics.template < 0.6;
            
            case 'POSTECOGLOU': // All-Outer requires pure differential play
                return metrics.template < 0.5 && metrics.activity > 0.5;
            
            case 'PEP': // Bald Genius requires high bench regret
                return metrics.overthink > 0.5;
            
            case 'WENGER': // Professor requires anti-template + patience
                return metrics.template < 0.5 && metrics.chaos < 0.2;
            
            case 'ARTETA': // Process Manager requires template following
                return metrics.template > 0.6;
            
            case 'MOURINHO': // Special One requires defensive discipline
                return metrics.chaos < 0.2 && metrics.thrift > 0.3;
            
            case 'SIMEONE': // Warrior requires grit (low chaos, thrifty)
                return metrics.chaos < 0.15 && metrics.thrift > 0.4;
            
            case 'AMORIM': // Stubborn One requires high efficiency
                return metrics.efficiency > 0.6;
            
            case 'SLOT': // Optimizer requires efficiency + leadership
                return metrics.efficiency > 0.6 && metrics.leadership > 0.6;
            
            case 'EMERY': // Methodical requires high efficiency + low chaos
                return metrics.efficiency > 0.6 && metrics.chaos < 0.3;
            
            case 'TENHAG': // Rebuilder requires high activity
                return metrics.activity > 0.7;
            
            // No hard gates for: ANCELOTTI, MARESCA (flexible personas)
            default:
                return true;
        }
    });

    // If no personas are eligible (edge case), use all personas
    const validPersonas = eligiblePersonas.length > 0 ? eligiblePersonas : Object.entries(scores);

    // Find the highest scoring eligible persona
    const totalScore = validPersonas.reduce((sum, [, score]) => sum + score, 0);
    const dna = validPersonas
        .map(([key, score]) => ({
            persona: key,
            percentage: Math.round((score / totalScore) * 100)
        }))
        .filter(d => d.percentage > 0)
        .sort((a, b) => b.percentage - a.percentage);

    const primary = dna[0].persona;
    const personaData = PERSONA_MAP[primary];

    const traitScores: { trait: string; score: number; maxScore: number }[] = [];
    const metricToTrait: Record<string, string> = {
        chaos: "Hit Taker",
        overthink: "Bench Regret",
        template: "Template Follower",
        efficiency: "Net Transfer Impact",
        leadership: "Captain Accuracy",
        thrift: "Budget Optimizer"
    };

    Object.entries(personaData.weights).forEach(([metric, weight]) => {
        if (metric === 'activity') return;
        const metricValue = metrics[metric as keyof typeof metrics];
        const contribution = metricValue * (weight as number);
        if (Math.abs(weight as number) > 0.3 && contribution > 0.1) {
            traitScores.push({
                trait: metricToTrait[metric] || metric,
                score: Math.round(metricValue * 100),
                maxScore: 100
            });
        }
    });

    const topTraits = traitScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

    if (topTraits.length < 3) {
        const fallbackTraits = [
            { trait: "Template Loyalty", score: Math.round(metrics.template * 100), maxScore: 100 },
            { trait: "Captain Accuracy", score: Math.round(metrics.leadership * 100), maxScore: 100 },
            { trait: "Transfer Efficiency", score: Math.round(metrics.efficiency * 100), maxScore: 100 }
        ];
        fallbackTraits.forEach(ft => {
            if (!topTraits.find(t => t.trait === ft.trait)) {
                topTraits.push(ft);
            }
        });
    }

    // Generate memorable moments
    const memorableMoments: string[] = [];
    
    // Best transfer moment
    if (bestTransfer && bestTransfer.pointsGained > 10) {
        memorableMoments.push(
            `GW${bestTransfer.ownedGWRange.start}: Signed ${bestTransfer.playerIn.web_name} and gained ${bestTransfer.pointsGained} points`
        );
    }
    
    // Worst transfer/bench moment
    if (worstBench && worstBench.missedPoints > 15) {
        memorableMoments.push(
            `GW${worstBench.gameweek}: Benched ${worstBench.bestBenchPick?.player.web_name} who scored ${worstBench.bestBenchPick?.points} points`
        );
    }
    
    // Best captain moment
    if (bestCaptain && bestCaptain.captainPoints > 20) {
        memorableMoments.push(
            `GW${bestCaptain.gameweek}: Captained ${bestCaptain.captainName} and he hauled ${bestCaptain.captainPoints} points`
        );
    }
    
    // Worst captain moment
    if (worstCaptain && worstCaptain.pointsLeftOnTable > 15) {
        memorableMoments.push(
            `GW${worstCaptain.gameweek}: Captained ${worstCaptain.captainName} (${worstCaptain.captainPoints}pts) but ${worstCaptain.bestPickName} had ${worstCaptain.bestPickPoints} points`
        );
    }
    
    // Best chip moment
    if (bestChip && bestChip.used && bestChip.pointsGained > 15) {
        const chipNames: Record<string, string> = {
            'bboost': 'Bench Boost',
            '3xc': 'Triple Captain',
            'freehit': 'Free Hit',
            'wildcard': 'Wildcard'
        };
        memorableMoments.push(
            `GW${bestChip.event}: Played ${chipNames[bestChip.name]} and gained ${bestChip.pointsGained} points`
        );
    }

    return {
        name: personaData.name,
        title: personaData.title,
        description: personaData.desc,
        spectrum: topTraits.slice(0, 4),
        primaryColor: personaData.color,
        traits: personaData.traits,
        emoji: personaData.emoji,
        imageUrl: getPersonaImagePath(primary),
        memorableMoments: memorableMoments.slice(0, 3) // Top 3 moments
    };
}
