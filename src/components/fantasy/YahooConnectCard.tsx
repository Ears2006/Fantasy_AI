import { CheckCircle2, Link2, Loader2, Plug, Unlink } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/state/AppContext';

export function YahooConnectCard({ compact = false }: { compact?: boolean }) {
  const { yahoo, connectYahoo, disconnectYahoo } = useApp();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await connectYahoo();
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await disconnectYahoo();
    } finally {
      setLoading(false);
    }
  };

  if (yahoo.connected) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Yahoo Fantasy Connected</p>
            <p className="text-xs text-gray-500">Mock connection for demonstration</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-600">League</p>
            <p className="truncate text-sm font-medium text-white">{yahoo.leagueName}</p>
          </div>
          <div className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Format</p>
            <p className="truncate text-sm font-medium text-white">{yahoo.format}</p>
          </div>
          <div className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Roster</p>
            <p className="text-sm font-medium text-white">{yahoo.rosterCount} Players</p>
          </div>
        </div>

        <button
          onClick={handleDisconnect}
          disabled={loading}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-neon-500/40 hover:text-neon-400 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-ink-600 bg-ink-850 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-600 bg-ink-800">
          <Plug className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Connect Yahoo Fantasy</p>
          <p className="text-xs text-gray-500">Sync your league, roster, and matchups</p>
        </div>
      </div>

      <button
        onClick={handleConnect}
        disabled={loading}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-neon-500/40 bg-neon-500/10 px-3 py-2 text-sm font-medium text-neon-300 transition-colors hover:bg-neon-500/20 hover:border-neon-500/60 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Link2 className="h-4 w-4" />
        )}
        {loading ? 'Connecting...' : 'Connect Yahoo Fantasy'}
      </button>
      <p className="mt-2 text-center text-[11px] text-gray-600">
        // TODO-INTEGRATION: YAHOO_FANTASY — mock connection for demo
      </p>
    </div>
  );
}
