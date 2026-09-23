import type { User } from '@supabase/supabase-js';
import type { MockUser } from '@/types';
import { supabase } from '@/lib/supabase';

function mapSupabaseUser(user: User): MockUser {
  const email = user.email ?? '';

  return {
    id: user.id,
    email,
    displayName:
      user.user_metadata?.display_name ??
      email.split('@')[0] ??
      'Manager',
  };
}

export async function mockSignIn(
  email: string,
  password: string
): Promise<MockUser> {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Supabase did not return a user.');
  }

  return mapSupabaseUser(data.user);
}

export async function mockSignUp(
  email: string,
  password: string
): Promise<MockUser> {
  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
    });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Supabase did not create the user.');
  }

  if (!data.session) {
    throw new Error(
      'Account created. Check your email to confirm your account, then sign in.'
    );
  }

  return mapSupabaseUser(data.user);
}

export async function mockSignOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}