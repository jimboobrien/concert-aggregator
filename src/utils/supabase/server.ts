import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Keep track of refresh attempts to prevent multiple simultaneous refreshes
const refreshInProgress = new Map<string, Promise<void>>();

export const createClient = async () => {
  // Important: cookies() needs to be awaited properly to prevent warnings
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set: (name, value, options) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove: (name) => {
          try {
            cookieStore.delete(name);
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: false // We'll handle refresh manually to avoid race conditions
      }
    },
  );

  // Try to refresh the session if needed
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Only attempt to refresh if we have a session
    if (session && userId) {
      // Check if session is expired or about to expire (within 5 minutes)
      const isExpired = session.expires_at && new Date(session.expires_at * 1000) < new Date();
      const expiresIn = session.expires_at ? session.expires_at * 1000 - Date.now() : 0;
      const isExpiringSoon = expiresIn > 0 && expiresIn < 5 * 60 * 1000; // 5 minutes
      
      if (isExpired || isExpiringSoon) {
        // Check if refresh is already in progress for this user
        if (!refreshInProgress.has(userId)) {
          // Create a new refresh promise
          const refreshPromise = (async () => {
            try {
              // Refresh the session
              console.log(`Refreshing token for user ${userId} (expires in ${Math.round(expiresIn / 1000)}s)`);
              await supabase.auth.refreshSession();
              console.log(`Token refreshed successfully for user ${userId}`);
            } catch (refreshError) {
              console.error("Error refreshing session:", refreshError);
            } finally {
              // Remove the promise after a short delay to prevent immediate subsequent refresh attempts
              setTimeout(() => {
                refreshInProgress.delete(userId);
              }, 5000);
            }
          })();
          
          // Store the promise
          refreshInProgress.set(userId, refreshPromise);
          
          // Wait for the refresh to complete
          await refreshPromise;
        } else {
          // A refresh is already in progress, wait for it to complete
          console.log(`Waiting for existing token refresh for user ${userId}`);
          await refreshInProgress.get(userId);
        }
      }
    }
  } catch (error) {
    console.error("Error handling session:", error);
  }

  return supabase;
};
