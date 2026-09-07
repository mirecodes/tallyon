import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

// Environment variables for Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

/**
 * Global Supabase Client instance
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Ensure user authentication via Anonymous sign-in or existing active session.
 * Returns the authenticated user's UUID.
 */
export async function ensureAuthUser(): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // 1. Check existing session
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user?.id) {
    return sessionData.session.user.id;
  }

  // 2. Sign in anonymously if no session exists
  const { data: authData, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error('Failed to sign in anonymously with Supabase:', error);
    throw error;
  }

  if (!authData?.user?.id) {
    throw new Error('No user returned from Supabase anonymous sign-in.');
  }

  return authData.user.id;
}

/**
 * Trigger OAuth login with Google.
 * Redirects user to Google OAuth flow and returns back to current URL.
 */
export async function signInWithGoogle(): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const redirectUrl = window.location.origin + window.location.pathname;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error('Failed to initiate Google sign-in:', error);
    throw error;
  }
}

/**
 * Sign out of current Supabase session.
 */
export async function signOutUser(): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Failed to sign out:', error);
    throw error;
  }

  // Clear local storage cache
  try {
    localStorage.removeItem('@app/transactions');
    localStorage.removeItem('@app/budgets');
    localStorage.removeItem('@app/custom_categories_v1');
  } catch {}

  // Reload page to re-initialize fresh session
  window.location.reload();
}

/**
 * React hook to listen and track current Supabase user state
 */
export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get current session user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen to auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading, isConfigured: isSupabaseConfigured };
}
