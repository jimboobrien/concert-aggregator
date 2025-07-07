'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { type User } from '@supabase/supabase-js'
import { updateProfile } from '@/actions/auth'
import { useSearchParams } from 'next/navigation'

export default function ProfileForm({ user }: { user: User }) {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const error = searchParams.get('error')

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [fullname, setFullname] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [hometown, setHometown] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUpdating(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      await updateProfile(formData)
    } finally {
      setUpdating(false)
      setEditMode(false)
    }
  }

  return (
    <div className="card mt-3">
      <div className="card-body">
        {message && (
          <div className="alert alert-success" role="alert">
            {message}
          </div>
        )}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <p>Loading profile...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="text" value={user?.email} className="form-control" disabled />
            </div>
            <div className="form-group mt-3">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={fullname || ''}
                onChange={(e) => setFullname(e.target.value)}
                className="form-control"
                disabled={!editMode}
              />
            </div>
            <div className="form-group mt-3">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                value={username || ''}
                onChange={(e) => setUsername(e.target.value)}
                className="form-control"
                disabled={!editMode}
              />
              {editMode && (
                <small className="form-text text-muted">
                  Username must be at least 3 characters and contain only letters, numbers, and underscores.
                </small>
              )}
            </div>
            <div className="form-group mt-3">
              <label htmlFor="hometown">Hometown</label>
              <input
                id="hometown"
                name="hometown"
                type="text"
                value={hometown || ''}
                onChange={(e) => setHometown(e.target.value)}
                className="form-control"
                disabled={!editMode}
              />
            </div>
            
            <div className="mt-3">
              {!editMode ? (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => setEditMode(true)}
                >
                  Edit Profile
                </button>
              ) : (
                <div className="d-flex gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-success" 
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setEditMode(false)
                      getProfile() // Reset to original values
                    }}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
} 