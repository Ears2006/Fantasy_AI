import { useState } from 'react';
import { AppProvider, useApp } from '@/state/AppContext';
import { useChatStore } from '@/services/chat/useChatStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { AuthModal } from '@/components/auth/AuthModal';
import { ChatPage } from '@/pages/ChatPage';
import { MyTeamPage } from '@/pages/MyTeamPage';
import { LeaguePage } from '@/pages/LeaguePage';
import { LeagueSettingsPage } from '@/pages/LeagueSettingsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AboutPage } from '@/pages/AboutPage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';

function AppShell() {
  const { page } = useApp();
  const { sessions, activeId, createNewSession, selectSession, deleteSession } = useChatStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleSignIn = () => {
    setAuthMode('signin');
    setAuthOpen(true);
    setSidebarOpen(false);
  };

  const handleCreateAccount = () => {
    setAuthMode('signup');
    setAuthOpen(true);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeId}
        onNewChat={createNewSession}
        onSelectSession={selectSession}
        onDeleteSession={deleteSession}
        onSignIn={handleSignIn}
        onCreateAccount={handleCreateAccount}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setSidebarOpen((o) => !o)} sidebarOpen={sidebarOpen} />

        <main className="flex flex-1 overflow-hidden">
          {page === 'chat' && <ChatPage />}
          {page === 'my-team' && <div className="flex-1 overflow-y-auto"><MyTeamPage /></div>}
          {page === 'league' && <div className="flex-1 overflow-y-auto"><LeaguePage /></div>}
          {page === 'league-settings' && <div className="flex-1 overflow-y-auto"><LeagueSettingsPage /></div>}
          {page === 'settings' && <div className="flex-1 overflow-y-auto"><SettingsPage /></div>}
          {page === 'about' && <div className="flex-1 overflow-y-auto"><AboutPage /></div>}
          {page === 'how-it-works' && <div className="flex-1 overflow-y-auto"><HowItWorksPage /></div>}
        </main>
      </div>

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onSwitchMode={setAuthMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
