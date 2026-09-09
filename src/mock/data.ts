import type {
  FantasyLeague,
  FantasyTeam,
  NFLTeam,
  Player,
  PlayerProjection,
  RosterPlayer,
  SleeperRecommendation,
  TradeAnalysis,
  TradeProposal,
  WeeklyMatchup,
} from '@/types';

// Centralized mock data. The service layer (services/fantasy/*.ts) reads from
// these so the UI never imports raw mock objects directly.

export const mockLeague = {
  id: 'league-1',
  name: 'Example League',
  scoring: {
    format: 'Half-PPR',
    passingTdPoints: 4,
    passingYardsPerPoint: 25,
    receptionPoints: 0.5,
    rushingTdPoints: 6,
    rushingYardsPerPoint: 10,
    fumblePoints: -2,
    interceptionPoints: -2,
    teams: 12,
  },
  currentWeek: 3,
} as const;

const mkPlayer = (
  id: string,
  name: string,
  position: Player['position'],
  nflTeam: NFLTeam,
  opponent: string,
  status: Player['status'] = 'Start',
  injuryTag?: string,
): Player => ({ id, name, position, nflTeam, opponent, status, injuryTag });

const mkProj = (
  playerId: string,
  projectedPoints: number,
  ceiling: number,
  floor: number,
  confidence = 0.72,
): PlayerProjection => ({ playerId, projectedPoints, ceiling, floor, confidence });

const mkRosterPlayer = (
  slot: RosterPlayer['slot'],
  player: Player,
  projection: PlayerProjection,
  recommendation?: string,
): RosterPlayer => ({ ...player, slot, projection, recommendation });

// ---- Players ----

export const mockPlayers: Player[] = [
  mkPlayer('p1', 'Christian McCaffrey', 'RB', 'SF', 'vs ARI', 'Strong Start'),
  mkPlayer('p2', 'Tyreek Hill', 'WR', 'MIA', 'vs NE', 'Strong Start'),
  mkPlayer('p3', 'Patrick Mahomes', 'QB', 'KC', 'vs LAC', 'Start'),
  mkPlayer('p4', 'Travis Kelce', 'TE', 'KC', 'vs LAC', 'Start'),
  mkPlayer('p5', 'Stefon Diggs', 'WR', 'HOU', 'vs MIN', 'Consider Alternatives', 'Questionable'),
  mkPlayer('p6', 'Saquon Barkley', 'RB', 'PHI', 'vs NO', 'Start'),
  mkPlayer('p7', 'Garrett Wilson', 'WR', 'NYJ', 'vs DEN', 'Consider Alternatives'),
  mkPlayer('p8', 'Drake London', 'WR', 'ATL', 'vs DET', 'Bench'),
  mkPlayer('p9', 'Jaylen Warren', 'RB', 'PIT', 'vs LVR', 'Sleeper'),
  mkPlayer('p10', 'Tucker Kraft', 'TE', 'GB', 'vs TEN', 'Sleeper'),
  mkPlayer('p11', 'Brandon Aubrey', 'K', 'DAL', 'vs BAL', 'Start'),
  mkPlayer('p12', 'Ravens D/ST', 'D/ST', 'BAL', 'vs DAL', 'Start'),
];

const projs: Record<string, PlayerProjection> = {
  p1: mkProj('p1', 24.8, 34.2, 12.5, 0.85),
  p2: mkProj('p2', 22.1, 31.0, 9.0, 0.8),
  p3: mkProj('p3', 21.4, 30.5, 11.0, 0.78),
  p4: mkProj('p4', 14.2, 22.0, 6.0, 0.74),
  p5: mkProj('p5', 11.6, 20.0, 3.0, 0.55),
  p6: mkProj('p6', 17.9, 27.0, 8.5, 0.76),
  p7: mkProj('p7', 10.1, 18.5, 4.0, 0.6),
  p8: mkProj('p8', 7.4, 15.0, 2.0, 0.5),
  p9: mkProj('p9', 8.2, 19.0, 2.5, 0.62),
  p10: mkProj('p10', 6.8, 14.0, 1.5, 0.58),
  p11: mkProj('p11', 9.0, 14.0, 4.0, 0.7),
  p12: mkProj('p12', 8.5, 16.0, 1.0, 0.68),
};

// ---- User roster ----

export const mockUserRoster: RosterPlayer[] = [
  mkRosterPlayer('QB', mockPlayers[2], projs.p3, 'Matchup vs LAC is favorable; start with confidence.'),
  mkRosterPlayer('RB1', mockPlayers[0], projs.p1, 'Elite volume and red-zone role.'),
  mkRosterPlayer('RB2', mockPlayers[5], projs.p6, 'Solid floor, big-play upside.'),
  mkRosterPlayer('WR1', mockPlayers[1], projs.p2, 'Top-5 WR play this week.'),
  mkRosterPlayer('WR2', mockPlayers[6], projs.p7, 'Tough matchup — consider streaming.'),
  mkRosterPlayer('TE', mockPlayers[3], projs.p4, 'Safe floor at a thin position.'),
  mkRosterPlayer('FLEX', mockPlayers[4], projs.p5, 'Monitor injury status before kickoff.'),
  mkRosterPlayer('D/ST', mockPlayers[11], projs.p12),
  mkRosterPlayer('K', mockPlayers[10], projs.p11),
  mkRosterPlayer('BENCH', mockPlayers[7], projs.p8),
  mkRosterPlayer('BENCH', mockPlayers[8], projs.p9),
  mkRosterPlayer('BENCH', mockPlayers[9], projs.p10),
];

export const mockUserTeam: FantasyTeam = {
  id: 'team-user',
  name: 'Gridiron AI',
  managerName: 'You',
  leagueId: mockLeague.id,
  record: { wins: 2, losses: 0, ties: 0 },
  projectedScore: 126.8,
  roster: { teamId: 'team-user', players: mockUserRoster },
};

const oppRoster: RosterPlayer[] = [
  mkRosterPlayer('QB', mockPlayers[2], projs.p3),
  mkRosterPlayer('RB1', mockPlayers[5], projs.p6),
  mkRosterPlayer('RB2', mockPlayers[8], projs.p9),
  mkRosterPlayer('WR1', mockPlayers[1], projs.p2),
  mkRosterPlayer('WR2', mockPlayers[4], projs.p5),
  mkRosterPlayer('TE', mockPlayers[3], projs.p4),
  mkRosterPlayer('FLEX', mockPlayers[7], projs.p8),
  mkRosterPlayer('D/ST', mockPlayers[11], projs.p12),
  mkRosterPlayer('K', mockPlayers[10], projs.p11),
];

const oppTeam: FantasyTeam = {
  id: 'team-opp',
  name: 'Touchdown Titans',
  managerName: 'Rival Manager',
  leagueId: mockLeague.id,
  record: { wins: 1, losses: 1, ties: 0 },
  projectedScore: 118.2,
  roster: { teamId: 'team-opp', players: oppRoster },
};

const leagueTeam3: FantasyTeam = {
  id: 'team-3',
  name: 'Skyline Squad',
  managerName: 'Jordan',
  leagueId: mockLeague.id,
  record: { wins: 2, losses: 0, ties: 0 },
  projectedScore: 121.4,
  roster: { teamId: 'team-3', players: oppRoster.slice(0, 9) },
};

const leagueTeam4: FantasyTeam = {
  id: 'team-4',
  name: 'Red Zone Raiders',
  managerName: 'Alex',
  leagueId: mockLeague.id,
  record: { wins: 0, losses: 2, ties: 0 },
  projectedScore: 92.3,
  roster: { teamId: 'team-4', players: oppRoster.slice(0, 9) },
};

export const mockLeagueFull: FantasyLeague = {
  ...mockLeague,
  teams: [mockUserTeam, oppTeam, leagueTeam3, leagueTeam4],
};

// ---- Weekly matchup ----

export const mockWeeklyMatchup: WeeklyMatchup = {
  week: 3,
  userTeamId: mockUserTeam.id,
  userTeamName: mockUserTeam.name,
  userProjected: 126.8,
  opponentTeamId: oppTeam.id,
  opponentTeamName: oppTeam.name,
  opponentProjected: 118.2,
  winProbability: 0.64,
  bestLineupMove: 'Move Jaylen Warren into FLEX over Stefon Diggs (injury risk).',
  expectedImprovement: 3.4,
  riskyMove: 'Start Drake London over Garrett Wilson for upside against a weak DET secondary.',
  observations: [
    'You hold an 8.6-point edge on projected total.',
    'Your opponent has higher variance at WR — outcome may swing on Tyreek Hill vs NE.',
    'Benching Diggs eliminates the largest downside scenario for your lineup.',
  ],
};

// ---- Sleepers ----

export const mockSleepers: SleeperRecommendation[] = [
  {
    player: mkPlayer('s1', 'Jaylen Warren', 'RB', 'PIT', 'vs LVR', 'Sleeper'),
    normalProjection: 8.2,
    aiUpside: 19.0,
    confidence: 0.62,
    reasoning:
      'Increased snap share over the last two weeks and a favorable matchup against a LVR run defense ranked 28th in EPA/play. Lead-back workload is trending up.',
    recommendationType: 'Free Agent Target',
  },
  {
    player: mkPlayer('s2', 'Tucker Kraft', 'TE', 'GB', 'vs TEN', 'Sleeper'),
    normalProjection: 6.8,
    aiUpside: 14.0,
    confidence: 0.58,
    reasoning:
      'TEN allows the 5th-most points to TEs. Kraft has run a route on 84% of dropbacks since week 2 and saw 3 red-zone targets last game.',
    recommendationType: 'Deep Sleeper',
  },
  {
    player: mkPlayer('s3', 'Garrett Wilson', 'WR', 'NYJ', 'vs DEN', 'Trade Candidate'),
    normalProjection: 10.1,
    aiUpside: 18.5,
    confidence: 0.55,
    reasoning:
      'Volume is elite (9 targets/game) but efficiency is suppressed by QB play. A buy-low window exists before a soft DEN secondary in Week 4.',
    recommendationType: 'Buy Low',
  },
];

// ---- Trade ----

export const mockTradeProposal: TradeProposal = {
  id: 'trade-1',
  youGive: {
    players: [mkPlayer('p7', 'Garrett Wilson', 'WR', 'NYJ', 'vs DEN', 'Consider Alternatives')],
    totalProjected: 10.1,
    totalCeiling: 18.5,
  },
  youReceive: {
    players: [mkPlayer('p9', 'Jaylen Warren', 'RB', 'PIT', 'vs LVR', 'Sleeper')],
    totalProjected: 8.2,
    totalCeiling: 19.0,
  },
};

export const mockTradeAnalysis: TradeAnalysis = {
  proposal: mockTradeProposal,
  fairnessScore: 78,
  expectedWeeklyImprovement: 2.1,
  opponentExpectedValue: 1.9,
  likelihoodAccepted: 0.55,
  recommendation: 'Fair Trade',
  explanation:
    'You give up a higher-floor WR for a RB with rising opportunity. Both sides fill a positional need. The deal is roughly even on season-long value but tilts slightly toward you on weekly upside because Warren\'s role is expanding.',
};

export const mockTradeProposal2: TradeProposal = {
  id: 'trade-2',
  youGive: {
    players: [mkPlayer('p8', 'Drake London', 'WR', 'ATL', 'vs DET', 'Bench')],
    totalProjected: 7.4,
    totalCeiling: 15.0,
  },
  youReceive: {
    players: [mkPlayer('s2', 'Tucker Kraft', 'TE', 'GB', 'vs TEN', 'Sleeper')],
    totalProjected: 6.8,
    totalCeiling: 14.0,
  },
};

export const mockTradeAnalysis2: TradeAnalysis = {
  proposal: mockTradeProposal2,
  fairnessScore: 71,
  expectedWeeklyImprovement: 1.4,
  opponentExpectedValue: 0.9,
  likelihoodAccepted: 0.48,
  recommendation: 'Slightly Favor You',
  explanation:
    'Swapping a bench WR for a TE with a plus matchup is a low-risk upside play. Your opponent gets a higher-ceiling WR for their bench. Slight edge to you because Kraft addresses a thin TE position.',
};
