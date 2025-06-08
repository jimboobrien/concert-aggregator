import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card mt-5">
            <div className="card-body">
              <h1 className="card-title text-center mb-4">Login</h1>
              <form>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email:</label>
                  <input id="email" name="email" type="email" className="form-control" required />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password:</label>
                  <input id="password" name="password" type="password" className="form-control" required />
                </div>
                <div className="d-grid gap-2">
                  <button formAction={login} className="btn btn-primary">Log in</button>
                  <button formAction={signup} className="btn btn-secondary">Sign up</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 