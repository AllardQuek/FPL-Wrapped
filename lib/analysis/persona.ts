import { ManagerPersona, TransferAnalysis, CaptaincyAnalysis, BenchAnalysis, ChipAnalysis, Transfer } from '../types';
import { ManagerData } from './types';
import { analyzeTransferTiming } from './transfers';

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
    captaincyAnalyses: Array<{ captainName?: string; wasSuccessful?: boolean }>,
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

    // NEW: Analyze transfer timing patterns
    const transferTiming = analyzeTransferTiming(data);

    // ENHANCED: Detect specific behavioral patterns that are strong signals
    const behavioralSignals = detectBehavioralSignals(data, transfers, transferTiming);
    
    // NEW: Analyze captain choice patterns for personality insights
    const captainPattern = analyzeCaptainPattern(captaincyAnalyses);

    // Normalize metrics to 0-1 scale for relative scoring
    // IMPROVED: Wider normalization ranges to better distribute real-world values
    const metrics = {
        activity: Math.min(1, totalTransfers / 80),      // Was /50 - now 40 transfers = 0.5, 80 = 1.0
        chaos: Math.min(1, totalHits / 30),              // Was /20 - now 15 hits = 0.5, 30 = 1.0
        overthink: Math.min(1, avgBenchPerWeek / 15),    // Was /12 - now 7.5/wk = 0.5, 15/wk = 1.0
        template: templateOverlap / 100,
        efficiency: Math.max(0, Math.min(1, transferEfficiency / 15)),
        leadership: captaincyEfficiency / 100,
        thrift: Math.max(0, Math.min(1, (1040 - squadValue) / 60))
    };

/**
 * Detect specific behavioral patterns that strongly indicate certain personas
 * IMPROVED: Focus on SOUND metrics - avoiding misleading indicators
 */
function detectBehavioralSignals(data: ManagerData, transfers: Transfer[], transferTiming: ReturnType<typeof import('./transfers').analyzeTransferTiming>) {
    const { history } = data;
    const finishedGWs = history.current.filter(gw => gw.event <= (history.current[history.current.length - 1]?.event || 18));
    
    const signals = {
        // Activity patterns (avoiding total transfer count which includes chips)
        constantTinkerer: false,      // Multiple GWs with 2+ non-chip transfers (indecisive)
        hitAddict: false,             // Multiple consecutive hits (chaos tolerance)
        disciplined: false,           // Very few hits despite decent activity
        
        // Bench management (relative to squad quality)
        rotationPain: false,          // Consistently high bench points (bad rotation)
        benchMaster: false,           // Low bench points (good predictions)
        
        // Template & conviction
        ultraContrarian: false,       // Extremely low template throughout
        longTermBacker: false,        // Held players 10+ GWs (stubborn conviction)
        
        // Chip timing
        earlyAggression: false,       // Early wildcard (before GW12)
        chipHoarder: false,           // Very late chips (after GW25)
        
        // Performance patterns
        boomBust: false,              // High volatility (big swings)
        consistent: false,            // Low volatility (stable)
        
        // Transfer timing patterns (NEW)
        panicBuyer: false,            // Multiple panic transfers (<3h before deadline)
        deadlineDayScrambler: false,  // Majority of transfers on deadline day (3-24h)
        earlyPlanner: false,          // Most transfers >96h before deadline (methodical)
        kneeJerker: false,            // Multiple transfers <48h after previous GW starts (reactive)
        lateNightReactor: false,      // Many transfers 11pm-5am local time (reactive)
    };

    // 1. CONSTANT TINKERER: Count non-chip GWs with multiple transfers
    // This shows indecisiveness, not just chip inflation
    const chipGWs = new Set(history.chips.map(c => c.event));
    const nonChipMultiTransferGWs = finishedGWs.filter(gw => 
        !chipGWs.has(gw.event) && gw.event_transfers >= 2
    ).length;
    signals.constantTinkerer = nonChipMultiTransferGWs >= 8; // 8+ GWs with 2+ transfers outside chips

    // 2. HIT ADDICT: Multiple consecutive hits (shows chaos tolerance)
    let consecutiveHits = 0;
    let maxConsecutiveHits = 0;
    finishedGWs.forEach(gw => {
        if (gw.event_transfers_cost > 0) {
            consecutiveHits++;
            maxConsecutiveHits = Math.max(maxConsecutiveHits, consecutiveHits);
        } else {
            consecutiveHits = 0;
        }
    });
    signals.hitAddict = maxConsecutiveHits >= 3; // 3+ consecutive hit weeks

    // 3. DISCIPLINED: Low hits despite activity
    const totalHits = finishedGWs.reduce((sum, gw) => sum + (gw.event_transfers_cost / 4), 0);
    const nonChipTransfers = finishedGWs
        .filter(gw => !chipGWs.has(gw.event))
        .reduce((sum, gw) => sum + gw.event_transfers, 0);
    signals.disciplined = totalHits <= 2 && nonChipTransfers >= 20; // Active but controlled

    // 4. ROTATION PAIN: High bench points relative to squad value (bad rotation, not bad squad)
    const avgBenchPoints = finishedGWs.reduce((sum, gw) => sum + gw.points_on_bench, 0) / finishedGWs.length;
    const avgSquadValue = finishedGWs.reduce((sum, gw) => sum + gw.value, 0) / finishedGWs.length;
    const highBenchGWs = finishedGWs.filter(gw => gw.points_on_bench >= 10).length;
    // High squad value + high bench points = rotation pain (not just bad players)
    signals.rotationPain = avgSquadValue >= 1020 && avgBenchPoints >= 9 && highBenchGWs >= 5;

    // 5. BENCH MASTER: Low bench points consistently (good predictions)
    signals.benchMaster = avgBenchPoints < 7 && highBenchGWs <= 2;

    // 6. ULTRA CONTRARIAN: Consistently low template (not just one-off punts)
    // Note: templateOverlap is passed from outside, so we'll check in main function

    // 7. LONG-TERM BACKER: Find players held for 10+ consecutive GWs
    // Build ownership timeline for each player
    const playerFirstOwned = new Map<number, number>();
    const playerLastOwned = new Map<number, number>();
    
    // Sort transfers by event
    const sortedTransfers = [...transfers].sort((a, b) => a.event - b.event);
    
    sortedTransfers.forEach(t => {
        // Track when player was bought
        if (!playerFirstOwned.has(t.element_in)) {
            playerFirstOwned.set(t.element_in, t.event);
        }
        // Track when player was sold
        playerLastOwned.set(t.element_out, t.event);
    });
    
    // Calculate longest holds
    const currentGW = finishedGWs[finishedGWs.length - 1]?.event || 18;
    let maxHoldLength = 0;
    let longHoldCount = 0;
    
    playerFirstOwned.forEach((boughtGW, playerId) => {
        const soldGW = playerLastOwned.get(playerId) || (currentGW + 1); // Still owned if not sold
        const holdLength = soldGW - boughtGW;
        
        if (holdLength >= 10) {
            longHoldCount++;
        }
        maxHoldLength = Math.max(maxHoldLength, holdLength);
    });
    
    signals.longTermBacker = longHoldCount >= 3; // Held 3+ players for 10+ GWs

    // 8. CHIP TIMING
    const wildcardChip = history.chips.find(c => c.name === 'wildcard');
    signals.earlyAggression = wildcardChip ? wildcardChip.event < 12 : false;
    
    const allChipsUsed = history.chips.length;
    const lateChipsCount = history.chips.filter(c => c.event > 25).length;
    signals.chipHoarder = allChipsUsed >= 2 && lateChipsCount === allChipsUsed;

    // 9. BOOM-BUST: High rank volatility (big swings in performance)
    if (finishedGWs.length >= 10) {
        const points = finishedGWs.map(gw => gw.points);
        const avgPoints = points.reduce((a, b) => a + b, 0) / points.length;
        const variance = points.reduce((sum, p) => sum + Math.pow(p - avgPoints, 2), 0) / points.length;
        const stdDev = Math.sqrt(variance);
        
        const highScoreGWs = finishedGWs.filter(gw => gw.points >= 70).length;
        const lowScoreGWs = finishedGWs.filter(gw => gw.points < 40).length;
        
        signals.boomBust = stdDev > 18 && highScoreGWs >= 3 && lowScoreGWs >= 3;
        signals.consistent = stdDev < 14 && highScoreGWs <= 2 && lowScoreGWs <= 2;
    }

    // 10. TRANSFER TIMING PATTERNS (NEW - Enhanced with gameweek cycle awareness)
    const totalMeaningfulTransfers = transferTiming.panicTransfers + transferTiming.deadlineDayTransfers + 
                                      transferTiming.midWeekTransfers + transferTiming.earlyStrategicTransfers;
    if (totalMeaningfulTransfers >= 10) {
        // Panic buyer: 20%+ of transfers within 3 hours of deadline
        signals.panicBuyer = transferTiming.panicTransfers >= 2 && 
                            (transferTiming.panicTransfers / totalMeaningfulTransfers) >= 0.20;
        
        // Deadline day scrambler: 40%+ of transfers on deadline day (3-24h before)
        signals.deadlineDayScrambler = transferTiming.deadlineDayTransfers >= 4 &&
                                       (transferTiming.deadlineDayTransfers / totalMeaningfulTransfers) >= 0.40;
        
        // Early planner: 35%+ of transfers >96h before deadline (methodical after full data)
        signals.earlyPlanner = transferTiming.earlyStrategicTransfers >= 3 &&
                              (transferTiming.earlyStrategicTransfers / totalMeaningfulTransfers) >= 0.35;
        
        // Knee-jerker: 25%+ of transfers within 48h of previous GW starting (reacting to early fixtures)
        signals.kneeJerker = transferTiming.kneeJerkTransfers >= 3 &&
                            (transferTiming.kneeJerkTransfers / totalMeaningfulTransfers) >= 0.25;
        
        // Late night reactor: 30%+ of transfers between 11pm-5am local time (emotional decisions)
        signals.lateNightReactor = transferTiming.lateNightTransfers >= 3 &&
                                   (transferTiming.lateNightTransfers / totalMeaningfulTransfers) >= 0.30;
    }

    return signals;
}

// NEW: Analyze captain choice patterns to detect personality
function analyzeCaptainPattern(captaincyAnalyses: Array<{ captainName?: string; wasSuccessful?: boolean }>): {
    loyalty: boolean,           // Same captain 8+ times
    chaser: boolean,            // Frequently switches (4+ different in 8 GWs)
    differential: boolean,      // 3+ non-premium captains
    safePicker: boolean,        // Only Haaland/Salah
} {
    const pattern = {
        loyalty: false,
        chaser: false,
        differential: false,
        safePicker: false,
    };
    
    if (captaincyAnalyses.length < 8) return pattern;
    
    const premiums = ['Haaland', 'M.Salah', 'Palmer'];
    const first12GWs = captaincyAnalyses.slice(0, 12);
    
    // Count captain frequency
    const captainCounts = new Map<string, number>();
    first12GWs.forEach(gw => {
        const name = gw.captainName || '';
        captainCounts.set(name, (captainCounts.get(name) || 0) + 1);
    });
    
    const mostCaptained = Math.max(...captainCounts.values());
    const uniqueCaptains = captainCounts.size;
    const nonPremiumCaptains = first12GWs.filter(gw => 
        !premiums.includes(gw.captainName || '')
    ).length;
    
    pattern.loyalty = mostCaptained >= 8; // Same captain 8+ times
    pattern.chaser = uniqueCaptains >= 5; // 5+ different captains in 12 GWs (chasing form)
    pattern.differential = nonPremiumCaptains >= 3; // 3+ non-premium captain picks
    pattern.safePicker = nonPremiumCaptains === 0 && uniqueCaptains <= 2; // Only 1-2 premiums
    
    return pattern;
}

// NEW: Analyze chip timing decisions to reveal planning style
function analyzeChipStrategy(chips: Array<{ name: string; event: number; time: string }>): {
    earlyAggressor: boolean,      // Wildcard before GW8
    lastMinute: boolean,          // Multiple chips activated within 2 hours of deadline
    planner: boolean,             // Chips spread evenly, activated >12 hours before deadline
    hoarder: boolean,             // 2+ chips after GW25
    optimal: boolean,             // Bench boost in double GW, chips in high-scoring weeks
} {
    const strategy = {
        earlyAggressor: false,
        lastMinute: false,
        planner: false,
        hoarder: false,
        optimal: false,
    };
    
    if (chips.length === 0) return strategy;
    
    const wildcard = chips.find(c => c.name === 'wildcard');
    const benchBoost = chips.find(c => c.name === 'bboost');
    const lateChips = chips.filter(c => c.event > 25).length;
    
    // Early aggression
    strategy.earlyAggressor = wildcard ? wildcard.event <= 7 : false;
    
    // Last-minute decisions (check hour of day from timestamp)
    const lastMinuteChips = chips.filter(chip => {
        const time = new Date(chip.time);
        const hour = time.getUTCHours();
        // FPL deadline is typically 11:00 UTC Saturday, so 9-11 UTC is "last minute"
        return hour >= 9 && hour <= 11;
    });
    strategy.lastMinute = lastMinuteChips.length >= 2;
    
    // Planner (early activation, spread timing)
    const earlyActivations = chips.filter(chip => {
        const time = new Date(chip.time);
        const hour = time.getUTCHours();
        // Activated >12 hours before deadline (before 23:00 UTC Friday)
        return hour < 23 || hour > 11;
    });
    const chipSpacing = chips.length >= 3 ? 
        Math.max(...chips.map(c => c.event)) - Math.min(...chips.map(c => c.event)) : 0;
    strategy.planner = earlyActivations.length >= 2 && chipSpacing > 10;
    
    // Hoarder
    strategy.hoarder = lateChips >= 2;
    
    // Optimal (bench boost in high-scoring opportunity, other chips well-timed)
    // Note: This is simplified - would need historical data to truly assess
    strategy.optimal = benchBoost ? benchBoost.event >= 15 && benchBoost.event <= 22 : false;
    
    return strategy;
}

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
            weights: { overthink: 1.5, activity: 0.5, efficiency: 0.4, template: 0.3, chaos: -0.5 }  // FIXED: Reduced activity from 0.9 to 0.5 - Pep is about rotation pain, not high activity
        },
        MOYES: {
            name: "David Moyes",
            title: "The Reliable",
            desc: "You trust the process, stick to the template, and rarely take hits. Consistency is your middle name.",
            color: "#800000",
            traits: ["Template King", "Hit-Averse", "Solid Foundation"],
            emoji: "🛡️",
            weights: { template: 1.2, chaos: -1.5, activity: -0.8, overthink: -0.6, thrift: 0.4 }
        },
        REDKNAPP: {
            name: "Harry Redknapp",
            title: "The Wheeler-Dealer",
            desc: "You love a deal. If there's a -4 to be taken, you're taking it. Somehow, your moves often work out.",
            color: "#0000FF",
            traits: ["Hit Specialist", "High Turnover", "Deal Maker"],
            emoji: "💸",
            weights: { chaos: 1.5, activity: 1.2, efficiency: -0.3, overthink: 0.3, template: -0.4 }
        },
        MOURINHO: {
            name: "Jose Mourinho",
            title: "The Special One",
            desc: "You build from the back and prioritize clean sheets. You'd rather win 1-0 than 4-3.",
            color: "#132257",
            traits: ["Defense First", "Pragmatic Wins", "Budget Warrior"],
            emoji: "🚌",
            weights: { chaos: -1.2, efficiency: 0.7, thrift: 0.9, template: 0.5, overthink: -0.7 }
        },
        KLOPP: {
            name: "Jurgen Klopp",
            title: "Heavy Metal FPL",
            desc: "You ignore the template and chase the upside. When your differentials haul, the world knows it.",
            color: "#C8102E",
            traits: ["Differential Hunter", "High Variance", "Emotional Picks"],
            emoji: "🎸",
            weights: { template: -1.5, leadership: 0.7, chaos: 0.5, activity: 0.6, efficiency: 0.2 }
        },
        AMORIM: {
            name: "Ruben Amorim",
            title: "The Stubborn One",
            desc: "You stick to your vision when others doubt. Every move you make seems to turn to gold.",
            color: "#005CAB",
            traits: ["Unwavering Vision", "High ROI", "Anti-Template Edge"],
            emoji: "🦁",
            weights: { efficiency: 1.3, leadership: 0.6, template: -0.5, activity: 0.3, chaos: -0.4 }
        },
        FERGUSON: {
            name: "Sir Alex Ferguson",
            title: "The GOAT",
            desc: "You simply know how to win. Your captaincy picks are legendary and your rank reflects it.",
            color: "#DA291C",
            traits: ["Elite Captaincy", "Serial Winner", "Mental Toughness"],
            emoji: "👑",
            weights: { leadership: 1.5, efficiency: 1.0, overthink: -0.7, chaos: -0.5, template: 0.4 }
        },
        POSTECOGLOU: {
            name: "Ange Postecoglou",
            title: "The All-Outer",
            desc: "Attack is your only setting. You take big risks on differentials and never second-guess yourself. Mate...",
            color: "#0B0E1E",
            traits: ["All-Out Attack", "Never Backs Down", "Differential King"],
            emoji: "🦘",
            weights: { chaos: 1.0, template: -1.5, activity: 1.1, overthink: -1.0, efficiency: -0.2 }
        },
        EMERY: {
            name: "Unai Emery",
            title: "The Methodical",
            desc: "Good ebening. Your preparation is unmatched. You think deeply about every transfer and rarely panic.",
            color: "#7B003A",
            traits: ["Deep Analysis", "Efficiency Master", "Calculated Moves"],
            emoji: "📋",
            weights: { efficiency: 1.3, overthink: 0.6, template: 0.4, chaos: -1.0, activity: -0.3 }
        },
        WENGER: {
            name: "Arsene Wenger",
            title: "The Professor",
            desc: "You hunt for the perfect differential. You'd rather find a 5.0m gem than follow the herd.",
            color: "#EF0107",
            traits: ["Differential Scout", "Beautiful FPL", "Low Hits"],
            emoji: "🧐",
            weights: { template: -1.5, efficiency: 0.9, chaos: -1.2, thrift: 0.7, activity: -0.4 }
        },
        ANCELOTTI: {
            name: "Carlo Ancelotti",
            title: "The Calm Conductor",
            desc: "You stay composed under pressure. Your squad rotates smoothly and you rarely panic. Experience is your edge.",
            color: "#FFFFFF",
            traits: ["Cool Under Pressure", "Balanced Approach", "Veteran Wisdom"],
            emoji: "🤨",
            weights: { template: 0.7, chaos: -1.0, leadership: 0.9, overthink: -0.6, efficiency: 0.5 }
        },
        MARESCA: {
            name: "Enzo Maresca",
            title: "The System Builder",
            desc: "You trust young talent and rotate intelligently. Your squad depth is your weapon, and you adapt tactically.",
            color: "#034694",
            traits: ["Youth Over Experience", "Tactical Flexibility", "Smart Rotation"],
            emoji: "🎯",
            weights: { activity: 0.9, overthink: 0.5, efficiency: 0.7, template: -0.5, chaos: 0.2 }
        },
        ARTETA: {
            name: "Mikel Arteta",
            title: "The Process Manager",
            desc: "You follow the plan religiously. You stick to the elite assets and rarely deviate from the template.",
            color: "#EF0107",
            traits: ["Trust the Process", "Efficiency First", "Elite Template"],
            emoji: "🏗️",
            weights: { efficiency: 1.0, template: 1.3, chaos: -1.2, activity: -0.3, leadership: 0.6 }
        },
        SIMEONE: {
            name: "Diego Simeone",
            title: "The Warrior",
            desc: "You grind out results with grit and determination. Defense is sacred, and you fight for every single point.",
            color: "#CB3524",
            traits: ["Never Surrender", "Defensive Fortress", "Budget Master"],
            emoji: "⚔️",
            weights: { template: 0.8, chaos: -1.5, leadership: 0.7, thrift: 1.2, overthink: -0.5 }
        },
        SLOT: {
            name: "Arne Slot",
            title: "The Optimizer",
            desc: "You're meticulous and data-driven. Every decision is backed by xG, xA, and underlying stats. You find smart differentials.",
            color: "#D00027",
            traits: ["Data-Driven", "Smart Differentials", "High Efficiency"],
            emoji: "📊",
            weights: { efficiency: 1.4, leadership: 0.9, overthink: 0.3, chaos: -0.8, template: 0.2 }
        },
        TENHAG: {
            name: "Erik ten Hag",
            title: "The Rebuilder",
            desc: "You're always one gameweek away from a masterpiece. You tinker with the squad constantly.",
            color: "#DA291C",
            traits: ["Constant Rebuild", "High Potential", "Inconsistent"],
            emoji: "📉",
            weights: { activity: 1.8, efficiency: -0.8, overthink: 0.6, chaos: 0.7, template: -0.2 }  // FIXED: Increased activity from 1.4 to 1.8 - strengthen for extreme tinkerers
        }
    };

    const scores: Record<string, number> = {};
    Object.entries(PERSONA_MAP).forEach(([key, p]) => {
        // IMPROVED: Start at 0 instead of 20, and amplify weight impact with multiplier of 100
        let score = 0;
        Object.entries(p.weights).forEach(([m, weight]) => {
            const metricValue = metrics[m as keyof typeof metrics];
            score += (metricValue * (weight as number) * 100);
        });
        scores[key] = score;
    });

    // ENHANCED: Apply behavioral signal boosts - strong patterns trump pure metrics
    // These create VARIABILITY by detecting clear behavioral patterns
    
    // Long-term conviction signals
    if (behavioralSignals.longTermBacker && metrics.efficiency > 0.6) {
        scores['AMORIM'] = (scores['AMORIM'] || 0) * 2.0;  // 100% boost - stubborn loyalty that pays off
    }
    
    // Activity & chaos signals
    if (behavioralSignals.hitAddict && behavioralSignals.constantTinkerer) {
        scores['REDKNAPP'] = (scores['REDKNAPP'] || 0) * 2.2;  // 120% boost - clear wheeler-dealer
        scores['TENHAG'] = (scores['TENHAG'] || 0) * 1.7;  // 70% boost - constant rebuilding
    } else if (behavioralSignals.constantTinkerer && !behavioralSignals.hitAddict) {
        scores['TENHAG'] = (scores['TENHAG'] || 0) * 2.0;  // 100% boost - rebuilder without chaos
        scores['MARESCA'] = (scores['MARESCA'] || 0) * 1.6;  // System builder constantly tweaking
    }
    
    // Discipline & efficiency signals
    if (behavioralSignals.disciplined && metrics.efficiency > 0.65) {
        scores['EMERY'] = (scores['EMERY'] || 0) * 2.0;  // 100% boost - methodical excellence
        scores['WENGER'] = (scores['WENGER'] || 0) * 1.7;  // Professor finding value
    }
    
    // Chip timing signals
    if (behavioralSignals.earlyAggression) {
        scores['POSTECOGLOU'] = (scores['POSTECOGLOU'] || 0) * 1.8;  // All-out attack from the start
        scores['KLOPP'] = (scores['KLOPP'] || 0) * 1.5;  // Heavy metal aggression
    }
    if (behavioralSignals.chipHoarder && metrics.efficiency > 0.6) {
        scores['EMERY'] = (scores['EMERY'] || 0) * 1.6;  // Methodical patience
        scores['MOURINHO'] = (scores['MOURINHO'] || 0) * 1.5;  // Pragmatic timing
    }
    
    // ===== EXCLUSIVE SIGNALS: Rare characteristics that strongly identify specific personas =====
    // These are "super boosts" for signals that typically only 1-2 managers will have
    
    // RANK-BASED ELITE IDENTIFICATION (NEW - Top priority!)
    const currentRank = history.current[history.current.length - 1]?.overall_rank ?? 9999999;
    const totalPlayers = 12742297; // FPL total players (updated dynamically in production)
    const topPercentile = (currentRank / totalPlayers) * 100;
    
    // Top 10k = THE GOAT (Sir Alex Ferguson) - Absolute elite
    if (currentRank <= 10000) {
        scores['FERGUSON'] = (scores['FERGUSON'] || 0) * 5.0;  // 400% MEGA BOOST - Top 10k = GOAT!
        scores['SLOT'] = (scores['SLOT'] || 0) * 2.5;  // Also consider elite optimizer
    }
    // Top 50k (top 0.4%) = Elite tier, likely GOAT
    else if (currentRank <= 50000) {
        scores['FERGUSON'] = (scores['FERGUSON'] || 0) * 4.2;  // 320% MEGA BOOST - Elite tier
        scores['SLOT'] = (scores['SLOT'] || 0) * 3.5;  // Systematic genius
        scores['EMERY'] = (scores['EMERY'] || 0) * 2.8;
    }
    // Top 0.1% (top ~12k) = Elite tier
    else if (topPercentile <= 0.1) {
        scores['FERGUSON'] = (scores['FERGUSON'] || 0) * 4.0;  // 300% MEGA BOOST - Elite excellence
        scores['SLOT'] = (scores['SLOT'] || 0) * 3.0;  // Systematic genius
        scores['EMERY'] = (scores['EMERY'] || 0) * 2.5;
    }
    // Top 1% (top ~127k) = Very strong players
    else if (topPercentile <= 1.0) {
        scores['SLOT'] = (scores['SLOT'] || 0) * 3.2;  // Optimizer is most likely here
        scores['FERGUSON'] = (scores['FERGUSON'] || 0) * 2.8;  // Also consider GOAT
        scores['EMERY'] = (scores['EMERY'] || 0) * 2.8;
    }
    // Top 10% (top ~1.27M) = Good players
    else if (topPercentile <= 10.0) {
        scores['SLOT'] = (scores['SLOT'] || 0) * 2.0;  // Solid optimizer
        scores['EMERY'] = (scores['EMERY'] || 0) * 1.8;
        scores['ARTETA'] = (scores['ARTETA'] || 0) * 1.6;  // Process works
    }
    
    // Rotation pain is VERY rare and almost exclusively identifies Pep (overthinking with quality squad)
    if (behavioralSignals.rotationPain) {
        scores['PEP'] = (scores['PEP'] || 0) * 3.0;  // 200% SUPER BOOST - Exclusive Pep signal
    }
    
    // Elite rank with low activity = TRUE optimizer (not just lucky)
    if (currentRank <= 100000 && behavioralSignals.disciplined) {
        scores['SLOT'] = (scores['SLOT'] || 0) * 3.5;  // 250% MEGA BOOST - Elite systematic optimizer!
        scores['EMERY'] = (scores['EMERY'] || 0) * 2.8;  // Methodical excellence
    } else if (currentRank <= 100000) {
        // Elite rank even without disciplined signal
        scores['SLOT'] = (scores['SLOT'] || 0) * 2.8;  // Still a strong signal
        scores['EMERY'] = (scores['EMERY'] || 0) * 2.4;
    }
    
    // Knee-jerk reactive behavior is distinctive for aggressive managers
    if (behavioralSignals.kneeJerker && metrics.activity > 0.6) {
        scores['KLOPP'] = (scores['KLOPP'] || 0) * 2.8;  // 180% SUPER BOOST - Heavy metal reactive!
        scores['POSTECOGLOU'] = (scores['POSTECOGLOU'] || 0) * 2.5;  // All-out attack on form
    }
    
    // Long-term backing with high efficiency is Amorim's signature
    if (behavioralSignals.longTermBacker && metrics.efficiency > 0.75) {
        scores['AMORIM'] = (scores['AMORIM'] || 0) * 2.6;  // 160% SUPER BOOST - Stubborn conviction
    }
    
    // Ultra-contrarian with success is pure Wenger (finding hidden gems)
    if (behavioralSignals.ultraContrarian && metrics.leadership > 0.50) {
        scores['WENGER'] = (scores['WENGER'] || 0) * 2.7;  // 170% SUPER BOOST - Professor excellence
    }
    
    // ===== END EXCLUSIVE SIGNALS =====
    
    // Bench & rotation signals
    if (behavioralSignals.benchMaster && metrics.activity > 0.5) {
        scores['SLOT'] = (scores['SLOT'] || 0) * 2.0;  // 100% boost - Optimizer with perfect rotation
        scores['ANCELOTTI'] = (scores['ANCELOTTI'] || 0) * 1.6;  // Calm conductor
    }
    
    // Performance patterns
    if (behavioralSignals.boomBust && metrics.template < 0.35) {
        scores['KLOPP'] = (scores['KLOPP'] || 0) * 2.0;  // 100% boost - heavy metal chaos
        scores['POSTECOGLOU'] = (scores['POSTECOGLOU'] || 0) * 1.7;  // All-out variance
    }
    if (behavioralSignals.consistent && metrics.template > 0.55) {
        scores['MOYES'] = (scores['MOYES'] || 0) * 1.9;  // Reliable consistency
        scores['ARTETA'] = (scores['ARTETA'] || 0) * 1.6;  // Process-driven stability
    }
    
    // NEW: Captain choice patterns reveal decision-making personality
    // These are STRONG signals - captain choices show risk tolerance and decision-making
    if (captainPattern.differential && metrics.template < 0.30) {
        scores['POSTECOGLOU'] = (scores['POSTECOGLOU'] || 0) * 2.5;  // 150% boost - TRUE maverick with differential captains
        scores['WENGER'] = (scores['WENGER'] || 0) * 2.0;  // 100% boost - Professor finding hidden captaincy gems
    }
    if (captainPattern.loyalty && metrics.leadership > 0.5) {
        scores['AMORIM'] = (scores['AMORIM'] || 0) * 2.0;  // 100% boost - Stubborn loyalty paying off
        scores['FERGUSON'] = (scores['FERGUSON'] || 0) * 1.7;  // Backing winners consistently
    }
    if (captainPattern.chaser && metrics.leadership < 0.35) {
        scores['PEP'] = (scores['PEP'] || 0) * 2.3;  // 130% boost - Overthinking captaincy = classic Pep
        scores['TENHAG'] = (scores['TENHAG'] || 0) * 1.7;  // Constant changes, mixed results
        scores['MOYES'] = (scores['MOYES'] || 0) * 1.5;  // Reactive decisions
    }
    if (captainPattern.safePicker && metrics.template > 0.60) {
        scores['ARTETA'] = (scores['ARTETA'] || 0) * 1.8;  // Following the process
        scores['MOYES'] = (scores['MOYES'] || 0) * 1.6;  // Reliable and safe
    }
    
    // NEW: Transfer timing patterns reveal planning vs reactive behavior
    if (behavioralSignals.panicBuyer) {
        scores['REDKNAPP'] = (scores['REDKNAPP'] || 0) * 2.0;  // Wheeler-dealer panic moves
        scores['TENHAG'] = (scores['TENHAG'] || 0) * 1.8;  // Last-minute panic decisions
        scores['MOURINHO'] = (scores['MOURINHO'] || 0) * 1.7;  // Reactive tactical changes
    }
    if (behavioralSignals.deadlineDayScrambler) {
        scores['MOYES'] = (scores['MOYES'] || 0) * 1.8;  // Deadline day is his specialty
        scores['TENHAG'] = (scores['TENHAG'] || 0) * 1.6;  // Scrambling for solutions
        scores['PEP'] = (scores['PEP'] || 0) * 1.5;  // Overthinking until deadline
    }
    if (behavioralSignals.earlyPlanner) {
        scores['EMERY'] = (scores['EMERY'] || 0) * 2.2;  // 120% boost - Methodical strategic planning
        scores['ARTETA'] = (scores['ARTETA'] || 0) * 2.0;  // Process-driven early decisions
        scores['SLOT'] = (scores['SLOT'] || 0) * 1.8;  // Systematic optimizer
        scores['ANCELOTTI'] = (scores['ANCELOTTI'] || 0) * 1.6;  // Calm measured planning
    }
    if (behavioralSignals.kneeJerker) {
        scores['KLOPP'] = (scores['KLOPP'] || 0) * 2.3;  // 130% boost - Heavy metal reactive play!
        scores['POSTECOGLOU'] = (scores['POSTECOGLOU'] || 0) * 2.1;  // All-out attack on early form
        scores['REDKNAPP'] = (scores['REDKNAPP'] || 0) * 1.8;  // Wheeling dealing on early trends
    }
    if (behavioralSignals.lateNightReactor) {
        scores['TENHAG'] = (scores['TENHAG'] || 0) * 1.7;  // Emotional reactive decisions
        scores['KLOPP'] = (scores['KLOPP'] || 0) * 1.5;  // Heavy metal intensity (all hours)
        scores['MOURINHO'] = (scores['MOURINHO'] || 0) * 1.5;  // Mind games at midnight
    }
    
    // FIXED: Extreme metric boosts for clear behavioral patterns
    if (metrics.overthink > 0.75 && behavioralSignals.rotationPain) {  // Extreme bench regret + quality squad
        scores['PEP'] = (scores['PEP'] || 0) * 1.5;  // Additional 50% for extreme rotation pain
    }
    if (metrics.activity > 0.85 && behavioralSignals.constantTinkerer) {  // Extreme activity + constant changes
        scores['TENHAG'] = (scores['TENHAG'] || 0) * 1.6;  // Additional boost for extreme rebuilding
        scores['POSTECOGLOU'] = (scores['POSTECOGLOU'] || 0) * 1.4;  // All-out aggressive play
    }
    if (metrics.chaos > 0.6) {  // Extreme hit-taking (18+ hits)
        scores['REDKNAPP'] = (scores['REDKNAPP'] || 0) * 1.7;  // Clear wheeler-dealer signal
    }
    if (metrics.template < 0.20) {  // Ultra-contrarian (< 20% template)
        scores['WENGER'] = (scores['WENGER'] || 0) * 2.2;  // 120% boost - Professor finding gems
        scores['KLOPP'] = (scores['KLOPP'] || 0) * 1.9;  // 90% boost - Heavy metal differentials
    }
    if (metrics.template < 0.25 && metrics.template >= 0.20) {  // Pure contrarian (20-25% template)
        scores['WENGER'] = (scores['WENGER'] || 0) * 1.7;  // Professor finding gems
        scores['KLOPP'] = (scores['KLOPP'] || 0) * 1.5;  // Heavy metal differentials
    }
    if (metrics.leadership > 0.85) {  // Elite captaincy (85%+ success)
        scores['FERGUSON'] = (scores['FERGUSON'] || 0) * 2.0;  // The GOAT
        scores['SLOT'] = (scores['SLOT'] || 0) * 1.6;  // Optimizer
    }
    if (metrics.template > 0.8 && metrics.chaos < 0.08) {  // Pure template (80%+), no hits
        scores['MOYES'] = (scores['MOYES'] || 0) * 1.9;  // The ultimate reliable
        scores['ARTETA'] = (scores['ARTETA'] || 0) * 1.6;  // Process follower
    }

    // IMPROVED: Apply stronger eligibility filters (hard gates) to create clearer archetypes
    const currentRankForGates = history.current[history.current.length - 1]?.overall_rank ?? 9999999;
    const eligiblePersonas = Object.entries(scores).filter(([key]) => {
        switch (key) {
            case 'FERGUSON': // The GOAT - Top 10k auto-qualifies, otherwise needs excellence
                return currentRankForGates <= 10000 || (metrics.efficiency > 0.65 && metrics.leadership > 0.75 && currentRankForGates <= 50000);
            
            case 'SLOT': // Elite optimizer - Top 150k qualifies, or strong efficiency
                return currentRankForGates <= 150000 || metrics.efficiency > 0.70;
            
            case 'EMERY': // Methodical strategist - Top 300k or strong planning
                return currentRankForGates <= 300000 || behavioralSignals.earlyPlanner;
            
            case 'REDKNAPP': // Wheeler-Dealer MUST have high activity and hits
                return metrics.chaos > 0.35 && metrics.activity > 0.5;
            
            case 'MOYES': // The Reliable requires true stability (low chaos/activity)
                return metrics.chaos < 0.12 && metrics.activity < 0.45 && metrics.template > 0.5;
            
            case 'KLOPP': // Heavy Metal MUST be anti-template
                return metrics.template < 0.55;
            
            case 'POSTECOGLOU': // All-Outer requires pure differential play + aggression
                return metrics.template < 0.45 && metrics.activity > 0.45;
            
            case 'PEP': // Bald Genius MUST have significant bench regret AND not be a perfect optimizer
                return metrics.overthink > 0.70 && metrics.efficiency < 0.95;  // FIXED: Tightened from 0.55 to 0.70 (10.5+ pts/GW), added efficiency cap
            
            case 'WENGER': // Professor requires anti-template + very low hits
                return metrics.template < 0.5 && metrics.chaos < 0.15;
            
            case 'ARTETA': // Process Manager requires strong template following
                return metrics.template > 0.65 && metrics.efficiency > 0.5;
            
            case 'MOURINHO': // Special One requires defensive discipline (low chaos, thrifty)
                return metrics.chaos < 0.15 && metrics.thrift > 0.35;
            
            case 'SIMEONE': // Warrior requires grit (very low chaos, very thrifty)
                return metrics.chaos < 0.12 && metrics.thrift > 0.45;
            
            case 'AMORIM': // Stubborn One - high efficiency + patient + low activity
                // The defining trait is stubbornness (few moves, long holds)
                return metrics.efficiency > 0.75 && behavioralSignals.longTermBacker && metrics.activity < 0.50;
            
            case 'SLOT': // Optimizer requires efficiency + leadership excellence
                return metrics.efficiency > 0.75 && metrics.leadership > 0.65;  // FIXED: Tightened efficiency from 0.65 to 0.75
            
            case 'EMERY': // Methodical requires high efficiency + low chaos + disciplined
                return metrics.efficiency > 0.70 && metrics.chaos < 0.15 && behavioralSignals.disciplined;  // FIXED: Requires discipline signal
            
            case 'TENHAG': // Rebuilder requires very high tinkering activity
                return metrics.activity > 0.65;
            
            // Flexible personas with moderate gates
            case 'ANCELOTTI': // Calm Conductor - balanced, not too chaotic
                return metrics.chaos < 0.3 && metrics.leadership > 0.5;
            
            case 'MARESCA': // System Builder - moderate activity, some rotation
                return metrics.activity > 0.35;
            
            default:
                return true;
        }
    });

    // IMPROVED: Add deal-breaker logic - certain metric patterns make personas impossible
    const filteredPersonas = eligiblePersonas.filter(([key]) => {
        // High template followers CANNOT be differential hunters
        if (metrics.template > 0.7 && ['WENGER', 'KLOPP', 'POSTECOGLOU'].includes(key)) {
            return false;
        }
        
        // Very low chaos players CANNOT be hit specialists
        if (metrics.chaos < 0.1 && ['REDKNAPP', 'TENHAG'].includes(key)) {
            return false;
        }
        
        // Very low overthink players CANNOT be Pep (needs bench regret)
        if (metrics.overthink < 0.3 && key === 'PEP') {
            return false;
        }
        
        // Very low activity players CANNOT be active tinkerers
        if (metrics.activity < 0.25 && ['REDKNAPP', 'TENHAG', 'POSTECOGLOU', 'MARESCA'].includes(key)) {
            return false;
        }
        
        // Anti-template players CANNOT be template followers
        if (metrics.template < 0.4 && ['MOYES', 'ARTETA', 'SIMEONE'].includes(key)) {
            return false;
        }
        
        return true;
    });

    // If no personas pass both eligibility and deal-breakers, use all personas (rare edge case)
    // This ensures every user gets a persona, but prioritizes those meeting criteria
    const validPersonas = filteredPersonas.length > 0 ? filteredPersonas : Object.entries(scores);

    // IMPROVED: Multi-dimensional selection with intelligent tie-breaking
    // Sort by score to find top candidates
    const sortedPersonas = validPersonas.sort((a, b) => b[1] - a[1]);
    const topScore = sortedPersonas[0][1];
    
    // Find all personas within 10% of top score (competitive range)
    // TIGHTENED: Changed from 0.85 to 0.90 to be more selective
    const competitiveThreshold = topScore * 0.90;
    const competitivePersonas = sortedPersonas.filter(([, score]) => score >= competitiveThreshold);
    
    console.log('\n🎯 PERSONA SELECTION DEBUG:');
    console.log(`   Top Score: ${topScore.toFixed(2)}`);
    console.log(`   Competitive Personas (within 15% of top):`);
    competitivePersonas.forEach(([key, score]) => {
        const signals = [];
        if (key === 'AMORIM' && behavioralSignals.longTermBacker) signals.push('longTermBacker');
        if (key === 'WENGER' && metrics.template < 0.20) signals.push('ultraContrarian');
        if (key === 'KLOPP' && behavioralSignals.boomBust) signals.push('boomBust');
        if (key === 'TENHAG' && behavioralSignals.constantTinkerer) signals.push('constantTinkerer');
        if (key === 'PEP' && behavioralSignals.rotationPain) signals.push('rotationPain');
        
        console.log(`      ${key}: ${score.toFixed(2)} ${signals.length > 0 ? `[${signals.join(', ')}]` : ''}`);
    });
    
    // VARIABILITY: If multiple personas are competitive, use behavioral signals & secondary factors to differentiate
    let selectedPersona = competitivePersonas[0][0];
    
    if (competitivePersonas.length > 1) {
        // Count strong behavioral matches for each competitive persona
        const personaMatches = competitivePersonas.map(([key]) => {
            let matchStrength = 0;
            
            // Award points for strong behavioral signals (not just presence, but strength)
            if (key === 'TENHAG' && behavioralSignals.constantTinkerer && metrics.activity > 0.75) matchStrength += 3;
            if (key === 'REDKNAPP' && behavioralSignals.hitAddict && metrics.chaos > 0.4) matchStrength += 3;
            if (key === 'WENGER' && metrics.template < 0.20 && behavioralSignals.disciplined) matchStrength += 3;
            if (key === 'KLOPP' && behavioralSignals.boomBust && metrics.template < 0.30) matchStrength += 3;
            if (key === 'PEP' && behavioralSignals.rotationPain && metrics.overthink > 0.70) matchStrength += 3;
            if (key === 'AMORIM' && behavioralSignals.longTermBacker && metrics.efficiency > 0.85) matchStrength += 3;
            if (key === 'POSTECOGLOU' && behavioralSignals.earlyAggression && metrics.template < 0.35) matchStrength += 3;
            if (key === 'EMERY' && behavioralSignals.disciplined && metrics.efficiency > 0.75) matchStrength += 3;
            if (key === 'SLOT' && behavioralSignals.benchMaster && metrics.leadership > 0.65) matchStrength += 3;
            if (key === 'MOYES' && behavioralSignals.consistent && metrics.template > 0.60) matchStrength += 3;
            
            // Award points for moderate signals
            if (key === 'MARESCA' && behavioralSignals.constantTinkerer && metrics.activity > 0.45) matchStrength += 2;
            if (key === 'ANCELOTTI' && behavioralSignals.benchMaster && metrics.chaos < 0.20) matchStrength += 2;
            if (key === 'ARTETA' && metrics.template > 0.65 && metrics.efficiency > 0.60) matchStrength += 2;
            if (key === 'MOURINHO' && metrics.chaos < 0.10 && metrics.thrift > 0.40) matchStrength += 2;
            
            // UNIQUENESS BOOST: Prefer personas that are more distinctive
            // If a persona has unique combination of traits, boost it
            if (key === 'TENHAG' && metrics.activity > 0.80) matchStrength += 2; // Extreme activity is unique
            if (key === 'REDKNAPP' && metrics.chaos > 0.50) matchStrength += 2; // High chaos is unique
            if (key === 'WENGER' && metrics.template < 0.22) matchStrength += 2; // Ultra-contrarian is unique
            if (key === 'PEP' && metrics.overthink > 0.75) matchStrength += 2; // Extreme rotation pain is unique
            
            return { key, matchStrength };
        });
        
        // Sort by match strength, then by score
        personaMatches.sort((a, b) => {
            if (b.matchStrength !== a.matchStrength) return b.matchStrength - a.matchStrength;
            const scoreA = competitivePersonas.find(([k]) => k === a.key)?.[1] || 0;
            const scoreB = competitivePersonas.find(([k]) => k === b.key)?.[1] || 0;
            return scoreB - scoreA;
        });
        
        console.log(`\n   Match Strengths:`);
        personaMatches.forEach(({ key, matchStrength }) => {
            console.log(`      ${key}: ${matchStrength} behavioral matches`);
        });
        
        // If we have a clear winner based on behavioral matches, use it
        if (personaMatches[0].matchStrength > personaMatches[1].matchStrength) {
            selectedPersona = personaMatches[0].key;
            console.log(`\n   ✅ Selected: ${selectedPersona} (strongest behavioral match)`);
        } else {
            // Still tied - use the one with highest raw score
            selectedPersona = competitivePersonas[0][0];
            console.log(`\n   ✅ Selected: ${selectedPersona} (highest score, tie on behaviors)`);
        }
    } else {
        console.log(`\n   ✅ Selected: ${selectedPersona} (clear winner)`);
    }
    
    const personaData = PERSONA_MAP[selectedPersona];
    
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
        imageUrl: getPersonaImagePath(selectedPersona),
        memorableMoments: memorableMoments.slice(0, 3) // Top 3 moments
    };
}
