// Centralized NFL season and week calculation.
// Avoids hard-coding season values throughout the app.

export function getCurrentSeason(): number {
  const now = new Date();
  // NFL season spans two calendar years (Sep-Dec of year N, Jan-Feb of year N+1).
  // If we're before September, we're in the previous season's playoffs.
  return now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear();
}

export function getCurrentWeek(): number {
  const now = new Date();
  // NFL regular season typically starts the week after Labor Day (early September).
  // Week 1 is usually around September 5-10.
  const seasonStart = new Date(getCurrentSeason(), 8, 8); // Sept 8 approximate
  if (now < seasonStart) return 1; // Pre-season
  const weeksSinceStart = Math.floor(
    (now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );
  return Math.max(1, Math.min(18, weeksSinceStart + 1));
}

export function getValidSeasons(count: number = 3): number[] {
  const current = getCurrentSeason();
  const seasons: number[] = [];
  for (let i = 0; i < count; i++) {
    seasons.push(current - i);
  }
  return seasons;
}
