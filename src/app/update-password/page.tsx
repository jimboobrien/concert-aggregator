import { updatePassword } from './actions'

export default async function UpdatePasswordPage({ searchParams }: { searchParams: { message: string } }) {
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
              <form>
                <div className="mb-3">
                  <label htmlFor="password">New Password</label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="••••••••"
                    required
                  />
                </div>
                 <div className="mb-3">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    className="form-control"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="d-grid">
                  <button formAction={updatePassword} className="btn btn-primary">Update Password</button>
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