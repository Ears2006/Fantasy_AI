import { Menu, UserCircle } from 'lucide-react';
import { useApp, type AppPage } from '@/state/AppContext';

interface TopBarProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
  onNewChat: () => void;
  onSignIn: () => void;
  signedIn: boolean;
}

export function TopBar({ onMenuClick, sidebarOpen, onNewChat, onSignIn, signedIn }: TopBarProps) {
  const { setPage } = useApp();

  const handleFfClick = () => {
    onNewChat();
  };

  const handleAccountClick = () => {
    if (signedIn) {
      setPage('settings');
    } else {
      onSignIn();
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ink-700 bg-ink-950/80 px-3 backdrop-blur-md sm:px-4">
      {/* Menu toggle — always uses a menu icon, never an X */}
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-ink-750 hover:text-white sm:h-10 sm:w-10"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* FF logo — always creates a brand-new conversation */}
      <button
        onClick={handleFfClick}
        className="group flex items-center gap-2"
        aria-label="Start a new Fantasy Football AI chat"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-neon-500/40 bg-ink-850 transition-colors group-hover:border-neon-500/70">
          <span className="font-mono text-xs font-bold text-neon-500">FF</span>
        </div>
        <span className="hidden text-sm font-semibold tracking-tight text-white sm:inline">
          Fantasy Football AI
        </span>
      </button>

      {/* Account / profile icon */}
      <button
        onClick={handleAccountClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-ink-750 hover:text-white sm:h-10 sm:w-10"
        aria-label={signedIn ? 'Account settings' : 'Sign in'}
      >
        <UserCircle className="h-5 w-5" />
      </button>
    </header>
  );
}

export type { AppPage };
