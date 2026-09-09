import { useEffect, useState } from 'react';
import { Activity, AlertCircle, Loader2, Pencil, Save, Users } from 'lucide-react';
import type { ManualTeam, CrosswalkDiagnostic } from '@/types';
import { YahooConnectCard } from '@/components/fantasy/YahooConnectCard';
import { RosterBuilder } from '@/components/fantasy/RosterBuilder';
import { DataSourceIndicator } from '@/components/fantasy/DataSourceIndicator';
import { useApp } from '@/state/AppContext';
import {
  loadManualLeague,
  loadManualTeam,
  createManualTeam,
  updateManualTeam,
  getDefaultScoring,
  saveManualLeague,
} from '@/services/team/manualTeamService';
import { getYahooRoster, crosswalkYahooRoster, type YahooRosterWithPlayers } from '@/services/yahoo/yahooService';
import type { ReactNode } from 'react';

export function MyTeamPage() {
  const { yahoo, selectedLeague, yahooUserTeam, selectedLeagueSettings, yahooLoading, yahooError } = useApp();
  const [mode, setMode] = useState<'overview' | 'manual'>('overview');
  const [manualTeam, setManualTeam] = useState<ManualTeam | null>(() => loadManualTeam());
  const [teamName, setTeamName] = useState(manualTeam?.name ?? '');
  const [savedNotice, setSavedNotice] = useState(false);

  // Yahoo roster state
  const [yahooRoster, setYahooRoster] = useState<YahooRosterWithPlayers[] | null>(null);
  const [rosterDiagnostic, setRosterDiagnostic] = useState<CrosswalkDiagnostic | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const league = loadManualLeague();
  const scoring = selectedLeagueSettings ?? league?.scoring ?? getDefaultScoring();

  // Fetch Yahoo roster when league and team are selected
  useEffect(() => {
    if (!yahoo.connected || !yahooUserTeam) {
      setYahooRoster(null);
      setRosterDiagnostic(null);
      return;
    }
    let cancelled = false;
    const loadRoster = async () => {
      setRosterLoading(true);
      setRosterError(null);
      try {
        const rawRoster = await getYahooRoster(yahooUserTeam.providerTeamId);
        const { players, diagnostic } = await crosswalkYahooRoster(rawRoster);
        if (!cancelled) {
          setYahooRoster(players);
          setRosterDiagnostic(diagnostic);
        }
      } catch (e) {
        if (!cancelled) setRosterError(e instanceof Error ? e.message : 'Failed to load roster.');
      } finally {
        if (!cancelled) setRosterLoading(false);
      }
    };
    void loadRoster();
    return () => { cancelled = true; };
  }, [yahoo.connected, yahooUserTeam]);

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

      {/* Mode toggle — only show Manual if Yahoo not connected with a league */}
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
          {/* Yahoo connection card */}
          <div className="mb-4">
            <YahooConnectCard />
          </div>

          {/* Yahoo connected — show real roster */}
          {yahoo.connected && selectedLeague && yahooUserTeam ? (
            <div className="space-y-4">
              {/* Data source indicator */}
              <DataSourceIndicator sources={[
                { label: 'Roster', provider: 'Yahoo' },
                { label: 'Player IDs', provider: 'Sleeper' },
              ]} />

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <StatBox label="Team" value={yahooUserTeam.name} />
                <StatBox label="League" value={selectedLeague.name} />
                <StatBox label="Format" value={selectedLeagueSettings?.format ?? 'Standard'} />
                <StatBox label="Record" value={`${yahooUserTeam.record.wins}-${yahooUserTeam.record.losses}-${yahooUserTeam.record.ties}`} />
              </div>

              {/* Roster loading */}
              {rosterLoading && (
                <div className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-850 px-4 py-3 text-xs text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin text-neon-500" />
                  Loading your Yahoo roster...
                </div>
              )}

              {/* Roster error */}
              {rosterError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {rosterError}
                </div>
              )}

              {/* Roster display */}
              {yahooRoster && yahooRoster.length > 0 && (
                <div className="rounded-xl border border-ink-600 bg-ink-850 overflow-hidden">
                  <div className="border-b border-ink-700 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-neon-500" />
                      <h3 className="text-sm font-semibold text-white">Your Roster</h3>
                    </div>
                  </div>
                  <div className="divide-y divide-ink-700">
                    {/* Starters */}
                    {yahooRoster.filter(p => p.isStarter).length > 0 && (
                      <div className="px-4 py-2">
                        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-600">Starters</p>
                        <div className="space-y-1.5">
                          {yahooRoster.filter(p => p.isStarter).map((p, i) => (
                            <RosterRow key={i} player={p} />
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Bench */}
                    {yahooRoster.filter(p => !p.isStarter).length > 0 && (
                      <div className="px-4 py-2">
                        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-600">Bench</p>
                        <div className="space-y-1.5">
                          {yahooRoster.filter(p => !p.isStarter).map((p, i) => (
                            <RosterRow key={i} player={p} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Crosswalk diagnostics */}
                  {rosterDiagnostic && (
                    <div className="border-t border-ink-700 px-4 py-2.5">
                      <p className="text-[10px] text-gray-600">
                        Player matching: {rosterDiagnostic.directlyMatched + rosterDiagnostic.matchedByName}/{rosterDiagnostic.totalProviderPlayers} matched
                        {rosterDiagnostic.unmatched > 0 && ` · ${rosterDiagnostic.unmatched} unmatched`}
                        {rosterDiagnostic.ambiguous > 0 && ` · ${rosterDiagnostic.ambiguous} ambiguous`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {yahooRoster && yahooRoster.length === 0 && !rosterLoading && (
                <div className="rounded-xl border border-ink-600 bg-ink-850 p-6 text-center text-sm text-gray-500">
                  No players found on your Yahoo roster.
                </div>
              )}
            </div>
          ) : yahoo.connected && !selectedLeague ? (
            <div className="rounded-xl border border-ink-600 bg-ink-850 p-6 text-center">
              <p className="text-sm text-gray-400">Select a Yahoo league above to view your team.</p>
            </div>
          ) : yahoo.connected && selectedLeague && !yahooUserTeam ? (
            <div className="rounded-xl border border-ink-600 bg-ink-850 p-6 text-center">
              <p className="text-sm text-gray-400">
                {yahooLoading ? 'Loading your team...' : 'No team found in this league for your Yahoo account.'}
              </p>
            </div>
          ) : (
            /* Not connected — show CTA and manual fallback */
            <>
              <div className="mb-4 rounded-lg border border-ink-600 bg-ink-850 px-4 py-3 text-xs text-gray-400">
                Connect Yahoo to import your real roster, or use the Manual Team tab to build your own.
              </div>
            </>
          )}

          {yahooError && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {yahooError}
            </div>
          )}
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

function RosterRow({ player }: { player: YahooRosterWithPlayers }) {
  return (
    <div className="flex items-center justify-between rounded border border-ink-700 bg-ink-800 px-2.5 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <span className="rounded bg-neon-950/30 px-1.5 py-0.5 text-[10px] font-mono text-neon-400">
          {player.slot}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-white">{player.playerName}</p>
          <p className="text-[10px] text-gray-500">
            {player.position} · {player.nflTeam}
            {player.injuryStatus && <span className="ml-1 text-amber-400">{player.injuryStatus}</span>}
          </p>
        </div>
      </div>
      {player.sleeperPlayerId ? (
        <span className="text-[10px] text-emerald-500">matched</span>
      ) : (
        <span className="text-[10px] text-gray-600">unmatched</span>
      )}
    </div>
  );
}

// Re-export so App can wire the league-settings page without import cycles
export { saveManualLeague };
