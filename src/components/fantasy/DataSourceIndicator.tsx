// Reusable data source indicator — shows where data comes from.
// Small, unobtrusive badge for transparency and debugging.

import type { ReactNode } from 'react';

interface DataSourceIndicatorProps {
  sources: { label: string; provider: string }[];
}

export function DataSourceIndicator({ sources }: DataSourceIndicatorProps) {
  if (sources.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sources.map((s, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded border border-ink-600 bg-ink-800 px-1.5 py-0.5 text-[10px] text-gray-500"
        >
          <span className="text-gray-600">{s.label}:</span>
          <span className="text-gray-400">{s.provider}</span>
        </span>
      ))}
    </div>
  );
}

export function NotConnectedBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-850 px-3 py-2.5 text-xs text-gray-400">
      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-ink-600 bg-ink-800 text-[10px] text-gray-500">
        !
      </div>
      <span>
        <span className="font-medium text-gray-300">{label}</span> not connected.
        Player identity is real (Sleeper). Fantasy data requires provider configuration.
      </span>
    </div>
  );
}

export function DataSourceRow({ children: _children }: { children: ReactNode }) {
  return <div className="mt-2"><DataSourceIndicator sources={[]} /></div>;
}
