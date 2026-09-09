import { ClipboardList, Users } from 'lucide-react';
import type { FantasyTeam } from '@/types';
import { Card, CardHeader, StatPill } from './Card';
import { PlayerCard } from './PlayerCard';

export function TeamOverviewCard({ team }: { team: FantasyTeam }) {
  return (
    <Card>
      <CardHeader
        icon={<Users className="h-4 w-4" />}
        title={team.name}
        subtitle={`Managed by ${team.managerName}`}
        accent={`${team.record.wins}-${team.record.losses}-${team.record.ties}`}
      />

      <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3">
        <StatPill label="Record" value={`${team.record.wins}-${team.record.losses}-${team.record.ties}`} />
        <StatPill label="Proj. Score" value={team.projectedScore.toFixed(1)} tone="good" />
        <StatPill label="Roster Size" value={team.roster.players.length} />
      </div>

      <div className="border-t border-ink-700 px-4 py-3">
        <div className="mb-2.5 flex items-center gap-1.5">
          <ClipboardList className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Roster</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {team.roster.players.map((p) => (
            <PlayerCard
              key={p.id}
              name={p.name}
              position={p.position}
              nflTeam={p.nflTeam}
              opponent={p.opponent}
              projection={p.projection}
              slot={p.slot}
              status={p.status}
              compact
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
