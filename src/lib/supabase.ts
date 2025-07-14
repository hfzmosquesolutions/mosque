import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verify values are present
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check your .env file.'
  );
}

// Create a function to get storage that works in both client and server environments
function getStorage() {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  // Return a mock storage for server-side rendering
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: true,
    storage: getStorage(),
  },
});
