import { updatePassword } from '@/actions/auth'

export default async function UpdatePasswordPage({ searchParams }: { searchParams: { message: string } }) {
  const isError = searchParams?.message?.toLowerCase().includes('error');
  
  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card mt-5">
            <div className="card-body">
              <h1 className="card-title text-center mb-4">Update Password</h1>
              <p className="text-muted text-center mb-4">
                Enter your new password below.
              </p>
              
              {searchParams?.message && (
                <div className={`alert ${isError ? 'alert-danger' : 'alert-info'}`}>
                  {searchParams.message}
                </div>
              )}
              
              <form>
                <div className="mb-3">
                  <label htmlFor="password">New Password</label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                  <small className="form-text text-muted">
                    Password must be at least 8 characters long.
                  </small>
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    className="form-control"
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                </div>
                <div className="d-grid">
                  <button formAction={updatePassword} className="btn btn-primary">Update Password</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 