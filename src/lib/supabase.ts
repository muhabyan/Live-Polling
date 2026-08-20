import { createClient } from '@supabase/supabase-js';

// Default to user's Supabase project if environment variables are not injected at build time
const DEFAULT_SUPABASE_URL = 'https://aqxugxqxummmufwulcby.supabase.co';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
