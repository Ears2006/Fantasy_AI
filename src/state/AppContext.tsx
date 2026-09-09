// Global app state: mock auth user + Yahoo connection status + navigation.
// Yahoo connection now uses the REAL OAuth flow through the edge function.
// League selection and team context are tracked for future AI tools.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { MockUser, YahooConnection, ProviderLeague, ProviderTeam, LeagueScoringSettings } from '@/types';
import { mockSignIn, mockSignUp, mockSignOut } from '@/services/auth/mockAuthService';
import {
  connectYahoo as doConnectYahoo,
  disconnectYahoo as doDisconnectYahoo,
  checkConnectionStatus,
  getYahooLeagues,
  getYahooLeagueSettings,
  getYahooUserTeam,
} from '@/services/yahoo/yahooService';

export type AppPage = 'chat' | 'my-team' | 'league' | 'league-settings' | 'settings' | 'about' | 'how-it-works';

interface AppState {
  user: MockUser | null;
  yahoo: YahooConnection;
  yahooLeagues: ProviderLeague[];
  selectedLeague: ProviderLeague | null;
  selectedLeagueSettings: LeagueScoringSettings | null;
  yahooUserTeam: ProviderTeam | null;
  page: AppPage;
  yahooLoading: boolean;
  yahooError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  connectYahoo: () => Promise<void>;
  disconnectYahoo: () => Promise<void>;
  selectYahooLeague: (league: ProviderLeague) => Promise<void>;
  refreshYahooStatus: () => Promise<void>;
  setPage: (page: AppPage) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [yahoo, setYahoo] = useState<YahooConnection>({ connected: false, status: 'disconnected' });
  const [yahooLeagues, setYahooLeagues] = useState<ProviderLeague[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<ProviderLeague | null>(null);
  const [selectedLeagueSettings, setSelectedLeagueSettings] = useState<LeagueScoringSettings | null>(null);
  const [yahooUserTeam, setYahooUserTeam] = useState<ProviderTeam | null>(null);
  const [page, setPage] = useState<AppPage>('chat');
  const [yahooLoading, setYahooLoading] = useState(false);
  const [yahooError, setYahooError] = useState<string | null>(null);

  // Check Yahoo connection status on mount (cookie-based session)
  const refreshYahooStatus = useCallback(async () => {
    setYahooLoading(true);
    setYahooError(null);
    try {
      const conn = await checkConnectionStatus();
      setYahoo(conn);
      if (conn.connected) {
        // Auto-fetch leagues if connected
        try {
          const leagues = await getYahooLeagues();
          setYahooLeagues(leagues);
        } catch (e) {
          setYahooError(e instanceof Error ? e.message : 'Failed to load Yahoo leagues.');
        }
      } else {
        setYahooLeagues([]);
        setSelectedLeague(null);
        setSelectedLeagueSettings(null);
        setYahooUserTeam(null);
      }
    } catch {
      // Status check failed — leave as disconnected
    } finally {
      setYahooLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshYahooStatus();
  }, [refreshYahooStatus]);

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
    setYahoo({ connected: false, status: 'disconnected' });
    setYahooLeagues([]);
    setSelectedLeague(null);
    setSelectedLeagueSettings(null);
    setYahooUserTeam(null);
    setPage('chat');
  }, []);

  const connectYahoo = useCallback(async () => {
    setYahooLoading(true);
    setYahooError(null);
    try {
      const conn = await doConnectYahoo();
      setYahoo(conn);
      if (conn.connected) {
        // Fetch leagues after successful connection
        try {
          const leagues = await getYahooLeagues();
          setYahooLeagues(leagues);
        } catch (e) {
          setYahooError(e instanceof Error ? e.message : 'Failed to load Yahoo leagues.');
        }
      }
    } catch (e) {
      setYahooError(e instanceof Error ? e.message : 'Yahoo connection failed.');
      setYahoo({ connected: false, status: 'error', error: e instanceof Error ? e.message : 'Connection failed.' });
    } finally {
      setYahooLoading(false);
    }
  }, []);

  const disconnectYahoo = useCallback(async () => {
    setYahooLoading(true);
    try {
      const conn = await doDisconnectYahoo();
      setYahoo(conn);
      setYahooLeagues([]);
      setSelectedLeague(null);
      setSelectedLeagueSettings(null);
      setYahooUserTeam(null);
    } catch {
      setYahooError('Failed to disconnect Yahoo.');
    } finally {
      setYahooLoading(false);
    }
  }, []);

  const selectYahooLeague = useCallback(async (league: ProviderLeague) => {
    setSelectedLeague(league);
    setYahooLoading(true);
    setYahooError(null);
    try {
      // Fetch league settings
      const settings = await getYahooLeagueSettings(league.providerLeagueId);
      setSelectedLeagueSettings(settings.scoring);

      // Fetch user's team in this league
      const team = await getYahooUserTeam(league.providerLeagueId);
      setYahooUserTeam(team);
    } catch (e) {
      setYahooError(e instanceof Error ? e.message : 'Failed to load league data.');
    } finally {
      setYahooLoading(false);
    }
  }, []);

  const value = useMemo<AppState>(
    () => ({
      user, yahoo, yahooLeagues, selectedLeague, selectedLeagueSettings, yahooUserTeam,
      page, yahooLoading, yahooError,
      signIn, signUp, signOut, connectYahoo, disconnectYahoo,
      selectYahooLeague, refreshYahooStatus, setPage,
    }),
    [user, yahoo, yahooLeagues, selectedLeague, selectedLeagueSettings, yahooUserTeam,
      page, yahooLoading, yahooError,
      signIn, signUp, signOut, connectYahoo, disconnectYahoo,
      selectYahooLeague, refreshYahooStatus],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
