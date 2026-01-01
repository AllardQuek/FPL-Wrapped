// FPL API Types

// Bootstrap-static types (general game data)
export interface FPLBootstrap {
  events: GameWeek[];
  game_settings: GameSettings;
  phases: Phase[];
  teams: Team[];
  total_players: number;
  elements: Player[];
  element_stats: ElementStat[];
  element_types: ElementType[];
}

export interface GameWeek {
  id: number;
  name: string;
  deadline_time: string;
  average_entry_score: number;
  finished: boolean;
  data_checked: boolean;
  highest_scoring_entry: number | null;
  deadline_time_epoch: number;
  deadline_time_game_offset: number;
  highest_score: number | null;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
  cup_leagues_created: boolean;
  h2h_ko_matches_created: boolean;
  chip_plays: ChipPlay[];
  most_selected: number | null;
  most_transferred_in: number | null;
  top_element: number | null;
  top_element_info: TopElementInfo | null;
  transfers_made: number;
  most_captained: number | null;
  most_vice_captained: number | null;
}

export interface ChipPlay {
  chip_name: string;
  num_played: number;
}

export interface TopElementInfo {
  id: number;
  points: number;
}

export interface GameSettings {
  league_join_private_max: number;
  league_join_public_max: number;
  league_max_size_public_classic: number;
  league_max_size_public_h2h: number;
  league_max_size_private_h2h: number;
  league_max_ko_rounds_private_h2h: number;
  league_prefix_public: string;
  league_points_h2h_win: number;
  league_points_h2h_lose: number;
  league_points_h2h_draw: number;
  league_ko_first_instead_of_random: boolean;
  cup_start_event_id: number | null;
  cup_stop_event_id: number | null;
  cup_qualifying_method: string | null;
  cup_type: string | null;
  squad_squadplay: number;
  squad_squadsize: number;
  squad_team_limit: number;
  squad_total_spend: number;
  ui_currency_multiplier: number;
  ui_use_special_shirts: boolean;
  ui_special_shirt_exclusions: number[];
  stats_form_days: number;
  sys_vice_captain_enabled: boolean;
  transfers_cap: number;
  transfers_sell_on_fee: number;
  league_h2h_tiebreak_stats: string[];
  timezone: string;
}

export interface Phase {
  id: number;
  name: string;
  start_event: number;
  stop_event: number;
}

export interface Team {
  code: number;
  draw: number;
  form: string | null;
  id: number;
  loss: number;
  name: string;
  played: number;
  points: number;
  position: number;
  short_name: string;
  strength: number;
  team_division: number | null;
  unavailable: boolean;
  win: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
  pulse_id: number;
}

export interface Player {
  chance_of_playing_next_round: number | null;
  chance_of_playing_this_round: number | null;
  code: number;
  cost_change_event: number;
  cost_change_event_fall: number;
  cost_change_start: number;
  cost_change_start_fall: number;
  dreamteam_count: number;
  element_type: number;
  ep_next: string | null;
  ep_this: string | null;
  event_points: number;
  first_name: string;
  form: string;
  id: number;
  in_dreamteam: boolean;
  news: string;
  news_added: string | null;
  now_cost: number;
  photo: string;
  points_per_game: string;
  second_name: string;
  selected_by_percent: string;
  special: boolean;
  squad_number: number | null;
  status: string;
  team: number;
  team_code: number;
  total_points: number;
  transfers_in: number;
  transfers_in_event: number;
  transfers_out: number;
  transfers_out_event: number;
  value_form: string;
  value_season: string;
  web_name: string;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  starts: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  influence_rank: number;
  influence_rank_type: number;
  creativity_rank: number;
  creativity_rank_type: number;
  threat_rank: number;
  threat_rank_type: number;
  ict_index_rank: number;
  ict_index_rank_type: number;
  corners_and_indirect_freekicks_order: number | null;
  corners_and_indirect_freekicks_text: string;
  direct_freekicks_order: number | null;
  direct_freekicks_text: string;
  penalties_order: number | null;
  penalties_text: string;
  expected_goals_per_90: number;
  saves_per_90: number;
  expected_assists_per_90: number;
  expected_goal_involvements_per_90: number;
  expected_goals_conceded_per_90: number;
  goals_conceded_per_90: number;
  now_cost_rank: number;
  now_cost_rank_type: number;
  form_rank: number;
  form_rank_type: number;
  points_per_game_rank: number;
  points_per_game_rank_type: number;
  selected_rank: number;
  selected_rank_type: number;
  starts_per_90: number;
  clean_sheets_per_90: number;
}

export interface ElementStat {
  label: string;
  name: string;
}

export interface ElementType {
  id: number;
  plural_name: string;
  plural_name_short: string;
  singular_name: string;
  singular_name_short: string;
  squad_select: number;
  squad_min_play: number;
  squad_max_play: number;
  ui_shirt_specific: boolean;
  sub_positions_locked: number[];
  element_count: number;
}

// Manager/Entry types
export interface ManagerInfo {
  id: number;
  joined_time: string;
  started_event: number;
  favourite_team: number | null;
  player_first_name: string;
  player_last_name: string;
  player_region_id: number;
  player_region_name: string;
  player_region_iso_code_short: string;
  player_region_iso_code_long: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;
  current_event: number;
  leagues: ManagerLeagues;
  name: string;
  name_change_blocked: boolean;
  kit: string | null;
  last_deadline_bank: number;
  last_deadline_value: number;
  last_deadline_total_transfers: number;
}

export interface ManagerLeagues {
  classic: League[];
  h2h: League[];
  cup: CupLeague;
  cup_matches: CupMatch[];
}

export interface League {
  id: number;
  name: string;
  short_name: string | null;
  created: string;
  closed: boolean;
  rank: number | null;
  max_entries: number | null;
  league_type: string;
  scoring: string;
  admin_entry: number | null;
  start_event: number;
  entry_can_leave: boolean;
  entry_can_admin: boolean;
  entry_can_invite: boolean;
  has_cup: boolean;
  cup_league: number | null;
  cup_qualified: boolean | null;
  entry_rank: number;
  entry_last_rank: number;
}

export interface CupLeague {
  matches: CupMatch[];
  status: CupStatus;
  cup_league: number | null;
}

export interface CupMatch {
  id: number;
  entry_1_entry: number;
  entry_1_name: string;
  entry_1_player_name: string;
  entry_1_points: number;
  entry_1_win: number;
  entry_1_draw: number;
  entry_1_loss: number;
  entry_1_total: number;
  entry_2_entry: number;
  entry_2_name: string;
  entry_2_player_name: string;
  entry_2_points: number;
  entry_2_win: number;
  entry_2_draw: number;
  entry_2_loss: number;
  entry_2_total: number;
  is_knockout: boolean;
  league: number;
  winner: number | null;
  seed_value: number | null;
  event: number;
  tiebreak: string | null;
  is_bye: boolean;
  knockout_name: string;
}

export interface CupStatus {
  qualification_event: number | null;
  qualification_numbers: number | null;
  qualification_rank: number | null;
  qualification_state: string | null;
}

// Manager history types
export interface ManagerHistory {
  current: GameWeekHistory[];
  past: PastSeasonHistory[];
  chips: ChipUsage[];
}

export interface GameWeekHistory {
  event: number;
  points: number;
  total_points: number;
  rank: number;
  rank_sort: number;
  overall_rank: number;
  bank: number;
  value: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

export interface PastSeasonHistory {
  season_name: string;
  total_points: number;
  rank: number;
}

export interface ChipUsage {
  name: string;
  time: string;
  event: number;
}

export interface ChipAnalysis {
  name: string;
  event: number;
  pointsGained: number;
  verdict: string;
  details: string;
  isExcellent: boolean;
  used: boolean;
  // Raw data for audit trail
  metadata?: {
    // Bench Boost specific
    benchPlayers?: { name: string; points: number }[];
    // Triple Captain specific
    captainName?: string;
    captainBasePoints?: number;
    // Free Hit specific
    freeHitPoints?: number;
    previousTeamPoints?: number;
    freeHitPlayers?: { name: string; points: number; multiplier: number }[];
    previousTeamPlayers?: { name: string; points: number; multiplier: number }[];
    // Wildcard specific
    gameweeksBefore?: number[];
    pointsBefore?: number[];
    avgBefore?: number;
    gameweeksAfter?: number[];
    pointsAfter?: number[];
    avgAfter?: number;
  };
}

// Transfer types
export interface Transfer {
  element_in: number;
  element_in_cost: number;
  element_out: number;
  element_out_cost: number;
  entry: number;
  event: number;
  time: string;
}

// Picks types (team selection per gameweek)
export interface GameWeekPicks {
  active_chip: string | null;
  automatic_subs: AutomaticSub[];
  entry_history: GameWeekHistory;
  picks: Pick[];
}

export interface Pick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface AutomaticSub {
  entry: number;
  element_in: number;
  element_out: number;
  event: number;
}

// Player detailed history (element-summary)
export interface PlayerSummary {
  fixtures: PlayerFixture[];
  history: PlayerGameWeekHistory[];
  history_past: PlayerPastSeason[];
}

export interface PlayerFixture {
  id: number;
  code: number;
  team_h: number;
  team_h_score: number | null;
  team_a: number;
  team_a_score: number | null;
  event: number;
  finished: boolean;
  minutes: number;
  provisional_start_time: boolean;
  kickoff_time: string;
  event_name: string;
  is_home: boolean;
  difficulty: number;
}

export interface PlayerGameWeekHistory {
  element: number;
  fixture: number;
  opponent_team: number;
  total_points: number;
  was_home: boolean;
  kickoff_time: string;
  team_h_score: number;
  team_a_score: number;
  round: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  starts: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  value: number;
  transfers_balance: number;
  selected: number;
  transfers_in: number;
  transfers_out: number;
}

export interface PlayerPastSeason {
  season_name: string;
  element_code: number;
  start_cost: number;
  end_cost: number;
  total_points: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  starts: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
}

// Live gameweek data
export interface LiveGameWeek {
  elements: LiveElement[];
}

export interface LiveElement {
  id: number;
  stats: LiveElementStats;
  explain: LiveExplain[];
}

export interface LiveElementStats {
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  starts: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  total_points: number;
  in_dreamteam: boolean;
}

export interface LiveExplain {
  fixture: number;
  stats: LiveExplainStat[];
}

export interface LiveExplainStat {
  identifier: string;
  points: number;
  value: number;
}

// Analysis types (our custom types for the wrapped experience)
export interface TransferAnalysis {
  transfer: Transfer;
  playerIn: Player;
  playerOut: Player;
  pointsGained: number; // Points from player in - points from player out after transfer
  gameweeksHeld: number;
  ownedGWRange: { start: number; end: number };
  verdict: 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible';
  isWildcard?: boolean;
  breakdown?: {
    pointsIn: number;
    pointsOut: number;
    gwRange: string;
    pointsHistory: { gw: number; in: number; out: number }[];
  };
  // Enhanced metrics
  ppgDifferential: number;      // Points per gameweek differential (normalized)
  winRate: number;              // % of weeks playerIn outscored playerOut
  hitCost: number;              // Transfer cost (0 for free, 4 for hit)
  netGainAfterHit: number;      // pointsGained - hitCost
  bestStreak: number;           // Longest consecutive weeks playerIn won
  worstStreak: number;          // Longest consecutive weeks playerOut won
}

export interface CaptaincyAnalysis {
  gameweek: number;
  captainId: number;
  captainName: string;
  captainPoints: number;
  bestPickId: number;
  bestPickName: string;
  bestPickPoints: number;
  pointsLeftOnTable: number;
  wasOptimal: boolean;
  wasSuccessful: boolean; // Captain scored 6+ points
  wasMostCaptainedGlobal: boolean;
}

export interface BenchAnalysis {
  gameweek: number;
  benchPoints: number;
  benchPlayers: { player: Player; points: number }[];
  lowestStarterPoints: number;
  missedPoints: number; // Best bench player - worst starter if bench was better
  bestBenchPick: { player: Player; points: number } | null;
  hadBenchRegret: boolean;
  errorPosition?: 'GKP' | 'DEF' | 'MID' | 'FWD'; // Position of the benched player who should have started
}

export interface ManagerPersona {
  name: string; // e.g. "Pep Guardiola"
  title: string; // e.g. "The Overthinker"
  description: string;
  spectrum: {
    trait: string;
    score: number;
    maxScore: number;
  }[];
  primaryColor: string;
  imageUrl?: string;
  traits: string[];
  emoji?: string;
  memorableMoments?: string[]; // Specific one-liner examples: "In GW8 I benched Salah and he hauled for 24 points"
}

export interface SeasonSummary {
  managerId: number;
  managerName: string;
  teamName: string;
  totalPoints: number;
  overallRank: number;

  // Transfer analysis
  totalTransfers: number;
  totalTransfersCost: number;
  netTransferPoints: number;
  bestTransfer: TransferAnalysis | null;
  worstTransfer: TransferAnalysis | null;
  transferGrade: 'A' | 'B' | 'C' | 'D' | 'F';

  // Captaincy analysis
  totalCaptaincyPoints: number;
  optimalCaptaincyPoints: number;
  captaincyPointsLost: number;
  captaincySuccessRate: number;
  bestCaptainPick: CaptaincyAnalysis | null;
  worstCaptainPick: CaptaincyAnalysis | null;
  captaincyGrade: 'A' | 'B' | 'C' | 'D' | 'F';

  // Bench analysis
  totalBenchPoints: number;
  benchRegrets: number;
  worstBenchMiss: BenchAnalysis | null;
  benchGrade: 'A' | 'B' | 'C' | 'D' | 'F';

  // Overall
  overallDecisionGrade: 'A' | 'B' | 'C' | 'D' | 'F';

  // Persona
  persona: ManagerPersona;
  templateOverlap: number;
  transferAnalyses: TransferAnalysis[];
  captaincyAnalyses: CaptaincyAnalysis[];
  benchAnalyses: BenchAnalysis[];
  chipAnalyses: ChipAnalysis[];

  // Extras
  bestGameweek: { event: number; points: number };
  worstGameweek: { event: number; points: number };
  rankProgression: { event: number; rank: number }[];
  chipsUsed: ChipUsage[];
  mvpPlayer: { player: Player; points: number } | null;
  topContributors: { player: Player; points: number; percentage: number }[];
  positionBreakdown: {
    position: 'GKP' | 'DEF' | 'MID' | 'FWD';
    points: number;
    percentage: number;
    playerCount: number;
  }[];
  allPlayers: { id: number; web_name: string; team: number }[];
}



