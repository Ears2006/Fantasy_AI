// Yahoo Connect card — real OAuth states, league selection, and disconnect.
// Shows different UI based on YahooConnectionStatus:
// not_configured, disconnected, connecting, connected, expired, error.

import { AlertCircle, CheckCircle2, ChevronRight, Link2, Loader2, Plug, RefreshCw, Unlink, Zap } from 'lucide-react';
import { useState } from 'react';
import type { ProviderLeague } from '@/types';
import { useApp } from '@/state/AppContext';

export function YahooConnectCard({ compact = false }: { compact?: boolean }) {
  const {
    yahoo, yahooLeagues, selectedLeague, yahooLoading, yahooError,
    connectYahoo, disconnectYahoo, selectYahooLeague, refreshYahooStatus,
  } = useApp();
  const [showLeagueSelect, setShowLeagueSelect] = useState(false);

  // ---- Not configured ----
  if (yahoo.status === 'not_configured') {
    return (
      <div className={`rounded-xl border border-ink-600 bg-ink-850 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-800">
            <Plug className="h-4 w-4 text-gray-500" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">Yahoo Fantasy</h3>
            <p className="mt-1 text-xs text-gray-500">
              Yahoo OAuth credentials are not configured. Set YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET secrets to enable Yahoo connection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---- Error ----
  if (yahoo.status === 'error' && !yahooLoading) {
    return (
      <div className={`rounded-xl border border-red-900/50 bg-red-950/20 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-red-300">Yahoo Connection Error</h3>
            <p className="mt-1 text-xs text-gray-400">{yahoo.error ?? 'An error occurred with the Yahoo connection.'}</p>
            <button
              onClick={refreshYahooStatus}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Loading / connecting ----
  if (yahooLoading && !yahoo.connected) {
    return (
      <div className={`rounded-xl border border-ink-600 bg-ink-850 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-neon-500" />
          <span className="text-sm text-gray-400">Connecting to Yahoo...</span>
        </div>
      </div>
    );
  }

  // ---- Expired ----
  if (yahoo.status === 'expired') {
    return (
      <div className={`rounded-xl border border-amber-900/50 bg-amber-950/20 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-amber-300">Yahoo Connection Expired</h3>
            <p className="mt-1 text-xs text-gray-400">Your Yahoo session has expired. Please reconnect.</p>
            <button
              onClick={connectYahoo}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-neon-500 px-3 py-1.5 text-xs font-medium text-ink-950 hover:bg-neon-400 transition-colors"
            >
              <Link2 className="h-3 w-3" /> Reconnect Yahoo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Connected ----
  if (yahoo.connected) {
    return (
      <div className={`rounded-xl border border-neon-900/30 bg-neon-950/10 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white">Yahoo Connected</h3>
            {selectedLeague ? (
              <p className="mt-1 text-xs text-gray-400">
                Active league: <span className="text-neon-400">{selectedLeague.name}</span> ({selectedLeague.season})
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-400">
                {yahooLeagues.length > 0
                  ? `${yahooLeagues.length} league${yahooLeagues.length !== 1 ? 's' : ''} found. Select one to get started.`
                  : 'No leagues found for the current season.'}
              </p>
            )}

            {yahooError && (
              <p className="mt-1 text-xs text-red-400">{yahooError}</p>
            )}

            {/* League selection */}
            {yahooLeagues.length > 0 && !selectedLeague && (
              <div className="mt-3 space-y-1.5">
                {yahooLeagues.map((league) => (
                  <LeagueRow
                    key={league.providerLeagueId}
                    league={league}
                    onSelect={() => selectYahooLeague(league)}
                  />
                ))}
              </div>
            )}

            {/* Change league / disconnect controls */}
            {selectedLeague && (
              <div className="mt-3 flex items-center gap-3">
                {yahooLeagues.length > 1 && (
                  <button
                    onClick={() => setShowLeagueSelect(!showLeagueSelect)}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Change league
                  </button>
                )}
                <button
                  onClick={disconnectYahoo}
                  disabled={yahooLoading}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Unlink className="h-3 w-3" /> Disconnect
                </button>
              </div>
            )}

            {/* League selector dropdown */}
            {showLeagueSelect && yahooLeagues.length > 1 && (
              <div className="mt-2 space-y-1.5 rounded-lg border border-ink-700 bg-ink-800 p-2">
                {yahooLeagues.map((league) => (
                  <LeagueRow
                    key={league.providerLeagueId}
                    league={league}
                    onSelect={() => {
                      void selectYahooLeague(league);
                      setShowLeagueSelect(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- Disconnected (default) ----
  return (
    <div className={`rounded-xl border border-ink-600 bg-ink-850 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-800">
          <Zap className="h-4 w-4 text-gray-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">Connect Yahoo Fantasy</h3>
          <p className="mt-1 text-xs text-gray-500">
            Connect your Yahoo Fantasy account to import your league, team, and roster automatically.
          </p>
          <button
            onClick={connectYahoo}
            disabled={yahooLoading}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-neon-500 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-neon-400 disabled:opacity-50 transition-colors"
          >
            {yahooLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            {yahooLoading ? 'Connecting...' : 'Connect Yahoo'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LeagueRow({ league, onSelect }: { league: ProviderLeague; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center justify-between rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-left hover:border-neon-700 transition-colors"
    >
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-white">{league.name}</p>
        <p className="text-[10px] text-gray-500">
          {league.season} · {league.numberOfTeams} teams · {league.scoringType ?? 'Standard'}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-600" />
    </button>
  );
}
