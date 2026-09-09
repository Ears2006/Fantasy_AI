import { Bell, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import { YahooConnectCard } from '@/components/fantasy/YahooConnectCard';

export function SettingsPage() {
  const [riskLevel, setRiskLevel] = useState<'safe' | 'balanced' | 'aggressive'>('balanced');
  const [platform, setPlatform] = useState<'yahoo' | 'espn' | 'sleeper' | 'none'>('yahoo');
  const [notif, setNotif] = useState({ lineupReminders: true, waiverAlerts: true, tradeProposals: false, injuryUpdates: true });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-white sm:text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Tune how the AI makes recommendations</p>
      </div>

      {/* Risk level */}
      <Section icon={<Zap className="h-4 w-4" />} title="Recommendation Risk Level">
        <div className="grid grid-cols-3 gap-2">
          {(['safe', 'balanced', 'aggressive'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setRiskLevel(level)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                riskLevel === level
                  ? 'border-neon-500/50 bg-neon-500/10 text-neon-200'
                  : 'border-ink-600 bg-ink-800 text-gray-400 hover:border-ink-500 hover:text-white'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {riskLevel === 'safe' && 'Prioritize high-floor players and proven producers.'}
          {riskLevel === 'balanced' && 'Balance floor and ceiling — mix of safe starts and upside plays.'}
          {riskLevel === 'aggressive' && 'Maximize ceiling — favor upside, matchups, and breakout candidates.'}
        </p>
      </Section>

      {/* Platform */}
      <Section icon={<Shield className="h-4 w-4" />} title="Favorite Fantasy Platform">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(['yahoo', 'espn', 'sleeper', 'none'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                platform === p
                  ? 'border-neon-500/50 bg-neon-500/10 text-neon-200'
                  : 'border-ink-600 bg-ink-800 text-gray-400 hover:border-ink-500 hover:text-white'
              }`}
            >
              {p === 'none' ? 'No Preference' : p}
            </button>
          ))}
        </div>
      </Section>

      {/* Connected services */}
      <Section icon={<Shield className="h-4 w-4" />} title="Connected Fantasy Services">
        <YahooConnectCard />
      </Section>

      {/* Notifications */}
      <Section icon={<Bell className="h-4 w-4" />} title="Notification Preferences">
        <div className="space-y-2">
          {([
            ['lineupReminders', 'Lineup reminders before kickoff'],
            ['waiverAlerts', 'Waiver wire sleeper alerts'],
            ['tradeProposals', 'Trade proposal suggestions'],
            ['injuryUpdates', 'Player injury updates'],
          ] as const).map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5"
            >
              <span className="text-sm text-gray-300">{label}</span>
              <button
                onClick={() => setNotif((prev) => ({ ...prev, [key]: !prev[key] }))}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  notif[key] ? 'bg-neon-500' : 'bg-ink-600'
                }`}
                role="switch"
                aria-checked={notif[key]}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    notif[key] ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </Section>

      <p className="mt-4 text-center text-xs text-gray-600">
        Settings are mock for now — preferences will persist after authentication is connected.
      </p>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-xl border border-ink-600 bg-ink-850 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-neon-500">{icon}</span>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}
