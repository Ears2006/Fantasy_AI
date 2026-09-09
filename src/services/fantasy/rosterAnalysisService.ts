// Mock service for roster screenshot analysis.
// The UI calls analyzeRosterScreenshot() — swap this file for a real
// vision/OCR implementation later without touching components.

import type { ChatAttachment, UploadedRosterAnalysis } from '@/types';
import { mockUserRoster } from '@/mock/data';

/**
 * // TODO-INTEGRATION: ROSTER_SCREENSHOT_ANALYSIS
 *
 * FUTURE IMPLEMENTATION:
 * 1. Send the uploaded image to a vision model (e.g. GPT-4o, Claude, or a
 *    custom OCR + layout pipeline) to extract roster rows: player name,
 *    position, NFL team, opponent, and projected points.
 * 2. Normalize the extracted rows into RosterPlayer[] by matching player
 *    names against the active player stats provider (see PLAYER_STATS).
 * 3. Compute projected team score, ceiling, biggest strength/weakness, and
 *    observations using the roster analysis engine.
 *
 * INPUT:  ChatAttachment (image data URL) + optional league scoring context.
 * OUTPUT: UploadedRosterAnalysis — the shape the RosterAnalysisCard renders.
 * MOCK REPLACEMENT: this function (analyzeRosterScreenshot).
 */
export async function analyzeRosterScreenshot(
  _attachment: ChatAttachment,
): Promise<UploadedRosterAnalysis> {
  // Simulate analysis latency so the UI loading state is visible.
  await delay(1600);

  return {
    imageUrl: _attachment.dataUrl,
    teamName: 'Gridiron AI',
    projectedTeamScore: 126.8,
    projectedCeiling: 151.4,
    biggestStrength: 'Running Back',
    biggestWeakness: 'WR2',
    roster: mockUserRoster,
    observations: [
      'RB room is elite — McCaffrey and Barkley give you the highest combined floor at the position.',
      'WR2 is your soft spot; Garrett Wilson has volume but a tough Denver matchup.',
      'FLEX is exposed to injury risk via Stefon Diggs (questionable).',
    ],
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
