import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AccountForm from './account-form'

export default async function AccountPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card mt-5">
            <div className="card-body">
              <h1 className="card-title">Account</h1>
              <p>Manage your account settings and profile information.</p>
            </div>
          </div>
          <AccountForm user={user} />
        </div>
      </div>
    </div>
  )
} 