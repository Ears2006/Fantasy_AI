import { ArrowDown, ArrowRight, ArrowUp, Scale, Wand2 } from 'lucide-react';
import type { TradeAnalysis } from '@/types';
import { ActionButton, Card, CardHeader, StatPill } from './Card';

export function TradeCard({
  analysis,
  onBuildBetter,
}: {
  analysis: TradeAnalysis;
  onBuildBetter?: () => void;
}) {
  const { proposal, fairnessScore, expectedWeeklyImprovement, opponentExpectedValue, likelihoodAccepted, explanation } =
    analysis;

  return (
    <Card>
      <CardHeader
        icon={<Scale className="h-4 w-4" />}
        title="Trade Analysis"
        subtitle={analysis.recommendation}
        accent="Mock Data"
      />

      <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
        {/* You Give */}
        <div className="rounded-lg border border-neon-500/20 bg-neon-500/5 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <ArrowUp className="h-3.5 w-3.5 text-neon-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neon-300">You Give</span>
          </div>
          <ul className="space-y-1.5">
            {proposal.youGive.players.map((p) => (
              <li key={p.id} className="text-sm text-white">
                {p.name}
                <span className="ml-1.5 text-xs text-gray-500">
                  {p.position} · {p.nflTeam}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-3 border-t border-neon-500/15 pt-2 text-xs text-gray-500">
            <span>Proj: <span className="tabular-nums text-gray-300">{proposal.youGive.totalProjected.toFixed(1)}</span></span>
            <span>Ceiling: <span className="tabular-nums text-gray-300">{proposal.youGive.totalCeiling.toFixed(1)}</span></span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-600 bg-ink-800">
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* You Receive */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">You Receive</span>
          </div>
          <ul className="space-y-1.5">
            {proposal.youReceive.players.map((p) => (
              <li key={p.id} className="text-sm text-white">
                {p.name}
                <span className="ml-1.5 text-xs text-gray-500">
                  {p.position} · {p.nflTeam}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-3 border-t border-emerald-500/15 pt-2 text-xs text-gray-500">
            <span>Proj: <span className="tabular-nums text-gray-300">{proposal.youReceive.totalProjected.toFixed(1)}</span></span>
            <span>Ceiling: <span className="tabular-nums text-gray-300">{proposal.youReceive.totalCeiling.toFixed(1)}</span></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-4 sm:grid-cols-4">
        <StatPill label="Fairness" value={`${fairnessScore}/100`} tone={fairnessScore >= 70 ? 'good' : 'warn'} />
        <StatPill label="Your Gain" value={`+${expectedWeeklyImprovement.toFixed(1)}`} tone="good" />
        <StatPill label="Opp. Gain" value={`+${opponentExpectedValue.toFixed(1)}`} />
        <StatPill label="Accept Chance" value={`${Math.round(likelihoodAccepted * 100)}%`} tone={likelihoodAccepted >= 0.5 ? 'good' : 'warn'} />
      </div>

      <p className="px-4 py-3 text-xs leading-relaxed text-gray-400">{explanation}</p>

      <div className="border-t border-ink-700 px-4 py-3">
        <ActionButton icon={<Wand2 className="h-3.5 w-3.5" />} variant="primary" onClick={onBuildBetter}>
          Build Better Trade
        </ActionButton>
      </div>
    </Card>
  );
}
