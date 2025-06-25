import { requestPasswordReset } from './actions'
import Link from 'next/link'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { message: string | undefined }
}) {
  const message = searchParams?.message

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card mt-5">
            <div className="card-body">
              <h1 className="card-title text-center mb-4">Forgot Password</h1>
              <p className="text-muted text-center mb-4">
                Enter your email address and we will send you a link to reset your password.
              </p>
              <form>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email:</label>
                  <input id="email" name="email" type="email" className="form-control" placeholder="you@example.com" required />
                </div>
                <div className="d-grid">
                  <button formAction={requestPasswordReset} className="btn btn-primary">Send Reset Link</button>
                </div>
              </form>
              {message && (
                <p className="mt-4 p-4 bg-light text-center rounded">
                  {message}
                </p>
              )}
               <div className="text-center mt-3">
                  <Link href="/login">Back to Login</Link>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 