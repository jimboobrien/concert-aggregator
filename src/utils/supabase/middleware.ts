import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware to handle authentication session management
 * 
 * This middleware serves several critical purposes in the authentication flow:
 * 1. Refreshes authentication tokens automatically when needed
 * 2. Maintains session state across server actions and page navigations
 * 3. Redirects unauthenticated users away from protected routes
 * 4. Ensures cookies are properly set in both the request and response
 * 
 * The middleware executes on every matched request and works together with
 * server actions to provide a seamless authentication experience.
 *
 * @param request The incoming Next.js request
 * @returns A response with updated cookies and potential redirects
 */
export async function updateSession(request: NextRequest) {
  // Create initial response - we'll modify this with cookies later
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Get the request URL to check paths
  const requestUrl = new URL(request.url);
  const path = requestUrl.pathname;
  
  // Public paths that don't require authentication
  const isPublicPath = 
    path.startsWith('/login') || 
    path.startsWith('/auth') || 
    path.startsWith('/forgot-password') ||
    path.startsWith('/update-password') ||
    path === '/';
  
  // API paths that should bypass the middleware (like server actions)
  const isApiPath = path.startsWith('/api/');
  
  // Create a Supabase client for the middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Get all cookies from the request
         */
        getAll() {
          return request.cookies.getAll();
        },
        
        /**
         * Set cookies on both the request and response
         * 
         * This is critical for maintaining the session across
         * server actions and page navigations
         */
        setAll(cookiesToSet) {
          // Set cookies on the request
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({
              name,
              value,
              ...options,
            });
          });
          
          // Set cookies on the response
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          });
        },
      },
    }
  );

  // CRITICAL: Avoid any logic between client creation and auth.getUser()
  // Adding code here could cause unexpected authentication issues
  
  // Get the current user (this also triggers token refresh if needed)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError) {
    console.warn('Error getting user in middleware:', userError.message);
  }
  
  // Handle authentication redirects
  // Skip for API routes to allow server actions to handle their own auth
  if (!isApiPath && !isPublicPath && !user) {
    // User is not authenticated and trying to access a protected route
    // Redirect to login page with the original URL as a redirect parameter
    const redirectUrl = new URL('/login', requestUrl.origin);
    // Add the current URL as a redirect parameter (except for API routes)
    if (!path.startsWith('/api/')) {
      redirectUrl.searchParams.set('redirectTo', requestUrl.pathname + requestUrl.search);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // IMPORTANT: Return the response with all cookies properly set
  // This ensures the authentication state is maintained correctly
  return response;
}
