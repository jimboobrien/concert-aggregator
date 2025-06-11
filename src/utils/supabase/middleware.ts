import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  try {
    // This `try/catch` block is only here for the interactive tutorial.
    // Feel free to remove it from your code.
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // If the cookie is updated, update the cookies for the request and response
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            // If the cookie is removed, update the cookies for the request and response
            request.cookies.delete({
              name,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.delete({
              name,
              ...options,
            })
          },
        },
      }
    )

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
    const { data } = await supabase.auth.getUser()
    const user = data?.user

    // If we're on a protected route and have no user, redirect to login
    if (!user) {
      const path = request.nextUrl.pathname

      // Check if the route is a protected route
      if (isProtectedRoute(path)) {
        return NextResponse.redirect(new URL('/sign-in', request.url))
      }
    } else {
      // If we have a user and they're trying to access auth routes, redirect them to the dashboard
      const path = request.nextUrl.pathname
      if (isAuthRoute(path)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return response
  } catch {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

// Helper function to check if a route should be protected
function isProtectedRoute(path: string): boolean {
  const protectedRoutes = ['/dashboard', '/profile', '/settings']
  return protectedRoutes.some((route) => path.startsWith(route))
}

// Helper function to check if a route is an auth route
function isAuthRoute(path: string): boolean {
  const authRoutes = ['/sign-in', '/sign-up', '/forgot-password']
  return authRoutes.some((route) => path === route)
}
