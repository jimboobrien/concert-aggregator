import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cookie interface for typed cookie operations
 */
interface Cookie {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Creates a Supabase client for server-side use.
 * 
 * This function creates a Supabase client that can be used in:
 * - Server Actions
 * - Route Handlers
 * - Server Components (with cookie handling limitations)
 * 
 * The cookie handling pattern safely manages cookie operations for authentication,
 * properly handling potential errors when used in Server Components where
 * cookie mutations are not allowed after the response headers have been sent.
 * 
 * @returns Supabase client configured for server-side usage
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Get all cookies from the cookie store
         * This operation is always safe in all contexts
         */
        getAll() {
          return cookieStore.getAll();
        },
        
        /**
         * Set multiple cookies in the cookie store
         * 
         * This operation safely handles cookie setting with proper error handling:
         * - Works normally in Server Actions and Route Handlers
         * - Gracefully handles errors in Server Components
         * 
         * @param cookiesToSet - Array of cookies to set
         */
        setAll(cookiesToSet) {
          try {
            for (const cookie of cookiesToSet) {
              cookieStore.set(cookie);
            }
          } catch (error: unknown) {
            // Cookie setting exceptions occur in Server Components after
            // the response headers have been sent. This is expected behavior
            // and can be safely ignored as the Next.js middleware or a client-side
            // redirect will handle session refresh.
            
            // Log for debugging but don't throw - this prevents breaking the user experience
            console.warn(
              "Cookie setting was attempted in a Server Component after headers were sent. " +
              "This is expected and can be safely ignored if you're using middleware for auth."
            );
            
            // We could add more granular error handling here if needed
            if (process.env.NODE_ENV === 'development') {
              console.debug("Cookie setting error details:", error);
            }
          }
        },
      },
    }
  );
};

/**
 * Creates a Supabase client specifically for Server Components.
 * 
 * This version includes enhanced cookie handling with specialized error handling
 * for cookie operations that might fail in Server Components.
 * 
 * @returns Supabase client with enhanced error handling for Server Components
 */
export async function createServerComponentClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Get all cookies as properly typed objects
         */
        getAll() {
          return cookieStore.getAll().map((cookie): Cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        
        /**
         * Set multiple cookies with safe error handling
         * 
         * @param cookiesToSet - Array of cookies to set
         */
        setAll(cookiesToSet) {
          try {
            for (const cookie of cookiesToSet) {
              cookieStore.set(cookie);
            }
          } catch (error: unknown) {
            // Handle error safely without breaking the application
            console.warn(
              "Failed to set cookies in a Server Component. " +
              "This is expected and can be safely ignored if you're using middleware for auth."
            );
            
            if (process.env.NODE_ENV === 'development') {
              console.debug("Cookie setting error details:", error);
            }
          }
        }
      },
    }
  );
}

