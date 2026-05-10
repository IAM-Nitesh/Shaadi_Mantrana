import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
