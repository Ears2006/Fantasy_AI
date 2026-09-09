import { TrendingUp } from 'lucide-react';
import type { PlayerProjection, RosterSlot } from '@/types';
import { StatusBadge } from './StatusBadge';

export interface PlayerCardProps {
  name: string;
  position: string;
  nflTeam: string;
  opponent?: string;
  projection: PlayerProjection;
  slot?: RosterSlot;
  status?: import('@/types').PlayerStatus;
  recommendation?: string;
  compact?: boolean;
}

export function PlayerCard({
  name,
  position,
  nflTeam,
  opponent,
  projection,
  slot,
  status,
  recommendation,
  compact = false,
}: PlayerCardProps) {
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-800 p-3 transition-colors hover:border-ink-500">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {slot && (
              <span className="rounded border border-ink-600 bg-ink-700 px-1.5 py-0.5 font-mono text-[10px] font-medium text-gray-400">
                {slot}
              </span>
            )}
            <h4 className="truncate text-sm font-semibold text-white">{name}</h4>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            {position} · {nflTeam}
            {opponent && <span className="text-gray-600"> · {opponent}</span>}
          </p>
        </div>
        {status && <StatusBadge status={status} size="xs" />}
      </div>

      {!compact && (
        <div className="mt-2.5 flex items-center gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Proj</p>
            <p className="text-sm font-semibold tabular-nums text-white">
              {projection.projectedPoints.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Ceiling</p>
            <p className="flex items-center gap-0.5 text-sm font-semibold tabular-nums text-neon-300">
              <TrendingUp className="h-3 w-3" />
              {projection.ceiling.toFixed(1)}
            </p>
          </div>
          <div className="ml-auto">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full rounded-full bg-neon-500/60"
                style={{ width: `${Math.round(projection.confidence * 100)}%` }}
              />
            </div>
            <p className="mt-0.5 text-right text-[10px] text-gray-600">
              {Math.round(projection.confidence * 100)}% conf
            </p>
          </div>
        </div>
      )}

      {recommendation && (
        <p className="mt-2 border-t border-ink-700 pt-2 text-xs text-gray-400">{recommendation}</p>
      )}
    </div>
  );
}
