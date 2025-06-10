import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { checkSupabaseEnvVars, logEnvStatus } from './env-helper';

// This client should only be used in server-side contexts
// (like server actions) where admin privileges are needed
export const createAdminClient = () => {
  // Make sure we're in a server context
  if (typeof window !== 'undefined') {
    throw new Error('Admin client should only be used in server-side code');
  }

  // Check environment variables with helpful error messages
  if (!checkSupabaseEnvVars()) {
    logEnvStatus();
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Make sure you have added SUPABASE_SERVICE_ROLE_KEY to your .env.local file ' +
      'and restarted your development server.'
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}; 