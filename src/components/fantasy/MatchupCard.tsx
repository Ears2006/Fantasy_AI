import { AlertTriangle, Lightbulb, Swords, TrendingUp, Zap } from 'lucide-react';
import type { WeeklyMatchup } from '@/types';
import { Card, CardHeader } from './Card';

export function MatchupCard({ matchup }: { matchup: WeeklyMatchup }) {
  const winPct = Math.round(matchup.winProbability * 100);
  const userBarWidth = `${winPct}%`;

  return (
    <Card>
      <CardHeader
        icon={<Swords className="h-4 w-4" />}
        title={`Week ${matchup.week} Matchup`}
        subtitle={`${matchup.userTeamName} vs ${matchup.opponentTeamName}`}
        accent="Mock Data"
      />

      {/* Score comparison */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-ink-600 bg-ink-800 p-3 text-center">
            <p className="truncate text-xs font-medium text-gray-400">{matchup.userTeamName}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-white">{matchup.userProjected.toFixed(1)}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Proj</p>
          </div>
          <div className="rounded-lg border border-ink-600 bg-ink-800 p-3 text-center">
            <p className="truncate text-xs font-medium text-gray-400">{matchup.opponentTeamName}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-gray-300">{matchup.opponentProjected.toFixed(1)}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Proj</p>
          </div>
        </div>

        {/* Win probability bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-gray-400">Win Probability</span>
            <span className="font-semibold tabular-nums text-white">{winPct}%</span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-ink-700">
            <div className="h-full bg-gradient-to-r from-neon-600 to-neon-400 transition-all" style={{ width: userBarWidth }} />
            <div className="h-full flex-1 bg-ink-600" />
          </div>
        </div>
      </div>

      {/* Moves */}
      <div className="space-y-2.5 border-t border-ink-700 px-4 py-3">
        {matchup.bestLineupMove && (
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Best Lineup Move</p>
              <p className="mt-0.5 text-xs text-gray-400">{matchup.bestLineupMove}</p>
              {matchup.expectedImprovement != null && (
                <p className="mt-0.5 text-xs font-medium text-emerald-400">
                  +{matchup.expectedImprovement.toFixed(1)} expected points
                </p>
              )}
            </div>
          </div>
        )}

        {matchup.riskyMove && (
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-neon-500/30 bg-neon-500/10 text-neon-400">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">High-Risk / High-Upside Move</p>
              <p className="mt-0.5 text-xs text-gray-400">{matchup.riskyMove}</p>
            </div>
          </div>
        )}
      </div>

      {/* Observations */}
      {matchup.observations.length > 0 && (
        <div className="border-t border-ink-700 px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-neon-500" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Observations</span>
          </div>
          <ul className="space-y-1.5">
            {matchup.observations.map((obs, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-gray-600" />
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
