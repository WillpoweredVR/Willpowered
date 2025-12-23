import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/onboarding'
  const type = searchParams.get('type') // 'signup', 'recovery', 'invite', etc.

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      // Successfully authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user has a profile and if onboarding is completed
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        // If user has completed onboarding, go to dashboard
        if (profile?.onboarding_completed) {
          return NextResponse.redirect(`${origin}/dashboard`)
        }

        // Otherwise, go to onboarding (for new users after email verification)
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      
      // Fallback redirect
      return NextResponse.redirect(`${origin}${redirect}`)
    }
    
    // If there was an error exchanging the code
    console.error('Auth callback error:', error)
  }

  // No code or error - redirect to login with error message
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
