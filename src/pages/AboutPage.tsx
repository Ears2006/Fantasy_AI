import { ImagePlus, MessagesSquare, Scale, Sparkles, Swords, Upload } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-white sm:text-2xl">About</h1>
        <p className="mt-1 text-sm text-gray-500">What Fantasy Football AI does</p>
      </div>

      <div className="rounded-xl border border-ink-600 bg-ink-850 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neon-500/30 bg-ink-800">
            <Sparkles className="h-5 w-5 text-neon-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">AI-first fantasy football assistant</h2>
            <p className="text-sm text-gray-500">Not a dashboard — a conversation</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-gray-400">
          Fantasy Football AI is a chat-first assistant for managing your fantasy team. Instead of
          digging through stats and projections, you ask questions in plain English and upload
          screenshots of your roster, matchups, waiver wire, or trade offers. The AI returns
          structured recommendations as visual cards — start/sit decisions, sleeper picks, trade
          analysis, and weekly matchup strategy.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Feature icon={<Upload className="h-4 w-4" />} title="Screenshot Analysis" desc="Upload your roster, matchup, or trade offer for instant analysis." />
        <Feature icon={<MessagesSquare className="h-4 w-4" />} title="Natural Language" desc="Ask 'should I start or sit?' and get a clear card-based answer." />
        <Feature icon={<Scale className="h-4 w-4" />} title="Trade Engine" desc="Fairness scores, acceptance likelihood, and better-trade builder." />
        <Feature icon={<Swords className="h-4 w-4" />} title="Matchup Strategy" desc="Win probability, best lineup moves, and high-upside gambles." />
        <Feature icon={<ImagePlus className="h-4 w-4" />} title="Sleeper Picks" desc="AI upside projections with confidence scores and reasoning." />
        <Feature icon={<Sparkles className="h-4 w-4" />} title="Platform Sync" desc="Connect Yahoo Fantasy to auto-sync your league and roster." />
      </div>

      <div className="mt-4 rounded-lg border border-ink-600 bg-ink-850 px-4 py-3 text-xs text-gray-500">
        Currently in demo mode — all analysis uses mock data. Real AI, stats, and platform
        integrations are planned. Search <code className="rounded bg-ink-700 px-1 text-neon-300">TODO-INTEGRATION</code> in the codebase to find every integration point.
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-850 p-4">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-neon-500">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs text-gray-400">{desc}</p>
    </div>
  );
}
