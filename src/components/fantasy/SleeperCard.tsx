import { Rocket, Sparkles } from 'lucide-react';
import type { SleeperRecommendation, SleeperRecommendationType } from '@/types';
import { Card, CardHeader } from './Card';

const typeConfig: Record<SleeperRecommendationType, { color: string; bg: string; border: string }> = {
  'Free Agent Target': { color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  'Trade Target': { color: 'text-sky-300', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  'Deep Sleeper': { color: 'text-neon-300', bg: 'bg-neon-500/10', border: 'border-neon-500/30' },
  'Buy Low': { color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  'Sell High': { color: 'text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
};

export function SleeperCard({ rec }: { rec: SleeperRecommendation }) {
  const cfg = typeConfig[rec.recommendationType];
  const upside = (rec.aiUpside - rec.normalProjection).toFixed(1);

  return (
    <Card>
      <CardHeader
        icon={<Rocket className="h-4 w-4" />}
        title={rec.player.name}
        subtitle={`${rec.player.position} · ${rec.player.nflTeam}${rec.player.opponent ? ` · ${rec.player.opponent}` : ''}`}
      />

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-md border ${cfg.bg} ${cfg.border} ${cfg.color} px-2 py-0.5 text-xs font-medium`}>
            {rec.recommendationType}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <div className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Proj</p>
            <p className="text-sm font-semibold tabular-nums text-white">{rec.normalProjection.toFixed(1)}</p>
          </div>
          <div className="rounded-lg border border-neon-500/20 bg-neon-500/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-600">AI Upside</p>
            <p className="text-sm font-semibold tabular-nums text-neon-300">{rec.aiUpside.toFixed(1)}</p>
          </div>
          <div className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Confidence</p>
            <p className="text-sm font-semibold tabular-nums text-white">{Math.round(rec.confidence * 100)}%</p>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2 text-xs text-gray-500">
          <Sparkles className="h-3.5 w-3.5 text-neon-500" />
          <span>
            <span className="text-neon-300">+{upside}</span> points of upside vs consensus projection
          </span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-gray-400">{rec.reasoning}</p>
      </div>
    </Card>
  );
}

export function SleeperList({ sleepers }: { sleepers: SleeperRecommendation[] }) {
  return (
    <div className="space-y-2.5">
      {sleepers.map((s) => (
        <SleeperCard key={s.player.id} rec={s} />
      ))}
    </div>
  );
}
