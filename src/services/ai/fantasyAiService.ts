// Mock AI service — the central "generateFantasyResponse" router.
// This is the single place the chat experience asks for an analysis. It maps
// a user intent to the right fantasy sub-service and returns ChatMessages.

import type {
  ChatAttachment,
  ChatMessage,
  PlayerRecommendation,
  RosterPlayer,
  UploadedRosterAnalysis,
} from '@/types';
import { mockSleepers, mockTradeAnalysis, mockUserTeam, mockWeeklyMatchup } from '@/mock/data';
import { analyzeRosterScreenshot } from '@/services/fantasy/rosterAnalysisService';
import { analyzeTrade, buildBetterTrade } from '@/services/fantasy/tradeService';
import { analyzeWeeklyMatchup } from '@/services/fantasy/matchupService';
import { findSleeperCandidates } from '@/services/fantasy/sleeperService';
import { uid } from '@/services/utils/uid';

export type FantasyIntent =
  | 'start-sit'
  | 'waiver-targets'
  | 'trade-advice'
  | 'weekly-matchup'
  | 'sleepers'
  | 'optimize-lineup'
  | 'find-upgrades'
  | 'trade-ideas'
  | 'build-better-trade'
  | 'yahoo-connected'
  | 'general';

const intentKeywords: Record<FantasyIntent, string[]> = {
  'start-sit': ['start', 'sit', 'lineup', 'who should i'],
  'waiver-targets': ['waiver', 'free agent', 'pickup', 'stream'],
  'trade-advice': ['trade', 'deal', 'offer'],
  'weekly-matchup': ['matchup', 'opponent', 'this week', 'win probability'],
  sleepers: ['sleeper', 'sleepers', 'upside', 'deep'],
  'optimize-lineup': ['optimize', 'best lineup', 'set lineup'],
  'find-upgrades': ['upgrade', 'improve', 'replace'],
  'trade-ideas': ['trade ideas', 'trade target', 'build a trade'],
  'build-better-trade': ['build better', 'better trade', 'counter'],
  'yahoo-connected': ['yahoo', 'connected'],
  general: [],
};

export function detectIntent(text: string): FantasyIntent {
  const lower = text.toLowerCase();
  for (const intent of Object.keys(intentKeywords) as FantasyIntent[]) {
    if (intent === 'general') continue;
    if (intentKeywords[intent].some((kw) => lower.includes(kw))) return intent;
  }
  return 'general';
}

/**
 * // TODO-INTEGRATION: AI_MODEL
 *
 * FUTURE IMPLEMENTATION:
 * 1. Send the user's message + roster/league context to an LLM
 *    (OpenAI, Anthropic, or a hosted model) with a fantasy-football system
 *    prompt and tool/function definitions for each fantasy sub-service.
 * 2. Let the model decide which analysis cards to surface, or use a
 *    deterministic router here and have the model only write the prose.
 * 3. Stream the model's text response token-by-token into a user message.
 *
 * INPUT:  user text, optional attachments, chat history, league context.
 * OUTPUT: ChatMessage[] — one or more structured assistant messages.
 * MOCK REPLACEMENT: generateFantasyResponse().
 */
export async function generateFantasyResponse(
  text: string,
  attachments?: ChatAttachment[],
): Promise<ChatMessage[]> {
  const intent = detectIntent(text);

  // Roster screenshot path — image present.
  if (attachments && attachments.length > 0) {
    const analysis = await analyzeRosterScreenshot(attachments[0]);
    return [
      msg('assistant', "I've analyzed your roster screenshot. Here's what I found."),
      rosterAnalysisMessage(analysis),
    ];
  }

  switch (intent) {
    case 'start-sit':
    case 'optimize-lineup':
      return [msg('assistant', 'Here\'s your optimal lineup for this week.'), lineupMessage()];

    case 'waiver-targets':
    case 'find-upgrades': {
      const sleepers = await findSleeperCandidates();
      return [
        msg('assistant', 'Here are the top waiver targets to consider this week.'),
        sleepersMessage(sleepers),
      ];
    }

    case 'trade-advice':
    case 'trade-ideas': {
      const trade = await analyzeTrade();
      return [
        msg('assistant', 'I evaluated a trade for you. Here\'s the breakdown.'),
        tradeMessage(trade),
      ];
    }

    case 'build-better-trade': {
      const trade = await buildBetterTrade();
      return [
        msg('assistant', 'Here\'s a stronger trade structure that tilts value your way.'),
        tradeMessage(trade),
      ];
    }

    case 'weekly-matchup': {
      const matchup = await analyzeWeeklyMatchup();
      return [
        msg('assistant', "Here's your weekly matchup analysis and recommended moves."),
        matchupMessage(matchup),
      ];
    }

    case 'sleepers': {
      const sleepers = await findSleeperCandidates();
      return [
        msg('assistant', 'These are my top sleeper picks with AI upside projections.'),
        sleepersMessage(sleepers),
      ];
    }

    case 'yahoo-connected':
      return [
        msg('assistant', 'I found a few things worth looking at this week.'),
        sleepersMessage(mockSleepers),
        matchupMessage(mockWeeklyMatchup),
      ];

    default:
      return [
        msg(
          'assistant',
          'I can help with start/sit, waiver targets, trade advice, sleeper picks, and weekly matchups. Upload a roster screenshot or ask me a question to get started.',
        ),
      ];
  }
}

/**
 * // TODO-INTEGRATION: AI_MODEL
 * Dedicated entry for the "Yahoo connected" flow — returns a rich set of
 * cards to demonstrate the post-connection experience.
 */
export async function generatePostConnectionResponse(): Promise<ChatMessage[]> {
  return [
    msg('assistant', 'I found a few things worth looking at this week.'),
    sleepersMessage(mockSleepers),
    tradeMessage(mockTradeAnalysis),
    matchupMessage(mockWeeklyMatchup),
  ];
}

// ---- helpers ----

function msg(kind: ChatMessage['kind'], text: string): ChatMessage {
  return { id: uid(), kind, text, createdAt: Date.now() };
}

function rosterAnalysisMessage(analysis: UploadedRosterAnalysis): ChatMessage {
  return { id: uid(), kind: 'roster-analysis', rosterAnalysis: analysis, createdAt: Date.now() };
}

function sleepersMessage(sleepers: ChatMessage['sleepers']): ChatMessage {
  return { id: uid(), kind: 'sleeper-recommendation', sleepers, createdAt: Date.now() };
}

function tradeMessage(tradeAnalysis: ChatMessage['tradeAnalysis']): ChatMessage {
  return { id: uid(), kind: 'trade-analysis', tradeAnalysis, createdAt: Date.now() };
}

function matchupMessage(matchup: ChatMessage['matchup']): ChatMessage {
  return { id: uid(), kind: 'matchup-analysis', matchup, createdAt: Date.now() };
}

function lineupMessage(): ChatMessage {
  const starters = mockUserTeam.roster.players.filter((p) => p.slot !== 'BENCH');
  const bench = mockUserTeam.roster.players.filter((p) => p.slot === 'BENCH');
  const expectedTotal = starters.reduce((sum, p) => sum + p.projection.projectedPoints, 0);
  const recommendations: PlayerRecommendation[] = starters.map((p) => ({
    player: p,
    projection: p.projection,
    status: p.status ?? 'Start',
    reason: p.recommendation ?? 'Solid start this week.',
  }));
  return {
    id: uid(),
    kind: 'lineup-suggestion',
    lineupSuggestion: { starters, bench, expectedTotal, notes: 'Optimized for floor + ceiling balance.' },
    playerRecommendations: recommendations,
    createdAt: Date.now(),
  };
}

// Re-export for components that need a typed RosterPlayer reference.
export type { RosterPlayer };
