import { PanelLeftClose, X } from 'lucide-react';
import { useApp, type AppPage } from '@/state/AppContext';

interface TopBarProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export function TopBar({ onMenuClick, sidebarOpen }: TopBarProps) {
  const { setPage } = useApp();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ink-700 bg-ink-950/80 px-3 backdrop-blur-md sm:px-4">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-ink-750 hover:text-white sm:h-10 sm:w-10"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </button>

      <button
        onClick={() => setPage('chat')}
        className="group flex items-center gap-2"
        aria-label="Fantasy Football AI home"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-neon-500/40 bg-ink-850 transition-colors group-hover:border-neon-500/70">
          <span className="font-mono text-xs font-bold text-neon-500">FF</span>
        </div>
        <span className="hidden text-sm font-semibold tracking-tight text-white sm:inline">
          Fantasy Football AI
        </span>
      </button>
    </header>
  );
}

export type { AppPage };
