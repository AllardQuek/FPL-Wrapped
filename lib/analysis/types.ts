import {
    FPLBootstrap,
    ManagerInfo,
    ManagerHistory,
    Transfer,
    GameWeekPicks,
    LiveGameWeek,
} from '../types';

export interface ManagerData {
    bootstrap: FPLBootstrap;
    totalPlayers: number;
    managerInfo: ManagerInfo;
    history: ManagerHistory;
    transfers: Transfer[];
    picksByGameweek: Map<number, GameWeekPicks>;
    liveByGameweek: Map<number, LiveGameWeek>;
    finishedGameweeks: number[];
}

export interface TransferTiming {
    panicTransfers: number;
    deadlineDayTransfers: number;
    midWeekTransfers: number;
    earlyStrategicTransfers: number;
    kneeJerkTransfers: number;
    avgHoursBeforeDeadline: number;
    avgLocalHourOfDay: number;
    lateNightTransfers: number;
    priceRiseChasers: number;
}
