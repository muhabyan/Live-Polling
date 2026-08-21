import { createClient } from '@supabase/supabase-js';

// Default to user's Supabase project URL if environment variables are not injected
const DEFAULT_SUPABASE_URL = 'https://aqxugxqxummmufwulcby.supabase.co';
// Fallback anonymous placeholder token so createClient never crashes on initial launch
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxeHVneHF4dW1tbXVmd3VsY2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwMDAwMDAsImV4cCI6MjA1NTU3NjAwMH0.placeholder';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY;

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
