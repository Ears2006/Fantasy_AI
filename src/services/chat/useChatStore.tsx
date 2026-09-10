// Chat state hook + localStorage persistence.
// The storage layer is isolated here so a Supabase table can replace it
// later without touching components (see TODO-INTEGRATION: AUTH_DATABASE_PERSISTENCE).
//
// IMPORTANT: This is a shared context, not a per-component hook.
// useChatStore() is called once in App.tsx via ChatProvider and consumed
// everywhere through useChat(). This prevents multiple state instances
// from going out of sync.

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ChatMessage, ChatSession } from '@/types';
import { uid } from '@/services/utils/uid';

const STORAGE_KEY = 'ffa.chat.sessions.v1';
const ACTIVE_KEY = 'ffa.chat.activeId.v1';

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatSession[];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]): void {
  try {
    // Strip pending messages before persisting — they're transient.
    const clean = sessions.map((s) => ({
      ...s,
      messages: s.messages.filter((m) => !m.pending),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch {
    // localStorage may be unavailable; fail silently.
  }
}

function loadActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

function saveActiveId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // ignore
  }
}

function newSession(): ChatSession {
  const now = Date.now();
  return {
    id: uid(),
    title: 'New Chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

interface ChatStoreValue {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  activeId: string | null;
  createNewSession: () => string;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  clearActive: () => void;
}

const ChatContext = createContext<ChatStoreValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const hydrated = useRef(false);

  // Hydrate from localStorage on mount.
  // Restore the last active conversation — do NOT create a new one
  // unless there are genuinely no conversations to restore.
  useEffect(() => {
    const loaded = loadSessions();
    const loadedActive = loadActiveId();

    if (loaded.length > 0) {
      setSessions(loaded);
      // Restore the active conversation if it still exists.
      if (loadedActive && loaded.some((s) => s.id === loadedActive)) {
        setActiveId(loadedActive);
      } else {
        // Active ID is stale or missing — fall back to the most
        // recently updated conversation rather than creating a new one.
        const mostRecent = [...loaded].sort((a, b) => b.updatedAt - a.updatedAt)[0];
        setActiveId(mostRecent.id);
      }
    } else {
      // No conversations exist — create one fresh.
      const fresh = newSession();
      setSessions([fresh]);
      setActiveId(fresh.id);
    }
    hydrated.current = true;
  }, []);

  // Persist on change (after hydration).
  useEffect(() => {
    if (!hydrated.current) return;
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    if (!hydrated.current) return;
    saveActiveId(activeId);
  }, [activeId]);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  const createNewSession = useCallback(() => {
    const fresh = newSession();
    setSessions((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    return fresh.id;
  }, []);

  const selectSession = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (next.length === 0) {
          const fresh = newSession();
          setActiveId(fresh.id);
          return [fresh];
        }
        if (id === activeId) {
          setActiveId(next[0].id);
        }
        return next;
      });
    },
    [activeId],
  );

  const addMessage = useCallback(
    (message: ChatMessage) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          const isFirstUserMsg = message.kind === 'user' && s.messages.length === 0;
          return {
            ...s,
            title: isFirstUserMsg && message.text ? message.text.slice(0, 40) : s.title,
            messages: [...s.messages, message],
            updatedAt: Date.now(),
          };
        }),
      );
    },
    [activeId],
  );

  const updateMessage = useCallback(
    (id: string, patch: Partial<ChatMessage>) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          return {
            ...s,
            messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
            updatedAt: Date.now(),
          };
        }),
      );
    },
    [activeId],
  );

  const removeMessage = useCallback(
    (id: string) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id !== activeId
            ? s
            : { ...s, messages: s.messages.filter((m) => m.id !== id), updatedAt: Date.now() },
        ),
      );
    },
    [activeId],
  );

  const clearActive = useCallback(() => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeId ? { ...s, messages: [], title: 'New Chat' } : s)),
    );
  }, [activeId]);

  const value: ChatStoreValue = {
    sessions,
    activeSession,
    activeId,
    createNewSession,
    selectSession,
    deleteSession,
    addMessage,
    updateMessage,
    removeMessage,
    clearActive,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatStoreValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
