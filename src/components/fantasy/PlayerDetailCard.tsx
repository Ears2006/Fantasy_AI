// Player detail card — shows real fantasy data when available.
// Uses the provider-neutral fantasyDataService to fetch projection,
// ranking, injury, news, and recent performance.

import { Activity, BarChart3, HeartPulse, Newspaper, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FantasyPlayerProfile, PlayerWeeklyProjection, PlayerRanking, PlayerInjury, PlayerFantasyPerformance, PlayerNews } from '@/types';
import { getPlayerFantasyProfile } from '@/services/fantasyData/fantasyDataService';
import { DataSourceIndicator, NotConnectedBadge } from './DataSourceIndicator';

interface PlayerDetailCardProps {
  playerId: string;
  onClose?: () => void;
}

export function PlayerDetailCard({ playerId }: PlayerDetailCardProps) {
  const [profile, setProfile] = useState<FantasyPlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await getPlayerFantasyProfile(playerId);
        if (!cancelled) setProfile(p);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load player data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [playerId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-ink-600 bg-ink-850 p-4">
        <div className="h-6 w-48 shimmer rounded animate-shimmer" />
        <div className="mt-3 space-y-2">
          <div className="h-4 w-full shimmer rounded animate-shimmer" />
          <div className="h-4 w-3/4 shimmer rounded animate-shimmer" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-xl border border-ink-600 bg-ink-850 p-4 text-sm text-gray-400">
        {error ?? 'Player data unavailable.'}
      </div>
    );
  }

  const { player, weeklyProjection, ranking, injury, news, recentPerformance, sources } = profile;
  const dataSources: { label: string; provider: string }[] = [
    { label: 'Player', provider: 'Sleeper' },
  ];
  if (sources.fantasyPros) dataSources.push({ label: 'Projection', provider: 'FantasyPros' });

  return (
    <div className="rounded-xl border border-ink-600 bg-ink-850 overflow-hidden">
      {/* Header */}
      <div className="border-b border-ink-700 px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">{player.name}</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {player.position} · {player.nflTeam}
              {player.injuryTag && <span className="ml-1.5 text-amber-400">{player.injuryTag}</span>}
            </p>
          </div>
        </div>
        <div className="mt-2">
          <DataSourceIndicator sources={dataSources} />
        </div>
      </div>

      {!sources.fantasyPros && (
        <div className="px-4 py-3">
          <NotConnectedBadge label="FantasyPros" />
        </div>
      )}

      {/* Projection */}
      {weeklyProjection && (
        <DetailSection icon={<BarChart3 className="h-3.5 w-3.5" />} title="Week Projection">
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Proj Pts" value={weeklyProjection.projectedFantasyPoints.toFixed(1)} />
            <StatBox label="Pass YD" value={weeklyProjection.stats.passingYards?.toFixed(0) ?? '—'} />
            <StatBox label="Pass TD" value={weeklyProjection.stats.passingTDs?.toString() ?? '—'} />
            <StatBox label="Rush YD" value={weeklyProjection.stats.rushingYards?.toFixed(0) ?? '—'} />
            <StatBox label="Rec" value={weeklyProjection.stats.receptions?.toString() ?? '—'} />
            <StatBox label="Rec YD" value={weeklyProjection.stats.receivingYards?.toFixed(0) ?? '—'} />
          </div>
        </DetailSection>
      )}

      {/* Ranking */}
      {ranking && (
        <DetailSection icon={<TrendingUp className="h-3.5 w-3.5" />} title="Ranking">
          <div className="flex gap-3 text-xs">
            <span className="text-gray-400">
              Position Rank: <span className="font-semibold text-white">#{ranking.positionalRank}</span>
            </span>
            {ranking.overallRank && (
              <span className="text-gray-400">
                Overall: <span className="font-semibold text-white">#{ranking.overallRank}</span>
              </span>
            )}
            {ranking.tier && (
              <span className="text-gray-400">
                Tier: <span className="font-semibold text-white">{ranking.tier}</span>
              </span>
            )}
          </div>
        </DetailSection>
      )}

      {/* Injury */}
      {injury && (
        <DetailSection icon={<HeartPulse className="h-3.5 w-3.5" />} title="Injury Status">
          <div className="space-y-1 text-xs">
            <p className="text-gray-300">
              <span className="text-gray-500">Status:</span> {injury.status}
              {injury.bodyPart && <span className="ml-2 text-gray-500">Body: {injury.bodyPart}</span>}
            </p>
            {injury.practiceStatus && (
              <p className="text-gray-400">Practice: {injury.practiceStatus}</p>
            )}
            {injury.description && (
              <p className="text-gray-500">{injury.description}</p>
            )}
          </div>
        </DetailSection>
      )}

      {/* Recent Performance */}
      {recentPerformance && recentPerformance.length > 0 && (
        <DetailSection icon={<Activity className="h-3.5 w-3.5" />} title="Recent Performance">
          <div className="space-y-1">
            {recentPerformance.map((perf) => (
              <PerformanceRow key={perf.week} perf={perf} />
            ))}
          </div>
        </DetailSection>
      )}

      {/* News */}
      {news && news.length > 0 && (
        <DetailSection icon={<Newspaper className="h-3.5 w-3.5" />} title="Recent News">
          <ul className="space-y-2">
            {news.slice(0, 3).map((n, i) => (
              <li key={i} className="text-xs">
                <p className="font-medium text-gray-300">{n.headline}</p>
                <p className="mt-0.5 text-gray-500 line-clamp-2">{n.summary}</p>
                <p className="mt-0.5 text-[10px] text-gray-600">
                  {n.source} · {new Date(n.publishedAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}
    </div>
  );
}

function DetailSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-ink-700 px-4 py-3">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-neon-500">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{title}</span>
      </div>
      {children}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-ink-700 bg-ink-800 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-gray-600">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function PerformanceRow({ perf }: { perf: PlayerFantasyPerformance }) {
  return (
    <div className="flex items-center justify-between rounded border border-ink-700 bg-ink-800 px-2 py-1.5 text-xs">
      <span className="text-gray-500">Week {perf.week}</span>
      <span className="font-semibold tabular-nums text-white">{perf.fantasyPoints.toFixed(1)} pts</span>
    </div>
  );
}

export type { PlayerWeeklyProjection, PlayerRanking, PlayerInjury, PlayerNews };
