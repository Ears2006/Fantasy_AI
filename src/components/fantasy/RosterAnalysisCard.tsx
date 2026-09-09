import {
  ArrowUpRight,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { UploadedRosterAnalysis } from '@/types';
import { ActionButton, Card, CardHeader, StatPill } from './Card';
import { PlayerCard } from './PlayerCard';

interface RosterAnalysisCardProps {
  analysis: UploadedRosterAnalysis;
  onAction?: (action: 'optimize' | 'upgrades' | 'sleepers' | 'trade') => void;
}

export function RosterAnalysisCard({ analysis, onAction }: RosterAnalysisCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        icon={<TrendingUp className="h-4 w-4" />}
        title="Team Analysis"
        subtitle={analysis.teamName}
        accent="Mock Data"
      />

      <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-4">
        <StatPill label="Proj. Score" value={analysis.projectedTeamScore.toFixed(1)} tone="good" />
        <StatPill label="Ceiling" value={analysis.projectedCeiling.toFixed(1)} />
        <StatPill label="Strength" value={analysis.biggestStrength} tone="good" />
        <StatPill label="Weakness" value={analysis.biggestWeakness} tone="warn" />
      </div>

      {analysis.observations.length > 0 && (
        <div className="space-y-1.5 px-4 pb-3">
          {analysis.observations.map((obs, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon-500" />
              <span>{obs}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-ink-700 px-4 py-3">
        <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-gray-500">
          Roster ({analysis.roster.length})
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {analysis.roster.map((p) => (
            <PlayerCard
              key={p.id}
              name={p.name}
              position={p.position}
              nflTeam={p.nflTeam}
              opponent={p.opponent}
              projection={p.projection}
              slot={p.slot}
              status={p.status}
              recommendation={p.recommendation}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-ink-700 px-4 py-3">
        <ActionButton icon={<Zap className="h-3.5 w-3.5" />} variant="primary" onClick={() => onAction?.('optimize')}>
          Optimize Lineup
        </ActionButton>
        <ActionButton icon={<ArrowUpRight className="h-3.5 w-3.5" />} onClick={() => onAction?.('upgrades')}>
          Find Upgrades
        </ActionButton>
        <ActionButton icon={<Sparkles className="h-3.5 w-3.5" />} onClick={() => onAction?.('sleepers')}>
          Find Sleepers
        </ActionButton>
        <ActionButton icon={<TrendingDown className="h-3.5 w-3.5" />} onClick={() => onAction?.('trade')}>
          Trade Ideas
        </ActionButton>
      </div>
    </Card>
  );
}
