import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { resend, FROM_EMAIL, REPLY_TO } from '@/lib/resend'
import WelcomeEmail from '@/emails/WelcomeEmail'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') // 'signup', 'recovery', 'invite', 'magiclink', etc.
  const redirect = searchParams.get('redirect') || '/onboarding'

  const supabase = await createClient()
  let authError = null

  // Handle PKCE code exchange (OAuth flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    authError = error
  }
  
  // Handle token hash verification (email confirmation flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email',
    })
    authError = error
  }

  // If we had an auth method and it succeeded
  if ((code || token_hash) && !authError) {
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
    
    // User authenticated but no user object - go to intended redirect
    return NextResponse.redirect(`${origin}${redirect}`)
  }
  
  // Log error for debugging
  if (authError) {
    console.error('Auth callback error:', authError)
  }

  // No valid auth params or error - redirect to login with error message
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
