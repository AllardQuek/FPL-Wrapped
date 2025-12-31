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
    managerInfo: ManagerInfo;
    history: ManagerHistory;
    transfers: Transfer[];
    picksByGameweek: Map<number, GameWeekPicks>;
    liveByGameweek: Map<number, LiveGameWeek>;
    finishedGameweeks: number[];
}
