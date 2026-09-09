// Chat response generator — routes user intent to real data or honest
// "not connected" responses.
//
// IMPORTANT: This does NOT fabricate fantasy advice. If an analysis engine
// isn't connected, it says so clearly. Real data (player search, projections
// when available) is returned.
//
// // TODO-INTEGRATION: AI_MODEL
// When the AI model is connected, this deterministic router will be replaced
// by an LLM that calls the tool registry (toolImplementations.ts).

import type { ChatAttachment, ChatMessage } from '@/types';
import { searchPlayers } from '@/services/sleeper/playerSearch';
import { getPlayerById } from '@/services/sleeper/sleeperService';
import { getFantasyDataStatus, getPlayerFantasyProfile } from '@/services/fantasyData/fantasyDataService';
import { uid } from '@/services/utils/uid';

export type FantasyIntent =
  | 'player-lookup'
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
  'player-lookup': ['who is', 'tell me about', 'player'],
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
 * Generates a chat response. Returns real data when available, honest
 * "not connected" messages for unfinished analysis engines.
 */
export async function generateFantasyResponse(
  text: string,
  attachments?: ChatAttachment[],
): Promise<ChatMessage[]> {
  const intent = detectIntent(text);
  const dataStatus = await getFantasyDataStatus();

  // Screenshot upload — still mock analysis (no OCR/vision connected)
  if (attachments && attachments.length > 0) {
    return [
      msg('assistant', 'I received your screenshot, but the roster screenshot analysis engine (OCR/vision) is not connected yet.'),
      msg('assistant', '// TODO-INTEGRATION: ROSTER_SCREENSHOT_ANALYSIS — I can identify players by name if you type them, and I can look up real projections, rankings, and injuries once the FantasyPros data provider is configured.'),
    ];
  }

  switch (intent) {
    case 'player-lookup': {
      // Try to extract a player name from the message and search.
      const query = extractPlayerName(text);
      if (query) {
        const results = await searchPlayers({ query, limit: 5 });
        if (results.length > 0) {
          const playerNames = results.map((r) => `${r.player.name} (${r.player.position}, ${r.player.nflTeam})`).join(', ');
          return [
            msg('assistant', `I found these players: ${playerNames}`),
            msg('assistant', dataStatus.available
              ? 'I can pull projections, rankings, injury status, and recent news for any of these players. Ask about a specific player for full details.'
              : 'Player identity data is from Sleeper (real). Fantasy projections, rankings, and injuries require the FantasyPros data provider to be configured.'),
          ];
        }
      }
      return [msg('assistant', 'I can search for any NFL player. Try asking "Who is Patrick Mahomes?" or search in the Manual Team builder.')];
    }

    case 'start-sit':
    case 'optimize-lineup':
      return [
        msg('assistant', 'I can identify the players on your roster and load their real projections, rankings, and injury status — but the start/sit reasoning engine has not been connected yet.'),
        msg('assistant', dataStatus.available
          ? 'FantasyPros data IS available. I can gather projection and ranking context for your players. Once the AI model is connected, I will provide actual start/sit recommendations.'
          : 'To enable data-driven start/sit analysis: (1) configure the FantasyPros API key, (2) connect the AI model. See docs/INTEGRATION_ROADMAP.md.'),
      ];

    case 'waiver-targets':
    case 'find-upgrades':
      return [
        msg('assistant', 'Waiver wire analysis requires the AI reasoning engine, which is not connected yet. I can search for players and pull their real data once the FantasyPros provider is configured.'),
      ];

    case 'trade-advice':
    case 'trade-ideas':
    case 'build-better-trade':
      return [
        msg('assistant', 'Trade analysis requires the AI reasoning engine, which is not connected yet. I can look up real player projections and rankings to provide data context once the FantasyPros provider is configured.'),
      ];

    case 'weekly-matchup':
      return [
        msg('assistant', 'Weekly matchup analysis requires the AI reasoning engine, which is not connected yet. Player projection data is available for the AI to analyze once the model is connected.'),
      ];

    case 'sleepers':
      return [
        msg('assistant', 'Sleeper recommendation analysis requires the AI reasoning engine, which is not connected yet. I can provide real player projections and rankings as data context once the FantasyPros provider is configured.'),
      ];

    case 'yahoo-connected':
      return [
        msg('assistant', 'Yahoo Fantasy connection is mocked. When real Yahoo OAuth is connected, I will sync your league and roster automatically.'),
      ];

    default:
      return [
        msg(
          'assistant',
          'I can help with fantasy football analysis. Here is what works right now:\n\n• Player search — real NFL player data from Sleeper\n• Manual roster building — My Team → Manual Team\n• League settings configuration\n\nFeatures that need the AI model + FantasyPros data provider:\n• Start/sit analysis\n• Trade analysis\n• Waiver recommendations\n• Sleeper picks\n• Weekly matchup analysis\n\nUpload a roster screenshot or ask about a player to get started.',
        ),
      ];
  }
}

/**
 * // TODO-INTEGRATION: AI_MODEL
 * Dedicated entry for the "Yahoo connected" flow.
 */
export async function generatePostConnectionResponse(): Promise<ChatMessage[]> {
  return [
    msg('assistant', 'Yahoo Fantasy is now connected. I can pull your real league settings, team roster, and matchups from Yahoo. Player identity data is cross-referenced with Sleeper and FantasyPros.'),
    msg('assistant', 'Select a league in the My Team page to get started. Once the AI reasoning model is connected, I will provide data-driven start/sit, trade, and waiver analysis using your real Yahoo roster.'),
  ];
}

// ---- helpers ----

function msg(kind: ChatMessage['kind'], text: string): ChatMessage {
  return { id: uid(), kind, text, createdAt: Date.now() };
}

function extractPlayerName(text: string): string | null {
  // Simple extraction: look for "who is <name>" or "tell me about <name>"
  const patterns = [
    /who is (.+)/i,
    /tell me about (.+)/i,
    /player (.+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Clean up the extracted name
      return match[1].replace(/[?.!]/g, '').trim();
    }
  }
  return null;
}

// Re-export player profile for convenience
export { getPlayerFantasyProfile, getPlayerById };
