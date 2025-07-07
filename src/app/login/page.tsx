import { login, signup } from '@/actions/auth'
import Link from 'next/link'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message?: string; signup?: string; redirectTo?: string }
}) {
  const isSignup = searchParams?.signup === 'true'
  const redirectTo = searchParams?.redirectTo || '/account'

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card mt-5">
            <div className="card-body">
              <h1 className="card-title text-center mb-4">
                {isSignup ? 'Create Account' : 'Welcome Back'}
              </h1>
              
              {searchParams.message && (
                <div className={`alert ${isSignup || searchParams.message.includes('Check email') ? 'alert-info' : 'alert-danger'}`}>
                  {searchParams.message}
                </div>
              )}
              
              <form>
                <input type="hidden" name="redirectTo" value={redirectTo} />
                <div className="mb-3">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="••••••••"
                    required
                    minLength={isSignup ? 8 : undefined}
                  />
                  {isSignup && (
                    <small className="form-text text-muted">
                      Password must be at least 8 characters long.
                    </small>
                  )}
                </div>
                <div className="d-grid gap-2">
                  {isSignup ? (
                    <>
                      <button formAction={signup} className="btn btn-primary">Sign Up</button>
                      <Link href={`/login${redirectTo !== '/account' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`} className="btn btn-outline-secondary">
                        Already have an account? Sign In
                      </Link>
                    </>
                  ) : (
                    <>
                      <button formAction={login} className="btn btn-primary">Sign In</button>
                      <Link href={`/login?signup=true${redirectTo !== '/account' ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''}`} className="btn btn-outline-primary">
                        Sign Up
                      </Link>
                      <div className="text-center mt-3">
                        <Link href="/forgot-password">Forgot password?</Link>
                      </div>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 