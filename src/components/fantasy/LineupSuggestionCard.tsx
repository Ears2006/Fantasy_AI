import { ClipboardList, Sparkles } from 'lucide-react';
import type { PlayerRecommendation } from '@/types';
import { Card, CardHeader, StatPill } from './Card';
import { PlayerCard } from './PlayerCard';

export interface LineupSuggestionCardProps {
  starters: import('@/types').RosterPlayer[];
  bench: import('@/types').RosterPlayer[];
  expectedTotal: number;
  notes: string;
  recommendations?: PlayerRecommendation[];
}

export function LineupSuggestionCard({
  starters,
  bench,
  expectedTotal,
  notes,
  recommendations,
}: LineupSuggestionCardProps) {
  return (
    <Card>
      <CardHeader
        icon={<ClipboardList className="h-4 w-4" />}
        title="Optimized Lineup"
        subtitle="AI-recommended starters for this week"
        accent="Mock Data"
      />

      <div className="p-4">
        <div className="grid grid-cols-2 gap-2.5">
          <StatPill label="Expected Total" value={expectedTotal.toFixed(1)} tone="good" />
          <StatPill label="Starters" value={starters.length} />
        </div>
      </div>

      <div className="border-t border-ink-700 px-4 py-3">
        <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-gray-500">Starters</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {starters.map((p) => {
            const rec = recommendations?.find((r) => r.player.id === p.id);
            return (
              <PlayerCard
                key={p.id}
                name={p.name}
                position={p.position}
                nflTeam={p.nflTeam}
                opponent={p.opponent}
                projection={p.projection}
                slot={p.slot}
                status={p.status}
                recommendation={rec?.reason}
              />
            );
          })}
        </div>
      </div>

      {bench.length > 0 && (
        <div className="border-t border-ink-700 px-4 py-3">
          <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-gray-500">Bench</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {bench.map((p) => (
              <PlayerCard
                key={p.id}
                name={p.name}
                position={p.position}
                nflTeam={p.nflTeam}
                opponent={p.opponent}
                projection={p.projection}
                slot={p.slot}
                status={p.status}
                compact
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 border-t border-ink-700 px-4 py-3 text-xs text-gray-400">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon-500" />
        <span>{notes}</span>
      </div>
    </Card>
  );
}
