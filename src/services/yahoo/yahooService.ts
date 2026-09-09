// Mock Yahoo Fantasy connection service.
// Abstracts the future OAuth + league-sync flow so the UI never talks to
// Yahoo directly.

import type { YahooConnection } from '@/types';

/**
 * // TODO-INTEGRATION: YAHOO_FANTASY
 *
 * FUTURE IMPLEMENTATION:
 * 1. Redirect the user through Yahoo OAuth 2.0 (browser-based PKCE flow or
 *    server-side auth code flow with a token exchange edge function).
 * 2. Store the refresh token securely (Supabase vault / edge function env).
 * 3. Call the Yahoo Fantasy API (game/team/roster/standings resources) to
 *    pull the user's league, scoring settings, and roster.
 * 4. Map Yahoo payloads into the shared FantasyLeague / FantasyTeam /
 *    FantasyRoster types and persist them in Supabase.
 *
 * INPUT:  none (triggers OAuth redirect) / callback token on return.
 * OUTPUT: YahooConnection — the shape the sidebar + chat expect.
 * MOCK REPLACEMENT: connectYahooFantasy() + disconnectYahooFantasy().
 */
export async function connectYahooFantasy(): Promise<YahooConnection> {
  await delay(900);
  return {
    connected: true,
    leagueName: 'Example League',
    format: 'Half-PPR',
    rosterCount: 17,
  };
}

/**
 * // TODO-INTEGRATION: YAHOO_FANTASY
 * Clears the stored Yahoo tokens and connection state.
 */
export async function disconnectYahooFantasy(): Promise<YahooConnection> {
  await delay(400);
  return { connected: false };
}

/**
 * // TODO-INTEGRATION: YAHOO_FANTASY
 * Returns the current connection status. In the real implementation this
 * reads from Supabase / session storage.
 */
export function getConnectionStatus(): YahooConnection {
  return { connected: false };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
