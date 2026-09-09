// Global app state: mock auth user + Yahoo connection status + navigation.
// Structured so Supabase auth + real Yahoo OAuth can replace the internals
// without changing the consumer API.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { MockUser, YahooConnection } from '@/types';
import { mockSignIn, mockSignUp, mockSignOut } from '@/services/auth/mockAuthService';
import { connectYahooFantasy, disconnectYahooFantasy } from '@/services/yahoo/yahooService';

export type AppPage = 'chat' | 'my-team' | 'league' | 'league-settings' | 'settings' | 'about' | 'how-it-works';

interface AppState {
  user: MockUser | null;
  yahoo: YahooConnection;
  page: AppPage;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  connectYahoo: () => Promise<void>;
  disconnectYahoo: () => Promise<void>;
  setPage: (page: AppPage) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [yahoo, setYahoo] = useState<YahooConnection>({ connected: false });
  const [page, setPage] = useState<AppPage>('chat');

  const signIn = useCallback(async (email: string, password: string) => {
    const u = await mockSignIn(email, password);
    setUser(u);
    setPage('chat');
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const u = await mockSignUp(email, password);
    setUser(u);
    setPage('chat');
  }, []);

  const signOut = useCallback(async () => {
    await mockSignOut();
    setUser(null);
    setYahoo({ connected: false });
    setPage('chat');
  }, []);

  const connectYahoo = useCallback(async () => {
    const conn = await connectYahooFantasy();
    setYahoo(conn);
  }, []);

  const disconnectYahoo = useCallback(async () => {
    const conn = await disconnectYahooFantasy();
    setYahoo(conn);
  }, []);

  const value = useMemo<AppState>(
    () => ({ user, yahoo, page, signIn, signUp, signOut, connectYahoo, disconnectYahoo, setPage }),
    [user, yahoo, page, signIn, signUp, signOut, connectYahoo, disconnectYahoo],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
