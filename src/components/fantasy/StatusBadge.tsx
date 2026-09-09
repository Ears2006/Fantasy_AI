import type { PlayerStatus } from '@/types';

const statusConfig: Record<PlayerStatus, { color: string; bg: string; border: string }> = {
  'Strong Start': { color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  Start: { color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  'Consider Alternatives': { color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  Bench: { color: 'text-gray-400', bg: 'bg-ink-700', border: 'border-ink-600' },
  'Trade Candidate': { color: 'text-sky-300', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  Sleeper: { color: 'text-neon-300', bg: 'bg-neon-500/10', border: 'border-neon-500/30' },
  Questionable: { color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  Out: { color: 'text-neon-400', bg: 'bg-neon-500/10', border: 'border-neon-500/30' },
};

export function StatusBadge({ status, size = 'sm' }: { status: PlayerStatus; size?: 'sm' | 'xs' }) {
  const cfg = statusConfig[status] ?? statusConfig['Start'];
  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center rounded-md border ${cfg.bg} ${cfg.border} ${cfg.color} ${pad} font-medium`}>
      {status}
    </span>
  );
}
