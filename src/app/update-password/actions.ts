'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const supabase = await createClient()

  if (password !== confirmPassword) {
    return redirect('/update-password?message=Error: Passwords do not match.')
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error('Error updating password:', error)
    return redirect('/update-password?message=Error: Could not update password. Please try again.')
  }

  // Redirect to the account page with a success message.
  // The sign-out/sign-in is a good practice to ensure the user session is fully refreshed.
  await supabase.auth.signOut()
  return redirect('/login?message=Your password has been updated successfully. Please sign in again.')
} 