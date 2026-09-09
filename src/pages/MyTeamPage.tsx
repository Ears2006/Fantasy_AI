import { useState } from 'react';
import { Pencil, Save, Users } from 'lucide-react';
import type { ManualTeam } from '@/types';
import { mockUserTeam, mockLeagueFull } from '@/mock/data';
import { TeamOverviewCard } from '@/components/fantasy/TeamOverviewCard';
import { YahooConnectCard } from '@/components/fantasy/YahooConnectCard';
import { RosterBuilder } from '@/components/fantasy/RosterBuilder';
import { useApp } from '@/state/AppContext';
import {
  loadManualLeague,
  loadManualTeam,
  createManualTeam,
  updateManualTeam,
  getDefaultScoring,
  saveManualLeague,
} from '@/services/team/manualTeamService';
import type { ReactNode } from 'react';

export function MyTeamPage() {
  const { user } = useApp();
  const [mode, setMode] = useState<'overview' | 'manual'>('overview');
  const [manualTeam, setManualTeam] = useState<ManualTeam | null>(() => loadManualTeam());
  const [teamName, setTeamName] = useState(manualTeam?.name ?? '');
  const [savedNotice, setSavedNotice] = useState(false);

  const league = loadManualLeague();
  const scoring = league?.scoring ?? getDefaultScoring();

  const handleCreateTeam = () => {
    const leagueId = league?.id ?? 'manual-league';
    const team = createManualTeam(teamName || 'My Team', leagueId);
    setManualTeam(team);
  };

  const handleSaveTeam = (updated: ManualTeam) => {
    updated.name = teamName || updated.name;
    setManualTeam(updated);
    updateManualTeam(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <PageHeader title="My Team" subtitle="Your roster and season snapshot" />

      {/* Mode toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode('overview')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'overview'
              ? 'border-neon-500/40 bg-neon-500/10 text-neon-200'
              : 'border-ink-600 bg-ink-850 text-gray-400 hover:text-white'
          }`}
        >
          Team Overview
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'manual'
              ? 'border-neon-500/40 bg-neon-500/10 text-neon-200'
              : 'border-ink-600 bg-ink-850 text-gray-400 hover:text-white'
          }`}
        >
          Manual Team
        </button>
      </div>

      {mode === 'overview' && (
        <>
          {!user && (
            <div className="mb-4 rounded-lg border border-ink-600 bg-ink-850 px-4 py-3 text-xs text-gray-400">
              You're viewing mock team data. Sign in to sync your real roster, or use the Manual Team tab to build your own.
            </div>
          )}

          <div className="mb-4">
            <YahooConnectCard />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatBox label="Team" value={mockUserTeam.name} />
            <StatBox label="League" value={mockLeagueFull.name} />
            <StatBox label="Format" value={mockLeagueFull.scoring.format} />
            <StatBox label="Record" value={`${mockUserTeam.record.wins}-${mockUserTeam.record.losses}-${mockUserTeam.record.ties}`} />
          </div>

          <TeamOverviewCard team={mockUserTeam} />
        </>
      )}

      {mode === 'manual' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-ink-600 bg-ink-850 px-4 py-3 text-xs text-gray-400">
            Build your team manually using real NFL player data from Sleeper. Your roster saves locally.
            {!league && ' Configure league settings first for accurate roster slots.'}
          </div>

          {/* Team name + create/save */}
          <div className="rounded-xl border border-ink-600 bg-ink-850 p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-neon-500" />
              <h3 className="text-sm font-semibold text-white">Team Name</h3>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="My Fantasy Team"
                className="flex-1 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-neon-500/40 focus:outline-none"
              />
              {!manualTeam ? (
                <button
                  onClick={handleCreateTeam}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neon-500/40 bg-neon-500/10 px-3 py-2 text-sm font-medium text-neon-200 hover:bg-neon-500/20"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Create
                </button>
              ) : (
                <button
                  onClick={() => manualTeam && handleSaveTeam(manualTeam)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </button>
              )}
            </div>
            {savedNotice && (
              <p className="mt-2 text-xs text-emerald-400">Roster saved.</p>
            )}
          </div>

          {manualTeam ? (
            <RosterBuilder team={manualTeam} scoring={scoring} onChange={handleSaveTeam} />
          ) : (
            <div className="rounded-xl border border-ink-600 bg-ink-850 p-8 text-center">
              <p className="text-sm text-gray-500">
                Enter a team name and click Create to start building your roster.
              </p>
            </div>
          )}
        </div>
      )}
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

// Re-export so App can wire the league-settings page without import cycles
export { saveManualLeague };
