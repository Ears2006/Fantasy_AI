import { Crown, Settings2, Trophy, Users2 } from 'lucide-react';
import { mockLeagueFull } from '@/mock/data';

export function LeaguePage() {
  const league = mockLeagueFull;
  const sortedTeams = [...league.teams].sort(
    (a, b) => b.record.wins - a.record.wins || b.record.losses - a.record.losses,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-white sm:text-2xl">{league.name}</h1>
        <p className="mt-1 text-sm text-gray-500">League settings, teams, and standings</p>
      </div>

      {/* Settings */}
      <Section icon={<Settings2 className="h-4 w-4" />} title="League Settings">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <Info label="Format" value={league.scoring.format} />
          <Info label="Teams" value={String(league.scoring.teams)} />
          <Info label="Current Week" value={String(league.currentWeek)} />
          <Info label="Pass TD" value={`${league.scoring.passingTdPoints} pts`} />
          <Info label="Receptions" value={`${league.scoring.receptionPoints} pts`} />
          <Info label="Rush TD" value={`${league.scoring.rushingTdPoints} pts`} />
        </div>
      </Section>

      {/* Standings */}
      <Section icon={<Trophy className="h-4 w-4" />} title="Standings">
        <div className="overflow-hidden rounded-lg border border-ink-600">
          <table className="w-full text-sm">
            <thead className="bg-ink-800 text-xs text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Team</th>
                <th className="px-3 py-2 text-left font-medium">Manager</th>
                <th className="px-3 py-2 text-right font-medium">Record</th>
                <th className="px-3 py-2 text-right font-medium">Proj</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700">
              {sortedTeams.map((t, i) => (
                <tr key={t.id} className="transition-colors hover:bg-ink-800">
                  <td className="px-3 py-2.5 text-gray-500">
                    {i === 0 ? <Crown className="h-4 w-4 text-amber-400" /> : i + 1}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-white">{t.name}</td>
                  <td className="px-3 py-2.5 text-gray-400">{t.managerName}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-300">
                    {t.record.wins}-{t.record.losses}-{t.record.ties}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-300">
                    {t.projectedScore.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Teams */}
      <Section icon={<Users2 className="h-4 w-4" />} title="Teams">
        <div className="grid gap-2 sm:grid-cols-2">
          {league.teams.map((t) => (
            <div key={t.id} className="rounded-lg border border-ink-600 bg-ink-800 p-3">
              <p className="text-sm font-semibold text-white">{t.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">{t.managerName}</p>
              <p className="mt-1.5 text-xs text-gray-400">
                {t.record.wins}-{t.record.losses}-{t.record.ties} · {t.projectedScore.toFixed(1)} proj
              </p>
            </div>
          ))}
        </div>
      </Section>

      <p className="mt-4 text-center text-xs text-gray-600">
        Placeholder page — league functionality will be expanded after platform integration.
      </p>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-xl border border-ink-600 bg-ink-850 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-neon-500">{icon}</span>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-gray-600">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
