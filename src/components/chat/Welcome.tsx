import { ImagePlus, Sparkles } from 'lucide-react';
import { useRef } from 'react';

interface WelcomeProps {
  onUploadClick: () => void;
  onSuggestion: (text: string) => void;
}

const suggestions = [
  'Start / Sit',
  'Waiver Targets',
  'Trade Advice',
  'Weekly Matchup',
  'Sleepers',
];

export function Welcome({ onUploadClick, onSuggestion }: WelcomeProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-8 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-neon-500/30 bg-ink-850 shadow-lg shadow-neon-500/5">
        <Sparkles className="h-7 w-7 text-neon-500" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Fantasy Football AI
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-400 text-balance">
        Let's take a look at your team. Upload a screenshot of your roster, weekly matchup, waiver
        wire, or trade offer — or just ask below.
      </p>

      {/* Upload button */}
      <button
        onClick={onUploadClick}
        className="group mt-6 flex w-full max-w-md items-center justify-center gap-2.5 rounded-xl border border-neon-500/30 bg-neon-500/5 px-4 py-3.5 text-sm font-medium text-neon-200 transition-all hover:border-neon-500/50 hover:bg-neon-500/10 hover:shadow-lg hover:shadow-neon-500/10"
      >
        <ImagePlus className="h-5 w-5 text-neon-400 transition-transform group-hover:scale-110" />
        Upload Roster / Matchup / Waiver / Trade Screenshot
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" />

      {/* Suggestion shortcuts */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="rounded-full border border-ink-600 bg-ink-850 px-3.5 py-1.5 text-xs font-medium text-gray-300 transition-all hover:border-neon-500/40 hover:bg-ink-800 hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>

      <p className="mt-6 text-xs text-gray-600">
        Demo mode — analysis uses mock data. No account required.
      </p>
    </div>
  );
}
