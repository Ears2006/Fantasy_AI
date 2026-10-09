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
import { supabase } from '@/lib/supabase';
import {
  clearSupabaseMessages,
  deleteSupabaseMessage,
  deleteSupabaseSession,
  getChatUserId,
  loadSupabaseChats,
  saveSupabaseMessage,
  saveSupabaseSession,
} from '@/services/chat/chatPersistenceService';

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
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const hydrated = useRef(false);

  // Load chats from Supabase for signed-in users.
// Guests continue using localStorage.
useEffect(() => {
  let active = true;
  let loadedUserId: string | null | undefined;

  const hydrateChats = async (userId: string | null) => {
    if (!active || loadedUserId === userId) return;

    loadedUserId = userId;
    hydrated.current = false;
    setChatUserId(userId);

    try {
      const loaded = userId
        ? await loadSupabaseChats(userId)
        : loadSessions();

      const loadedActive = loadActiveId();

      if (!active) return;

      const fresh = newSession();

setSessions(
  loaded.length > 0
    ? [fresh, ...loaded]
    : [fresh],
);

setActiveId(fresh.id);
    } catch (error) {
      console.error('Unable to load saved chats:', error);

      if (!active) return;

      const fresh = newSession();
      setSessions([fresh]);
      setActiveId(fresh.id);
    } finally {
      if (active) hydrated.current = true;
    }
  };

  void getChatUserId().then((userId) => {
    void hydrateChats(userId);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    void hydrateChats(session?.user?.id ?? null);
  });

  return () => {
    active = false;
    subscription.unsubscribe();
  };
}, []);
  // Guests keep their chats in localStorage.
useEffect(() => {
  if (!hydrated.current || chatUserId) return;
  saveSessions(sessions);
}, [sessions, chatUserId]);

// Signed-in users save their sessions and messages to Supabase.
useEffect(() => {
  if (!hydrated.current || !chatUserId) return;

  const syncChats = async () => {
    try {
      for (const session of sessions) {
        await saveSupabaseSession(session, chatUserId);

        const savedMessages = session.messages.filter(
          (message) => !message.pending,
        );

        for (const message of savedMessages) {
          await saveSupabaseMessage(session.id, message);
        }
      }
    } catch (error) {
      console.error('Unable to save chat history:', error);
    }
  };

  void syncChats();
}, [sessions, chatUserId]);
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
    if (chatUserId) {
      void deleteSupabaseSession(id).catch((error) => {
        console.error('Unable to delete saved chat:', error);
      });
    }

    setSessions((prev) => {
      const next = prev.filter((session) => session.id !== id);

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
  [activeId, chatUserId],
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
    if (chatUserId) {
      void deleteSupabaseMessage(id).catch((error) => {
        console.error('Unable to delete saved message:', error);
      });
    }

    setSessions((prev) =>
      prev.map((session) =>
        session.id !== activeId
          ? session
          : {
              ...session,
              messages: session.messages.filter(
                (message) => message.id !== id,
              ),
              updatedAt: Date.now(),
            },
      ),
    );
  },
  [activeId, chatUserId],
);

  const clearActive = useCallback(() => {
  if (activeId && chatUserId) {
    void clearSupabaseMessages(activeId).catch((error) => {
      console.error('Unable to clear saved messages:', error);
    });
  }

  setSessions((prev) =>
    prev.map((session) =>
      session.id === activeId
        ? {
            ...session,
            messages: [],
            title: 'New Chat',
            updatedAt: Date.now(),
          }
        : session,
    ),
  );
}, [activeId, chatUserId]);

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
