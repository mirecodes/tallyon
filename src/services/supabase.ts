import { createClient } from '@supabase/supabase-js';

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
