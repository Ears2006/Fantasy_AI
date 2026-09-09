// Mock authentication service.
// Structured so real Supabase email/password auth can replace it later
// without changing component signatures.

import type { MockUser } from '@/types';

/**
 * // TODO-INTEGRATION: AUTH_DATABASE_PERSISTENCE
 *
 * FUTURE IMPLEMENTATION:
 * 1. Replace mock* functions with Supabase auth calls:
 *    - signIn -> supabase.auth.signInWithPassword()
 *    - signUp -> supabase.auth.signUp()
 *    - signOut -> supabase.auth.signOut()
 *    - getSession -> supabase.auth.getSession() + onAuthStateChange()
 * 2. Persist chat sessions to a Supabase table (RLS scoped to auth.uid()).
 * 3. Store Yahoo connection + tokens in a secure table / vault.
 *
 * INPUT:  email + password (sign in/up), session token (get session).
 * OUTPUT: MockUser | null — the shape the sidebar + app shell expect.
 * MOCK REPLACEMENT: this file (mockAuthService.ts).
 */
export async function mockSignIn(email: string, _password: string): Promise<MockUser> {
  await delay(700);
  return {
    id: 'mock-user-1',
    email,
    displayName: email.split('@')[0] || 'Manager',
  };
}

export async function mockSignUp(email: string, _password: string): Promise<MockUser> {
  await delay(800);
  return {
    id: 'mock-user-1',
    email,
    displayName: email.split('@')[0] || 'Manager',
  };
}

export async function mockSignOut(): Promise<void> {
  await delay(300);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
