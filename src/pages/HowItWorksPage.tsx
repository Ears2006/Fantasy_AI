import { ClipboardList, ImagePlus, MessagesSquare, Scale, Sparkles, Swords } from 'lucide-react';

const steps = [
  {
    icon: <MessagesSquare className="h-5 w-5" />,
    title: 'Ask or Upload',
    desc: 'Type a question like "Who should I start?" or upload a screenshot of your roster, matchup, waiver wire, or trade offer.',
  },
  {
    icon: <ImagePlus className="h-5 w-5" />,
    title: 'Screenshot Analysis',
    desc: 'The AI reads your screenshot and returns a structured roster breakdown — projected scores, strengths, weaknesses, and player-by-player recommendations.',
  },
  {
    icon: <ClipboardList className="h-5 w-5" />,
    title: 'Lineup Optimization',
    desc: 'Get an optimized starting lineup with expected totals, plus bench recommendations and injury risk flags.',
  },
  {
    icon: <Swords className="h-5 w-5" />,
    title: 'Weekly Matchup',
    desc: 'See your win probability, the single best lineup move, and an optional high-risk high-upside play.',
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: 'Sleeper Picks',
    desc: 'Discover waiver targets and deep sleepers with AI upside projections, confidence scores, and reasoning.',
  },
  {
    icon: <Scale className="h-5 w-5" />,
    title: 'Trade Analysis',
    desc: 'Evaluate trade offers with fairness scores, expected weekly improvement, and acceptance likelihood — then build a better trade.',
  },
];

export function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-white sm:text-2xl">How It Works</h1>
        <p className="mt-1 text-sm text-gray-500">From question to recommendation in seconds</p>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3.5 rounded-xl border border-ink-600 bg-ink-850 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neon-500/30 bg-ink-800 text-neon-500">
              {step.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-600">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="text-sm font-semibold text-white">{step.title}</h2>
              </div>
              <p className="mt-1 text-sm text-gray-400">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-ink-600 bg-ink-850 px-4 py-3 text-xs text-gray-500">
        No account required to try the chatbot. Sign in to sync your Yahoo Fantasy league and save
        chat history across sessions.
      </div>
    </div>
  );
}
