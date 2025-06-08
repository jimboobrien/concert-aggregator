'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createClient()

  // For the PKCE flow, we need to provide a redirect URL to our app.
  // The user will be sent to this URL after clicking the link in the email.
  // Our generic callback handler will exchange the code and redirect to the 'next' URL.
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/update-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    console.error('Error sending password reset email:', error)
    return redirect('/forgot-password?message=Error: Could not send password reset email. Please try again.')
  }

  return redirect('/forgot-password?message=If an account exists for this email, a password reset link has been sent.')
} 