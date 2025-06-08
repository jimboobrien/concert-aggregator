'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { type User } from '@supabase/supabase-js'

export default function AccountForm({ user }: { user: User }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [fullname, setFullname] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [hometown, setHometown] = useState<string | null>(null)

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`full_name, username, hometown`)
        .eq('id', user.id)
        .single()

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setFullname(data.full_name)
        setUsername(data.username)
        setHometown(data.hometown)
      }
    } catch {
      alert('Error loading user data!')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    getProfile()
  }, [user, getProfile])

  async function updateProfile({
    username,
    hometown,
  }: {
    username: string | null
    fullname: string | null
    hometown: string | null
  }) {
    try {
      setLoading(true)

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullname,
        username,
        hometown,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
      alert('Profile updated!')
    } catch {
      alert('Error updating the data!')
    } finally {
      setLoading(false)
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
          />
        </div>

        <div className="mt-4">
          <button
            className="btn btn-primary"
            onClick={() => updateProfile({ fullname, username, hometown })}
            disabled={loading}
          >
            {loading ? 'Loading ...' : 'Update'}
          </button>
        </div>

        <div className="mt-2">
          <form action="/auth/signout" method="post">
            <button className="btn btn-secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
} 