import { mockUserTeam, mockLeagueFull } from '@/mock/data';
import { TeamOverviewCard } from '@/components/fantasy/TeamOverviewCard';
import { YahooConnectCard } from '@/components/fantasy/YahooConnectCard';
import { useApp } from '@/state/AppContext';
import type { ReactNode } from 'react';

export function MyTeamPage() {
  const { user } = useApp();
  const team = mockUserTeam;
  const league = mockLeagueFull;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <PageHeader title="My Team" subtitle="Your roster and season snapshot" />

      {!user && (
        <div className="mb-4 rounded-lg border border-ink-600 bg-ink-850 px-4 py-3 text-xs text-gray-400">
          You're viewing mock team data. Sign in to sync your real roster.
        </div>
      )}

      <div className="mb-4">
        <YahooConnectCard />
      </div>

      {/* Quick stats */}
      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatBox label="Team" value={team.name} />
        <StatBox label="League" value={league.name} />
        <StatBox label="Format" value={league.scoring.format} />
        <StatBox label="Record" value={`${team.record.wins}-${team.record.losses}-${team.record.ties}`} />
      </div>

      <TeamOverviewCard team={team} />
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold text-white sm:text-2xl">{title}</h1>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-850 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-600">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
