import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Settings2, Trophy, Users2 } from 'lucide-react';
import type { ProviderTeam, LeagueScoringSettings } from '@/types';
import { YahooConnectCard } from '@/components/fantasy/YahooConnectCard';
import { DataSourceIndicator } from '@/components/fantasy/DataSourceIndicator';
import { useApp } from '@/state/AppContext';
import { getYahooLeagueTeams, getYahooLeagueSettings } from '@/services/yahoo/yahooService';
import { getCurrentWeek } from '@/services/utils/season';

export function LeaguePage() {
  const { yahoo, selectedLeague, yahooLoading, yahooError } = useApp();
  const [teams, setTeams] = useState<ProviderTeam[]>([]);
  const [scoring, setScoring] = useState<LeagueScoringSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!yahoo.connected || !selectedLeague) {
      setTeams([]);
      setScoring(null);
      return;
    }
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [teamsData, settingsData] = await Promise.all([
          getYahooLeagueTeams(selectedLeague.providerLeagueId),
          getYahooLeagueSettings(selectedLeague.providerLeagueId),
        ]);
        if (!cancelled) {
          setTeams(teamsData);
          setScoring(settingsData.scoring);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load league data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadData();
    return () => { cancelled = true; };
  }, [yahoo.connected, selectedLeague]);

  // ---- Not connected ----
  if (!yahoo.connected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <PageHeader title="League" subtitle="Your fantasy league overview" />
        <YahooConnectCard />
        <div className="mt-4 rounded-xl border border-ink-600 bg-ink-850 p-6 text-center text-sm text-gray-500">
          Connect Yahoo to view your real league standings, teams, and settings.
        </div>
      </div>
    );
  }

  // ---- Connected but no league selected ----
  if (yahoo.connected && !selectedLeague) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <PageHeader title="League" subtitle="Your fantasy league overview" />
        <YahooConnectCard />
        <div className="mt-4 rounded-xl border border-ink-600 bg-ink-850 p-6 text-center text-sm text-gray-500">
          {yahooLoading ? 'Loading your leagues...' : 'Select a Yahoo league to view its details.'}
        </div>
      </div>
    );
  }

  // ---- Loading ----
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <PageHeader title="League" subtitle={selectedLeague?.name ?? ''} />
        <div className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-850 px-4 py-6 text-sm text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-neon-500" />
          Loading league data from Yahoo...
        </div>
      </div>
    );
  }

  // ---- Error ----
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <PageHeader title="League" subtitle={selectedLeague?.name ?? ''} />
        <div className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  // ---- Connected with data ----
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.record.wins !== a.record.wins) return b.record.wins - a.record.wins;
    return a.record.losses - b.record.losses;
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <PageHeader title="League" subtitle={selectedLeague?.name ?? ''} />

      <div className="mb-4">
        <DataSourceIndicator sources={[{ label: 'League', provider: 'Yahoo' }]} />
      </div>

      {/* League settings summary */}
      {scoring && (
        <Section icon={<Settings2 className="h-3.5 w-3.5" />} title="League Settings">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Info label="Format" value={scoring.format} />
            <Info label="Teams" value={String(teams.length)} />
            <Info label="Current Week" value={String(getCurrentWeek())} />
            <Info label="Pass TD" value={`${scoring.passingTdPoints} pts`} />
            <Info label="Receptions" value={`${scoring.receptionPoints} pts`} />
            <Info label="Rush TD" value={`${scoring.rushingTdPoints} pts`} />
          </div>
        </Section>
      )}

      {/* Standings */}
      {sortedTeams.length > 0 && (
        <Section icon={<Trophy className="h-3.5 w-3.5" />} title="Standings">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-ink-700 text-gray-500">
                  <th className="py-2 pl-1 text-left font-medium">#</th>
                  <th className="py-2 text-left font-medium">Team</th>
                  <th className="py-2 text-left font-medium">Manager</th>
                  <th className="py-2 text-right font-medium">Record</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team, i) => (
                  <tr key={team.providerTeamId} className="border-b border-ink-800/50">
                    <td className="py-2 pl-1 text-gray-500">
                      {i === 0 ? <Trophy className="h-3 w-3 text-amber-400" /> : i + 1}
                    </td>
                    <td className="py-2 text-white">{team.name}</td>
                    <td className="py-2 text-gray-400">{team.managerName}</td>
                    <td className="py-2 text-right tabular-nums text-gray-300">
                      {team.record.wins}-{team.record.losses}-{team.record.ties}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Teams grid */}
      {sortedTeams.length > 0 && (
        <Section icon={<Users2 className="h-3.5 w-3.5" />} title="Teams">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {sortedTeams.map((team) => (
              <div
                key={team.providerTeamId}
                className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5"
              >
                <p className="text-sm font-medium text-white">{team.name}</p>
                <p className="text-xs text-gray-500">{team.managerName}</p>
                <p className="mt-1 text-xs tabular-nums text-gray-400">
                  {team.record.wins}-{team.record.losses}-{team.record.ties}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {teams.length === 0 && !loading && (
        <div className="rounded-xl border border-ink-600 bg-ink-850 p-6 text-center text-sm text-gray-500">
          No teams found in this league.
        </div>
      )}

      {yahooError && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {yahooError}
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

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-xl border border-ink-600 bg-ink-850 p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-neon-500">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-600">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
