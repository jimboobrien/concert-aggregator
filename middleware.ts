import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

/**
 * Next.js Middleware for Authentication and Session Management
 * 
 * This middleware runs on every matched request and is responsible for:
 * 1. Refreshing authentication tokens when they expire
 * 2. Redirecting unauthenticated users to the login page
 * 3. Managing session cookies for both page navigations and server actions
 * 
 * Authentication Flow:
 * - When a user accesses the site, this middleware runs first
 * - If the user has valid auth cookies, their session is maintained
 * - If tokens are expired, they are automatically refreshed
 * - If the user is not authenticated and tries to access a protected route,
 *   they are redirected to the login page
 * 
 * Server Actions Integration:
 * - Server actions operate within this authentication context
 * - When server actions modify cookies, the middleware ensures they're properly set
 * - API routes that implement server actions are exempt from redirect logic
 * 
 * @param request The incoming Next.js request
 * @returns A response with updated cookies and potential redirects
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 