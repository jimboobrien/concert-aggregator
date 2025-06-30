'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { type User } from '@supabase/supabase-js'

export default function AccountForm({ user }: { user: User }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fullname, setFullname] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [hometown, setHometown] = useState<string | null>(null)

  const getProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`full_name, username, hometown`)
        .eq('id', user.id)
        .single()

      if (error && status !== 406) {
        console.error('Error loading user data:', error);
        alert('Error loading user data!');
        return;
      }

      if (data) {
        setFullname(data.full_name);
        setUsername(data.username);
        setHometown(data.hometown);
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
      alert('An unexpected error occurred while loading user data.');
    } finally {
      setLoading(false);
    }
  }, [user, supabase])

  useEffect(() => {
    getProfile()
  }, [getProfile])

  async function updateProfile() {
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullname,
        username,
        hometown,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error('Error updating profile:', error);
        alert('Error updating the data!');
        return;
      }
      alert('Profile updated!');
    } catch (error) {
      console.error('An unexpected error occurred:', error);
      alert('An unexpected error occurred while updating the profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mt-3">
      <div className="card-body">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="text" value={user?.email} className="form-control" disabled />
        </div>
        <div className="form-group mt-3">
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            type="text"
            value={fullname || ''}
            onChange={(e) => setFullname(e.target.value)}
            className="form-control"
            disabled={loading}
          />
        </div>
        <div className="form-group mt-3">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username || ''}
            onChange={(e) => setUsername(e.target.value)}
            className="form-control"
            disabled={loading}
          />
        </div>
        <div className="form-group mt-3">
          <label htmlFor="hometown">Hometown</label>
          <input
            id="hometown"
            type="text"
            value={hometown || ''}
            onChange={(e) => setHometown(e.target.value)}
            className="form-control"
            placeholder="e.g., Nashville, TN"
            disabled={loading}
          />
        </div>

        <div className="mt-4 d-flex justify-content-between">
          <button
            className="btn btn-primary"
            onClick={() => updateProfile()}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Update Profile'}
          </button>
          <form action="/auth/signout" method="post">
            <button className="btn btn-secondary" type="submit" disabled={loading}>
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}