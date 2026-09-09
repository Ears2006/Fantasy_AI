import { ArrowDownUp, Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ManualRosterSlot, ManualTeam, Player, LeagueScoringSettings } from '@/types';
import { PlayerSearch } from '@/components/fantasy/PlayerSearch';
import { getPlayerStats } from '@/services/fantasy/playerStatsService';
import { uid } from '@/services/utils/uid';

interface RosterBuilderProps {
  team: ManualTeam;
  scoring: LeagueScoringSettings;
  onChange: (team: ManualTeam) => void;
}

interface RosterRow {
  entryId: string;
  player: Player;
  slot: ManualRosterSlot;
}

const ALL_SLOTS: ManualRosterSlot[] = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'D/ST', 'BENCH'];

export function RosterBuilder({ team, scoring: _scoring, onChange }: RosterBuilderProps) {
  const [rows, setRows] = useState<RosterRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const loaded: RosterRow[] = [];
      for (const entry of team.roster) {
        const player = await getPlayerStats(entry.playerId);
        if (player && !cancelled) {
          loaded.push({ entryId: entry.id, player, slot: entry.slot });
        }
      }
      if (!cancelled) setRows(loaded);
    };
    void load();
    return () => { cancelled = true; };
  }, [team.roster]);

  const playerIds = new Set(rows.map((r) => r.player.id));

  const handleAddPlayer = (player: Player, slot: ManualRosterSlot = 'BENCH') => {
    if (playerIds.has(player.id)) return; // prevent duplicates
    const newEntry = { id: uid(), playerId: player.id, slot };
    onChange({ ...team, roster: [...team.roster, newEntry] });
  };

  const handleRemove = (entryId: string) => {
    onChange({ ...team, roster: team.roster.filter((e) => e.id !== entryId) });
  };

  const handleSlotChange = (entryId: string, newSlot: ManualRosterSlot) => {
    onChange({
      ...team,
      roster: team.roster.map((e) => (e.id === entryId ? { ...e, slot: newSlot } : e)),
    });
  };

  const handleMoveToBench = (entryId: string) => handleSlotChange(entryId, 'BENCH');
  const handleMoveToStarter = (entryId: string) => handleSlotChange(entryId, 'QB');

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-ink-600 bg-ink-850 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-neon-500" />
          <h3 className="text-sm font-semibold text-white">Add Player</h3>
        </div>
        <PlayerSearch onSelect={(p) => handleAddPlayer(p)} excludeIds={playerIds} />
      </div>

      <div className="rounded-xl border border-ink-600 bg-ink-850 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-neon-500" />
          <h3 className="text-sm font-semibold text-white">Roster ({rows.length})</h3>
        </div>

        {rows.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">
            No players added yet. Search above to build your roster.
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.entryId}
                className="flex items-center gap-2.5 rounded-lg border border-ink-600 bg-ink-800 p-2.5"
              >
                <select
                  value={row.slot}
                  onChange={(e) => handleSlotChange(row.entryId, e.target.value as ManualRosterSlot)}
                  className="rounded border border-ink-600 bg-ink-700 px-2 py-1 text-xs font-medium text-gray-300 focus:border-neon-500/40 focus:outline-none"
                >
                  {ALL_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{row.player.name}</p>
                  <p className="text-xs text-gray-500">
                    {row.player.position} · {row.player.nflTeam}
                    {row.player.injuryTag && (
                      <span className="ml-1.5 text-amber-400">{row.player.injuryTag}</span>
                    )}
                  </p>
                </div>

                {row.slot !== 'BENCH' ? (
                  <button
                    onClick={() => handleMoveToBench(row.entryId)}
                    className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-ink-700 hover:text-white"
                    title="Move to bench"
                  >
                    <ArrowDownUp className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleMoveToStarter(row.entryId)}
                    className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-ink-700 hover:text-white"
                    title="Move to starters"
                  >
                    <ArrowDownUp className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  onClick={() => handleRemove(row.entryId)}
                  className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-ink-700 hover:text-neon-400"
                  title="Remove from roster"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
