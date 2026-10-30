import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Defensive URL normalization to handle any trailing or concatenated environment strings
const extractBaseUrl = (url: string): string => {
  if (!url) return '';
  const match = url.match(/(https:\/\/[a-z0-9-]+\.supabase\.co)/i);
  return match ? match[1] : url.trim();
};

export const supabaseUrl = extractBaseUrl(rawUrl);

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('placeholder')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
