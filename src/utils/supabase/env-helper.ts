/**
 * Helper functions to validate environment variables
 */

export function checkSupabaseEnvVars(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url) {
    console.error('NEXT_PUBLIC_SUPABASE_URL is not defined in your environment');
    return false;
  }
  
  if (!anonKey) {
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in your environment');
    return false;
  }
  
  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not defined in your environment');
    console.error('This key is required for admin operations and should be in your .env.local file');
    return false;
  }
  
  return true;
}

export function logEnvStatus(): void {
  const envVars = {
    'NEXT_PUBLIC_SUPABASE_URL': Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    'SUPABASE_SERVICE_ROLE_KEY': Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  };
  
  console.log('Environment variables status:', envVars);
} 