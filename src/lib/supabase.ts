import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Export createClient function for API routes
export const createClient = (cookieStore?: any) => {
  // For API routes, we typically use the service role key for admin operations
  // The cookieStore parameter is accepted but not used in this implementation
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};
