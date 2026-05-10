import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Lazy client — only initializes when URL is available (client-side)
let _supabase: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');
  }
  return _supabase;
};

// Backward-compatible export
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_, prop) => getSupabaseClient()[prop as keyof SupabaseClient],
});

/**
 * Chat Channel Logic
 * We use Supabase Realtime Channels to broadcast messages
 */
export const getChatChannel = (connectionId: string) => {
  return supabase.channel(`chat:${connectionId}`, {
    config: {
      broadcast: { self: true },
      presence: { key: 'user' },
    },
  });
};
