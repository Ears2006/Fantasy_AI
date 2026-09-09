// Shared card primitives used across all fantasy analysis components.

import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-ink-600 bg-ink-850 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  icon,
  title,
  subtitle,
  accent,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  accent?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-ink-700 px-4 py-3.5">
      {icon && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-neon-500">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </div>
      {accent && (
        <span className="rounded-md border border-neon-500/30 bg-neon-500/10 px-2 py-0.5 text-xs font-medium text-neon-300">
          {accent}
        </span>
      )}
    </div>
  );
}

export function StatPill({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  tone?: 'default' | 'good' | 'warn' | 'bad';
}) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-400'
      : tone === 'warn'
        ? 'text-amber-400'
        : tone === 'bad'
          ? 'text-neon-400'
          : 'text-white';
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`mt-0.5 text-base font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

export function ActionButton({
  icon,
  children,
  onClick,
  variant = 'ghost',
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  variant?: 'ghost' | 'primary';
}) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors';
  const styles =
    variant === 'primary'
      ? 'border border-neon-500/40 bg-neon-500/10 text-neon-300 hover:bg-neon-500/20 hover:border-neon-500/60'
      : 'border border-ink-600 bg-ink-800 text-gray-300 hover:border-ink-500 hover:bg-ink-750 hover:text-white';
  return (
    <button onClick={onClick} className={`${base} ${styles}`}>
      {icon}
      {children}
    </button>
  );
}
