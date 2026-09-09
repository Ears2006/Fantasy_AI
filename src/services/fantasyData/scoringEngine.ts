// Pure fantasy scoring engine — calculates fantasy points from raw stats
// using the user's league scoring settings.
//
// This is a PURE function: input stats + scoring settings -> number.
// No API calls, no side effects.

import type { PlayerStats, LeagueScoringSettings } from '@/types';

/**
 * Calculates fantasy points from a raw statistical line.
 * Uses the user's league scoring settings to determine point values.
 */
export function calculateFantasyPoints(
  stats: PlayerStats,
  settings: LeagueScoringSettings,
): number {
  let points = 0;

  // Passing
  if (stats.passingYards) {
    points += stats.passingYards / settings.passingYardsPerPoint;
  }
  if (stats.passingTDs) {
    points += stats.passingTDs * settings.passingTdPoints;
  }
  if (stats.interceptions) {
    points += stats.interceptions * settings.interceptionPoints;
  }

  // Rushing
  if (stats.rushingYards) {
    points += stats.rushingYards / settings.rushingYardsPerPoint;
  }
  if (stats.rushingTDs) {
    points += stats.rushingTDs * settings.rushingTdPoints;
  }

  // Receiving
  if (stats.receptions) {
    points += stats.receptions * settings.receptionPoints;
  }
  if (stats.receivingYards) {
    points += stats.receivingYards / settings.receivingYardsPerPoint;
  }
  if (stats.receivingTDs) {
    points += stats.receivingTDs * settings.receivingTdPoints;
  }

  // Fumbles
  if (stats.fumbles) {
    points += stats.fumbles * settings.fumblePoints;
  }

  // Kicking (if league supports kickers)
  if (settings.kickerEnabled) {
    if (stats.fieldGoalsMade) {
      // Simplified: 3 points per FG (real leagues vary by distance)
      points += stats.fieldGoalsMade * 3;
    }
    if (stats.extraPointsMade) {
      points += stats.extraPointsMade * 1;
    }
  }

  // Defense/DST (simplified — real leagues have complex DST scoring)
  if (settings.defenseEnabled) {
    if (stats.defensiveSacks) {
      points += stats.defensiveSacks * 1;
    }
    if (stats.defensiveInterceptions) {
      points += stats.defensiveInterceptions * 2;
    }
    if (stats.defensiveFumblesRecovered) {
      points += stats.defensiveFumblesRecovered * 2;
    }
    if (stats.defensiveTDs) {
      points += stats.defensiveTDs * 6;
    }
    if (stats.pointsAllowed !== undefined) {
      points += dstPointsAllowedBonus(stats.pointsAllowed);
    }
  }

  return round1(points);
}

function dstPointsAllowedBonus(pointsAllowed: number): number {
  if (pointsAllowed === 0) return 10;
  if (pointsAllowed <= 6) return 7;
  if (pointsAllowed <= 13) return 4;
  if (pointsAllowed <= 20) return 1;
  if (pointsAllowed <= 27) return 0;
  if (pointsAllowed <= 34) return -1;
  return -4;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---- Test cases ----
// Run these in the console to verify: import { runScoringTests } from ...
export function runScoringTests(): void {
  const standardSettings: LeagueScoringSettings = {
    format: 'Standard',
    passingTdPoints: 4,
    passingYardsPerPoint: 25,
    interceptionPoints: -2,
    rushingTdPoints: 6,
    rushingYardsPerPoint: 10,
    receivingYardsPerPoint: 10,
    receivingTdPoints: 6,
    receptionPoints: 0,
    fumblePoints: -2,
    teams: 12,
    qbSlots: 1, rbSlots: 2, wrSlots: 2, teSlots: 1, flexSlots: 1, benchSlots: 6,
    kickerEnabled: true, defenseEnabled: true,
  };

  const halfPprSettings: LeagueScoringSettings = { ...standardSettings, format: 'Half-PPR', receptionPoints: 0.5 };
  const fullPprSettings: LeagueScoringSettings = { ...standardSettings, format: 'Full-PPR', receptionPoints: 1.0 };
  const sixPtPassTdSettings: LeagueScoringSettings = { ...standardSettings, passingTdPoints: 6 };

  // 300 pass yd, 3 pass TD, 1 INT, 50 rush yd, 1 rush TD, 5 rec, 80 rec yd
  const stats: PlayerStats = {
    playerId: 'test',
    passingYards: 300,
    passingTDs: 3,
    interceptions: 1,
    rushingYards: 50,
    rushingTDs: 1,
    receptions: 5,
    receivingYards: 80,
  };

  const standard = calculateFantasyPoints(stats, standardSettings);
  const halfPpr = calculateFantasyPoints(stats, halfPprSettings);
  const fullPpr = calculateFantasyPoints(stats, fullPprSettings);
  const sixPt = calculateFantasyPoints(stats, sixPtPassTdSettings);

  console.log('Scoring Engine Tests:');
  console.log(`  Standard (4pt pass TD): ${standard} (expected: 39.0)`);
  console.log(`  Half-PPR: ${halfPpr} (expected: 41.5)`);
  console.log(`  Full-PPR: ${fullPpr} (expected: 44.0)`);
  console.log(`  6pt pass TD: ${sixPt} (expected: 45.0)`);
}
