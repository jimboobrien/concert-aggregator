import { login, signup } from './actions'
import Link from 'next/link'

export default async function LoginPage({ searchParams }: { searchParams: { message: string } }) {
  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card mt-5">
            <div className="card-body">
              <h1 className="card-title text-center mb-4">Welcome Back</h1>
              <form>
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
                  />
                </div>
                <div className="d-grid gap-2">
                  <button formAction={login} className="btn btn-primary">Sign In</button>
                  <button formAction={signup} className="btn btn-outline-primary">Sign Up</button>
                </div>
                <div className="text-center mt-3">
                  <Link href="/forgot-password">Forgot password?</Link>
                </div>
              </form>
              {searchParams?.message && (
                <p className="mt-4 p-4 bg-light text-center rounded">
                  {searchParams.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 