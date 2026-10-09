import type { ReactNode } from 'react';
import {
  ImagePlus,
  MessagesSquare,
  Scale,
  Sparkles,
  Swords,
  Upload,
} from 'lucide-react';

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          About
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          What Fantasy Football AI does
        </p>
      </div>

      <div className="rounded-xl border border-ink-600 bg-ink-850 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neon-500/30 bg-ink-800">
            <Sparkles className="h-5 w-5 text-neon-500" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">
              AI-first fantasy football assistant
            </h2>
            <p className="text-sm text-gray-500">
              Not a dashboard — a conversation
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-gray-400">
          Fantasy Football AI is a chat-first assistant for managing
          your fantasy team. Instead of digging through stats and
          projections, you ask questions in plain English and upload
          screenshots of your roster, matchups, waiver wire, or trade
          offers. The AI returns researched start/sit decisions,
          sleeper picks, trade analysis, and weekly matchup strategy.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Feature
          icon={<Upload className="h-4 w-4" />}
          title="Screenshot Analysis"
          desc="Upload your roster, matchup, or trade offer for instant analysis."
        />

        <Feature
          icon={<MessagesSquare className="h-4 w-4" />}
          title="Natural Language"
          desc="Ask who to start or sit and receive a researched recommendation."
        />

        <Feature
          icon={<Scale className="h-4 w-4" />}
          title="Trade Analysis"
          desc="Compare player value, roster impact, risk, and potential upside."
        />

        <Feature
          icon={<Swords className="h-4 w-4" />}
          title="Matchup Strategy"
          desc="Evaluate lineup decisions, player matchups, and high-upside gambles."
        />

        <Feature
          icon={<ImagePlus className="h-4 w-4" />}
          title="Tracked Predictions"
          desc="Record actionable recommendations and compare them with actual results."
        />

        <Feature
          icon={<Sparkles className="h-4 w-4" />}
          title="Saved Team Context"
          desc="Use saved roster and league settings in future conversations."
        />
      </div>

      <div className="mt-4 rounded-lg border border-ink-600 bg-ink-850 px-4 py-3 text-xs text-gray-400">
        Fantasy Football AI uses live web research, player data, saved
        league settings, roster context, screenshot analysis, and
        tracked recommendations to provide current fantasy-football
        guidance. Yahoo Fantasy syncing is coming soon.
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-850 p-4">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-neon-500">
        {icon}
      </div>

      <h3 className="text-sm font-semibold text-white">
        {title}
      </h3>

      <p className="mt-1 text-xs text-gray-400">
        {desc}
      </p>
    </div>
  );
}