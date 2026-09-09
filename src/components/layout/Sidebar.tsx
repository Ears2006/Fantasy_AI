import {
  CircleHelp,
  Info,
  LayoutGrid,
  LogIn,
  LogOut,
  MessageSquarePlus,
  Settings as SettingsIcon,
  Settings2,
  Shield,
  Trophy,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useApp, type AppPage } from '@/state/AppContext';
import type { ChatSession } from '@/types';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onSignIn: () => void;
  onCreateAccount: () => void;
}

export function Sidebar({
  open,
  onClose,
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onSignIn,
  onCreateAccount,
}: SidebarProps) {
  const { user, yahoo, signOut, setPage } = useApp();

  const navTo = (page: AppPage) => {
    setPage(page);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r border-ink-700 bg-ink-900 transition-transform duration-300 ease-out md:z-20 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-ink-700 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-neon-500/40 bg-ink-850">
              <span className="font-mono text-xs font-bold text-neon-500">FF</span>
            </div>
            <span className="text-sm font-semibold text-white">Fantasy Football AI</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-ink-750 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:border-neon-500/40 hover:bg-ink-750 hover:text-white"
          >
            <MessageSquarePlus className="h-4 w-4 text-neon-500" />
            New Chat
          </button>
        </div>

        {/* Recent sessions (signed in) */}
        {user && sessions.length > 0 && (
          <div className="flex-1 overflow-y-auto px-3 pb-2">
            <p className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              Recent Chats
            </p>
            <ul className="space-y-0.5">
              {sessions.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => {
                      onSelectSession(s.id);
                      onClose();
                    }}
                    className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                      s.id === activeSessionId
                        ? 'bg-ink-750 text-white'
                        : 'text-gray-400 hover:bg-ink-800 hover:text-gray-200'
                    }`}
                  >
                    <span className="truncate">{s.title || 'New Chat'}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(s.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          onDeleteSession(s.id);
                        }
                      }}
                      className="ml-2 hidden h-5 w-5 shrink-0 items-center justify-center rounded text-gray-500 hover:text-neon-400 group-hover:flex"
                      aria-label="Delete chat"
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3">
          {user ? (
            <ul className="space-y-0.5">
              <SidebarItem icon={<LayoutGrid className="h-4 w-4" />} label="My Team" onClick={() => navTo('my-team')} />
              <SidebarItem icon={<Trophy className="h-4 w-4" />} label="League" onClick={() => navTo('league')} />
              <SidebarItem icon={<Settings2 className="h-4 w-4" />} label="League Settings" onClick={() => navTo('league-settings')} />
              <SidebarItem icon={<SettingsIcon className="h-4 w-4" />} label="Settings" onClick={() => navTo('settings')} />
              <YahooStatus connected={yahoo.connected} />
            </ul>
          ) : (
            <ul className="space-y-0.5">
              <SidebarItem icon={<LogIn className="h-4 w-4" />} label="Sign In" onClick={onSignIn} />
              <SidebarItem icon={<UserPlus className="h-4 w-4" />} label="Create Account" onClick={onCreateAccount} />
              <SidebarItem icon={<Info className="h-4 w-4" />} label="About" onClick={() => navTo('about')} />
              <SidebarItem icon={<CircleHelp className="h-4 w-4" />} label="How It Works" onClick={() => navTo('how-it-works')} />
            </ul>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-ink-700 p-3">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 px-2 py-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-gray-200">
                  {user.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{user.displayName}</p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  void signOut();
                  onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-400 transition-colors hover:bg-ink-800 hover:text-neon-400"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500">
              <Shield className="h-3.5 w-3.5" />
              <span>Signed out — chat works without an account.</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function SidebarItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-400 transition-colors hover:bg-ink-800 hover:text-white"
      >
        <span className="text-gray-500">{icon}</span>
        {label}
      </button>
    </li>
  );
}

function YahooStatus({ connected }: { connected: boolean }) {
  return (
    <li className="mt-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-gray-500" />
        <span className="text-xs font-medium text-gray-400">Yahoo Fantasy</span>
        <span
          className={`ml-auto flex items-center gap-1.5 text-xs font-medium ${
            connected ? 'text-emerald-400' : 'text-gray-500'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected ? 'bg-emerald-400' : 'bg-gray-600'
            }`}
          />
          {connected ? 'Connected' : 'Not Connected'}
        </span>
      </div>
      {connected && (
        <p className="mt-1.5 flex items-center gap-1.5 pl-6 text-xs text-gray-500">
          <Zap className="h-3 w-3 text-neon-500" />
          Syncing Example League
        </p>
      )}
    </li>
  );
}


