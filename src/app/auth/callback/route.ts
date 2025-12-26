import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { resend, FROM_EMAIL, REPLY_TO } from '@/lib/resend'
import WelcomeEmail from '@/emails/WelcomeEmail'

async function handleAuthenticatedUser(supabase: Awaited<ReturnType<typeof createClient>>, origin: string) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Check if user has a profile and if onboarding is completed
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed, welcome_email_sent')
      .eq('id', user.id)
      .single()

    // If user has completed onboarding, go to dashboard
    if (profile?.onboarding_completed) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    // Send welcome email for new users (only once)
    if (!profile?.welcome_email_sent && user.email) {
      try {
        const userName = user.user_metadata?.full_name || 
                       user.email.split('@')[0] || 
                       'there'
        
        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email,
          subject: 'Welcome to Willpowered! 🚀',
          react: WelcomeEmail({ userName }),
          replyTo: REPLY_TO,
        })

        // Mark welcome email as sent
        await supabase
          .from('profiles')
          .update({ welcome_email_sent: true })
          .eq('id', user.id)
      } catch (emailError) {
        // Don't block auth flow if email fails
        console.error('Failed to send welcome email:', emailError)
      }
    }

    // Go to onboarding (for new users after email verification)
    return NextResponse.redirect(`${origin}/onboarding`)
  }
  
  return null
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const error_description = searchParams.get('error_description')

  const supabase = await createClient()

  // Check if there was an error from Supabase
  if (error_description) {
    console.error('Auth error from Supabase:', error_description)
    return NextResponse.redirect(`${origin}/login?error=auth_failed&message=${encodeURIComponent(error_description)}`)
  }

  // First, check if user is already authenticated (Supabase may have set session already)
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    const result = await handleAuthenticatedUser(supabase, origin)
    if (result) return result
  }

  // Handle PKCE code exchange (OAuth and some email flows)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const result = await handleAuthenticatedUser(supabase, origin)
      if (result) return result
    } else {
      console.error('Code exchange error:', error)
    }
  }
  
  // Handle token hash verification (email confirmation flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email',
    })
    if (!error) {
      const result = await handleAuthenticatedUser(supabase, origin)
      if (result) return result
    } else {
      console.error('OTP verification error:', error)
    }
  }

  // If we get here with no auth params, check one more time if session exists
  // (handles edge case where Supabase redirects without params but session is set)
  const { data: { session: finalCheck } } = await supabase.auth.getSession()
  if (finalCheck) {
    const result = await handleAuthenticatedUser(supabase, origin)
    if (result) return result
  }

  // No valid auth - redirect to login with error message
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
