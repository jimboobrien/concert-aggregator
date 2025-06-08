'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { type User } from '@supabase/supabase-js'

export default function ProfileForm({ user }: { user: User }) {
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

  return (
    <div className="card mt-3">
      <div className="card-body">
        {loading ? (
          <p>Loading profile...</p>
        ) : (
          <div>
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
                className="form-control"
                disabled
              />
            </div>
            <div className="form-group mt-3">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username || ''}
                className="form-control"
                disabled
              />
            </div>
            <div className="form-group mt-3">
              <label htmlFor="hometown">Hometown</label>
              <input
                id="hometown"
                type="text"
                value={hometown || ''}
                className="form-control"
                disabled
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 